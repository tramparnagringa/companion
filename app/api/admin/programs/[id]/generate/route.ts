import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Anthropic from '@anthropic-ai/sdk'
import { recordTokenUsage } from '@/lib/anthropic/check-tokens'

// Detect the current phase based on what's already in the program.
// outline  — no days yet, or only stub days (name = "Dia N")
// week     — outline exists, need to flesh out week by week
// refine   — everything filled in, small edits
function detectPhase(days: any[]): 'outline' | 'week' | 'refine' {
  if (days.length === 0) return 'outline'
  const hasFullContent = days.some(d => d.ai_instructions && d.cards?.length > 0)
  return hasFullContent ? 'refine' : 'week'
}

function buildSystemPrompt(program: any, phase: 'outline' | 'week' | 'refine'): string {
  const days = (program.program_days as unknown as any[]).sort((a, b) => a.day_number - b.day_number)

  const outlineSummary = days.length > 0
    ? days.map((d: any) => `Dia ${d.day_number} (Semana ${d.week_number}): ${d.name}${d.description ? ` — ${d.description}` : ''}`).join('\n')
    : 'Nenhum dia configurado ainda.'

  const weeksSummary = (() => {
    if (days.length === 0) return ''
    const filled = days.filter((d: any) => d.ai_instructions && d.cards?.length > 0)
    const pending = days.filter((d: any) => !d.ai_instructions || !d.cards?.length)
    return `\nDias com conteúdo completo: ${filled.length}/${days.length}\nDias sem conteúdo: ${pending.map((d: any) => d.day_number).join(', ') || 'nenhum'}`
  })()

  const base = `Você é um assistente especializado em criar programas de desenvolvimento de carreira para profissionais que buscam vagas internacionais.
Programa: "${program.name}" — ${program.total_days} dias.

## COMO SALVAR DADOS — LEIA COM ATENÇÃO
Você NÃO tem acesso a funções ou ferramentas. Você não chama update_profile, save_day_output nem nada parecido.
O único mecanismo de persistência é: **quando você escreve um bloco \`\`\`json ... \`\`\` na sua resposta, o sistema automaticamente lê, parseia e salva no banco**.
Portanto: se você não escrever o bloco JSON, NADA é salvo. Se você escrever o bloco JSON corretamente, TUDO é salvo automaticamente.
Nunca diga "salvei" sem ter incluído o bloco JSON na resposta.`

  if (phase === 'outline') {
    return `${base}

## Fase atual: OUTLINE
O programa ainda não tem dias. Crie o esqueleto completo — apenas nomes e descrições curtas, sem ai_instructions ou cards ainda.

Estado atual: ${outlineSummary}

Quando o admin pedir o outline, inclua na resposta um bloco \`\`\`json com este formato exato:
\`\`\`json
{
  "phase": "outline",
  "days": [
    { "day_number": 1, "week_number": 1, "name": "Nome curto", "description": "Uma frase descrevendo o foco do dia." }
  ]
}
\`\`\`

Regras:
- description: máximo 1 frase
- NÃO inclua ai_instructions nem cards agora
- Agrupe os dias em semanas com temas coerentes
- Depois do bloco JSON, liste os temas de cada semana em 1 linha
- Aguarde aprovação antes de sugerir avançar para a próxima fase`
  }

  if (phase === 'week') {
    return `${base}

## Fase atual: GERAÇÃO POR SEMANA
O outline existe. Gere o conteúdo completo de UMA semana por vez, esperando aprovação a cada semana.

Outline atual:
${outlineSummary}
${weeksSummary}

## TIPOS DE CARD — leia com atenção antes de gerar

O app tem 3 tipos de card que formam o fluxo de cada dia:

| tipo      | UI no app                                                           | quando usar                                              |
|-----------|---------------------------------------------------------------------|----------------------------------------------------------|
| "learn"   | Exibe o texto + botão "Aprofundar com IA" (aprofundamento opcional) | Conceito ou contexto que o aluno precisa antes de agir   |
| "action"  | Exibe o texto + botão "Executar com IA" (sessão principal)          | A tarefa principal do dia — sempre executada com a IA    |
| "reflect" | Exibe o texto + botão "Reflexão do dia" (depoimento/debrief)        | Fechamento do dia ou retro de semana — captura aprendizados |

> O tipo "ai" existe mas está descontinuado — use "action" no lugar.

Fluxo padrão de um dia: **learn → action** (obrigatório) → reflect (apenas em retros ou fins de semana)

Regras de composição:
- Todo dia deve ter exatamente 1 card "action" (é a sessão principal com a IA)
- Se o dia precisa de contexto antes da sessão, adicione 1 card "learn" antes
- Card "reflect" apenas em dias de retro ou fechamento de semana — não todo dia
- Máximo 3 cards por dia (learn + action + reflect); mínimo 1 (só action)
- O campo "description" descreve o que o aluno vai fazer com a IA naquela sessão (2-4 frases diretas)

Quando o admin pedir uma semana, inclua na resposta um bloco \`\`\`json com este formato:
\`\`\`json
{
  "phase": "week",
  "days": [
    {
      "day_number": 8,
      "week_number": 2,
      "name": "Nome igual ao outline",
      "description": "2-3 frases descrevendo o dia",
      "ai_instructions": "Instruções detalhadas para a IA conduzir a sessão: objetivo do dia, perguntas que deve fazer ao aluno, o que deve extrair, como deve fechar o dia.",
      "cards": [
        { "type": "learn",   "title": "Por que isso importa",   "description": "Contexto ou conceito que prepara o aluno para a sessão." },
        { "type": "action",  "title": "Sessão principal com IA", "description": "O que o aluno vai construir ou extrair nesta sessão com a IA. Descreva o objetivo, o que a IA vai perguntar e o que o aluno vai produzir." }
      ]
    }
  ]
}
\`\`\`

- MÁXIMO 7 dias por resposta (uma semana)
- ai_instructions: descreva o comportamento esperado da IA, não liste ferramentas
- Depois do bloco JSON, confirme o que foi gerado e pergunte se avança para a próxima semana`
  }

  return `${base}

## Fase atual: REFINAMENTO
O programa está completo. Ajude o admin a melhorar dias específicos.

Outline:
${outlineSummary}
${weeksSummary}

## TIPOS DE CARD (lembre ao editar)
- "learn"   → exibe texto + botão "Aprofundar com IA" (conceito/contexto)
- "ai"      → exibe texto + botão "Iniciar sessão com mentor IA" (sessão principal)
- "action"  → description vira item de checklist (tarefa concreta fora do app)
- "reflect" → exibe texto + botão "Reflexão guiada" (fechamento/retro)

Para editar dias, inclua na resposta um bloco \`\`\`json com apenas os dias alterados:
\`\`\`json
{
  "phase": "refine",
  "days": [{ "day_number": 3, "name": "...", "description": "...", "ai_instructions": "...", "cards": [] }]
}
\`\`\`

Converse para entender o que precisa mudar antes de gerar o JSON.`
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const callerId = user.id

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin'].includes(profile?.role ?? '')) return new Response('Forbidden', { status: 403 })

  const service = createServiceClient()
  const { data: program } = await service
    .from('programs')
    .select('*, program_days(*)')
    .eq('id', id)
    .single()

  if (!program) return new Response('Not found', { status: 404 })

  const { messages } = await req.json() as { messages: Anthropic.MessageParam[] }

  const days = (program.program_days as unknown as any[]).sort((a, b) => a.day_number - b.day_number)
  const phase = detectPhase(days)
  const systemPrompt = buildSystemPrompt(program, phase)

  // Anthropic requires messages to start with 'user'
  const filteredMessages = messages.filter((m, i) => !(i === 0 && m.role === 'assistant'))

  const anthropic = new Anthropic()
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: systemPrompt,
    messages: filteredMessages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let fullText = ''

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text
          fullText += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`))
        }

        if (event.type === 'message_stop') {
          const jsonMatch = fullText.match(/```json\n?([\s\S]*?)\n?```/)
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1])
              if (parsed.days && Array.isArray(parsed.days)) {
                for (const day of parsed.days) {
                  await service.from('program_days').upsert({
                    program_id: id,
                    day_number: day.day_number,
                    week_number: day.week_number ?? Math.ceil(day.day_number / 7),
                    name: day.name,
                    description: day.description ?? null,
                    ai_instructions: day.ai_instructions ?? null,
                    cards: day.cards ?? [],
                    ai_model: 'claude-sonnet-4-6',
                    ai_max_tokens: 1024,
                  }, { onConflict: 'program_id,day_number' })
                }
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ type: 'days_saved', count: parsed.days.length, phase: parsed.phase })}\n\n`
                ))
              }
            } catch (e) {
              console.error('[generate] JSON parse error', e)
            }
          }

          // Send the detected phase so the UI can show context-aware hints
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      }

      const finalMsg = await stream.finalMessage()
      const input  = finalMsg.usage.input_tokens
      const output = finalMsg.usage.output_tokens
      await recordTokenUsage(callerId, input + output, 'program_generation', { program_id: id }, 'claude-sonnet-4-6', input, output)
    }
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
