export function sessionSummaryPrompt(conversationText: string): string {
  return `Extraia o que aconteceu nesta conversa entre um aluno e um coach de carreira com IA.
Foque em: o que o aluno trabalhou, entregas ou textos produzidos, bloqueios ou decisões tomadas.
Seja específico e concreto. Sem marcação temporal ("nesta sessão", "hoje") — apenas fatos.
Responda em português.

Conversa:
${conversationText}`
}

export function contextUpdatePrompt(
  programName: string,
  totalDays: number,
  currentContext: string | null,
  summary: string
): string {
  return `Você mantém um snapshot de perfil sobre um aluno inscrito em "${programName}" (${totalDays} dias).

Perfil atual:
${currentContext ?? 'Nenhum perfil ainda.'}

Novas informações de uma conversa recente:
${summary}

Atualize o perfil incorporando as novas informações. Use markdown com seções, bullets e negrito. Siga exatamente este formato como exemplo:

---

## Informações Básicas
- **Nome:** [nome]
- **Programa:** [nome do programa] — Dia [X] de [total]
- **Localização:** [onde está ou quer trabalhar]
- **Idioma:** [nível de inglês e outras línguas]

## Situação Profissional
- **Cargo(s):** [cargo(s) atual(is)]
- **Experiência:** [anos e áreas]
- **Carga horária:** [horas/semana se relevante]

**Situação financeira:**
- Renda atual: [valor]
- Meta salarial: [valor]

## Competências
**Tipo de profissional:** [perfil geral]

**Competências validadas:**
- [competência 1]
- [competência 2]

## ICI — Índice de Competitividade Internacional
**Score geral:** [X]/10

| Dimensão | Score |
|---|---|
| [dimensão] | [X]/10 |

**Veredicto:** [frase curta sobre o perfil]

## Bloqueios Identificados
**Bloqueio principal:** [descrição]
- [detalhe]
- [detalhe]

## Produções Realizadas
**[Nome do programa] — Dia [X]:**
- [entrega 1]
- [entrega 2]

## Decisões Tomadas
- [decisão 1]
- [decisão 2]

## Próximos Passos
[descrição do próximo dia ou ação pendente]

---

Inclua apenas seções com informação real — omita seções sem dados. Atualize o que mudou; mantenha o que ainda é válido. Responda em português.`
}
