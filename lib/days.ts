export type CardType = 'learn' | 'ai' | 'action' | 'reflect'

export interface CheckItem {
  label: string
}

export interface DayCard {
  type: CardType
  title: string
  preview: string
  timeEst?: string
  tokenCost?: number
  content: { heading?: string; body: string }[]
  checklist?: CheckItem[]
  cta?: { label: string; href: string }
}

export interface DayDefinition {
  number: number
  week: number
  name: string
  description: string
  cards: DayCard[]
}

export const DAYS: DayDefinition[] = [

  // ── SEMANA 1 — Clareza ──────────────────────────────────────────────────────

  {
    number: 1, week: 1,
    name: 'Diagnóstico',
    description: 'Antes de construir qualquer coisa, você precisa saber onde está. Hoje a IA lê seu CV como um recrutador internacional leria — sem filtro.',
    cards: [
      {
        type: 'learn',
        title: 'O que recrutadores internacionais veem primeiro',
        preview: 'Os primeiros 6 segundos de leitura — o que sobrevive e o que vai para o lixo',
        timeEst: '4 min',
        content: [
          { heading: 'A triagem automática', body: 'A maioria das empresas grandes usa ATS (Applicant Tracking System) antes de qualquer olho humano ver seu CV. Sem as keywords certas, você nem chega ao recrutador.' },
          { heading: 'O que importa nos primeiros 6 segundos', body: 'Recrutadores escaneiam: cargo atual, empresas anteriores, anos de experiência, e se há números de resultado visíveis. Tudo o mais é detalhamento.' },
          { heading: 'O problema do CV brasileiro', body: 'CVs brasileiros tendem a ser descritivos ("responsável por...") em vez de orientados a resultado ("reduziu o tempo de deploy em 40%"). Isso custa entrevistas.' },
        ],
      },
      {
        type: 'ai',
        title: 'Analisar seu CV com IA',
        preview: 'Cole seu CV → diagnóstico completo + extração do seu perfil',
        timeEst: '~20 min', tokenCost: 1200,
        content: [
          { heading: 'O que vai acontecer', body: 'Você cola o texto do seu CV (ou descreve sua experiência). A IA analisa como um recrutador internacional, aponta os 3 maiores problemas, e extrai seu Perfil de Candidato — a base de tudo que vem a seguir.' },
          { heading: 'Dica', body: 'Cole o CV completo em texto corrido. Não precisa formatar — só o conteúdo importa agora.' },
        ],
        cta: { label: '✦ Iniciar análise', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Primeiros passos',
        preview: '2 ações para fechar o dia',
        timeEst: '~5 min',
        content: [{ body: 'Com o diagnóstico em mãos, você já sabe o que precisa mudar. Anote os 3 pontos críticos identificados.' }],
        checklist: [
          { label: 'Anotar os 3 problemas críticos do meu CV' },
          { label: 'Postar meu perfil extraído na comunidade' },
        ],
      },
    ],
  },

  {
    number: 2, week: 1,
    name: 'Onde estão as vagas',
    description: 'Saber onde procurar é metade do trabalho. Hoje você mapeia os canais certos para o seu perfil e para o mercado internacional.',
    cards: [
      {
        type: 'learn',
        title: 'O funil oculto do mercado internacional',
        preview: 'LinkedIn vs. job boards vs. referrals — onde estão as vagas de verdade',
        timeEst: '5 min',
        content: [
          { heading: 'O funil oculto', body: 'Até 70% das vagas nunca são publicadas. São preenchidas por referral ou hunting direto. Isso não significa ignorar os boards — significa usá-los como inteligência de mercado, não só como fonte de vagas.' },
          { heading: 'Job boards que funcionam', body: 'LinkedIn Jobs, Greenhouse, Lever, Workable, Remote.co, We Work Remotely. Para startups: Wellfound (ex-AngelList). Para big tech: os próprios career pages.' },
        ],
      },
      {
        type: 'ai',
        title: 'Mapear seus canais prioritários',
        preview: 'IA identifica os melhores canais para o seu perfil e cargo-alvo',
        timeEst: '~15 min', tokenCost: 800,
        content: [
          { heading: 'O que vai acontecer', body: 'Com base no seu perfil e cargo-alvo, a IA vai indicar os 3–5 canais de maior retorno para a sua busca específica — com critérios práticos de uso.' },
        ],
        cta: { label: '✦ Mapear canais', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Configurar alertas',
        preview: '3 ações para não perder vagas relevantes',
        timeEst: '~10 min',
        content: [{ body: 'Alertas bem configurados trazem vagas para você — você não precisa ficar procurando.' }],
        checklist: [
          { label: 'Criar alerta no LinkedIn com cargo-alvo + Remote' },
          { label: 'Criar alerta em 1 job board alternativo' },
          { label: 'Seguir 3 empresas-alvo no LinkedIn' },
        ],
      },
    ],
  },

  {
    number: 3, week: 1,
    name: 'Máquina de oportunidades',
    description: 'Caçar vaga todo dia é trabalho de baixo retorno. Hoje você configura o sistema uma vez e as vagas chegam até você — sem precisar caçar manualmente.',
    cards: [
      {
        type: 'learn',
        title: 'Boolean search e alertas automáticos',
        preview: 'Como dizer ao LinkedIn exatamente o que você quer — e ser avisado quando aparecer',
        timeEst: '4 min',
        content: [
          { heading: 'O que é boolean search', body: 'Uma forma de fazer buscas mais precisas usando operadores lógicos — AND, OR, NOT, aspas. Em vez de buscar "frontend developer", você busca: ("frontend developer" OR "front-end engineer") AND (React OR Vue) AND (remote OR "work from home").' },
          { heading: 'Alertas automáticos', body: 'Depois de fazer a busca no LinkedIn, salve-a como alerta. Defina frequência diária. A partir daí, toda vez que uma nova vaga aparecer com seus critérios, o LinkedIn te avisa. Configura uma vez. Funciona para sempre.' },
        ],
      },
      {
        type: 'ai',
        title: 'Gerar suas boolean searches',
        preview: 'IA cria 3 combinações prontas para usar no LinkedIn + instrução de alertas',
        timeEst: '~15 min', tokenCost: 600,
        content: [
          { heading: 'O que vai acontecer', body: 'Com base no seu perfil, a IA gera 3 boolean searches prontas para copiar e colar no LinkedIn Jobs — considerando cargo-alvo, stack principal e preferência por remote ou relocation. Para cada uma, explica o que ela vai trazer de diferente.' },
        ],
        cta: { label: '✦ Gerar buscas', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Configurar alertas',
        preview: '2 ações para nunca perder uma vaga relevante',
        timeEst: '~10 min',
        content: [{ body: 'Daqui para frente, vagas vão aparecer no seu email ou celular todos os dias. O que importa não é a vaga perfeita aparecer amanhã. É você estar presente quando ela aparecer.' }],
        checklist: [
          { label: 'Salvar as 3 boolean searches nos campos Boolean Searches do TNG OS' },
          { label: 'Configurar alertas no LinkedIn para cada uma das 3 buscas' },
        ],
      },
    ],
  },

  {
    number: 4, week: 1,
    name: 'Analisar uma vaga',
    description: 'A vaga te diz exatamente o que o mercado quer. Hoje você aprende a separar o que importa do que não importa — e a construir seu banco de keywords.',
    cards: [
      {
        type: 'learn',
        title: 'A vaga como mapa do mercado',
        preview: 'Keywords obrigatórias vs. desejáveis — a regra dos 70%',
        timeEst: '3 min',
        content: [
          { heading: 'O que importa numa vaga', body: 'Um job description tem ruído. Tem requisito obrigatório e requisito que é desejo. Aprenda a separar o que bloqueia sua candidatura do que só seria um diferencial.' },
          { heading: 'A regra dos 70%', body: 'Nenhum candidato tem 100% do que uma vaga pede. Os recrutadores sabem disso. Se você tem 70% dos requisitos obrigatórios — aplica.' },
        ],
      },
      {
        type: 'ai',
        title: 'Analisar uma vaga',
        preview: 'Cole o JD → fit score, keywords, recomendação de aplicação',
        timeEst: '~15 min', tokenCost: 1200,
        content: [
          { heading: 'O que vai acontecer', body: 'Você cola o texto de uma vaga. A IA cruza com seu perfil, calcula o fit score, identifica onde você é forte e onde está vulnerável, extrai keywords para o seu banco e cria a entrada no board automaticamente.' },
          { heading: 'Dica', body: 'Cole o job description completo — quanto mais texto, mais precisa é a análise.' },
        ],
        cta: { label: '✦ Analisar vaga', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Executar e registrar',
        preview: '3 ações para fechar o dia',
        timeEst: '~10 min',
        content: [{ body: 'Com a análise feita, o board é atualizado automaticamente. Agora é executar.' }],
        checklist: [
          { label: 'Analisar pelo menos 1 vaga com a IA' },
          { label: 'Postar top 5 keywords descobertas na comunidade' },
          { label: 'Decidir: aplicar ou não para a vaga analisada' },
        ],
      },
    ],
  },

  {
    number: 5, week: 1,
    name: 'O seu mercado',
    description: 'Candidatura genérica é candidatura invisível. Hoje você define com precisão qual é o seu cargo-alvo — e calibra as expectativas com a realidade do mercado.',
    cards: [
      {
        type: 'learn',
        title: 'Por que "estou aberto a oportunidades" não funciona',
        preview: 'A diferença entre candidatura genérica e candidatura cirúrgica',
        timeEst: '4 min',
        content: [
          { heading: 'O custo da generidade', body: 'Quando você é tudo para todos, você é nada para ninguém. Recrutadores procuram candidatos que parecem made for this role.' },
          { heading: 'Cargo-alvo vs. cargo sonho', body: 'O cargo-alvo é o próximo passo lógico na sua carreira, não o ponto de chegada. Deve ser alcançável em 6–12 meses de busca ativa.' },
        ],
      },
      {
        type: 'ai',
        title: 'Definir e calibrar seu cargo-alvo',
        preview: 'Conversa guiada para definir role, seniority e mercado com dados reais',
        timeEst: '~20 min', tokenCost: 900,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai cruzar seu perfil com os dados de vagas analisadas até agora, calibrar seniority, e confirmar (ou ajustar) o cargo-alvo com base no que o mercado está pagando e contratando.' },
        ],
        cta: { label: '✦ Calibrar cargo-alvo', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Publicar seu alvo',
        preview: '2 ações de comprometimento',
        timeEst: '~5 min',
        content: [{ body: 'Comprometimento público aumenta execução.' }],
        checklist: [
          { label: 'Definir cargo-alvo, seniority e 2 regiões prioritárias' },
          { label: 'Postar na comunidade: "Meu alvo é [cargo] em [região]"' },
        ],
      },
    ],
  },

  {
    number: 6, week: 1,
    name: 'Proposta de valor',
    description: 'Por que você e não outro candidato? Hoje você formula a resposta — em uma frase que um recrutador consegue lembrar.',
    cards: [
      {
        type: 'learn',
        title: 'O que é value proposition e por que você precisa de uma',
        preview: 'A diferença entre "sou desenvolvedor" e "eu resolvo X para empresas Y"',
        timeEst: '5 min',
        content: [
          { heading: 'Value proposition não é elevator pitch', body: 'Não é um discurso que você decora. É a lente através da qual você enxerga e comunica sua carreira. Uma vez clara, ela aparece naturalmente em entrevistas, emails, e LinkedIn.' },
          { heading: 'A estrutura básica', body: '"Eu ajudo [tipo de empresa] a [resultado concreto] através de [seu diferencial específico]." Simples. Específica. Verificável.' },
        ],
      },
      {
        type: 'ai',
        title: 'Formular sua value proposition',
        preview: 'Conversa guiada para chegar na sua proposta de valor em 3 versões',
        timeEst: '~25 min', tokenCost: 900,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai explorar seus resultados mais concretos dos últimos anos e ajudar a formular 3 versões da sua value proposition — curta (1 frase), média (2–3 frases), longa (parágrafo).' },
        ],
        cta: { label: '✦ Formular proposta', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Testar e publicar',
        preview: '2 ações de validação',
        timeEst: '~10 min',
        content: [{ body: 'A melhor value proposition é a que você consegue dizer naturalmente.' }],
        checklist: [
          { label: 'Escrever minha value proposition em 1 frase' },
          { label: 'Pedir feedback de 1 colega: isso me diferencia?' },
        ],
      },
    ],
  },

  {
    number: 7, week: 1,
    name: 'Retro',
    description: 'Primeira semana concluída. Hora de consolidar o que você aprendeu sobre você mesmo e sobre o mercado — antes de construir.',
    cards: [
      {
        type: 'reflect',
        title: 'O que a semana 1 revelou',
        preview: 'Consolidar aprendizados antes de avançar',
        timeEst: '5 min',
        content: [
          { heading: 'O que você tem agora', body: 'Diagnóstico do CV, perfil extraído, cargo-alvo definido, primeiras vagas analisadas, keywords iniciais no banco, value proposition formulada. Isso é mais do que a maioria tem depois de meses de busca desordenada.' },
          { heading: 'Por que retrospectiva importa', body: 'O cérebro consolida aprendizados quando para para refletir. Sem isso, você avança com clareza falsa.' },
        ],
      },
      {
        type: 'ai',
        title: 'Retrospectiva guiada',
        preview: 'IA conduz reflexão sobre clareza, bloqueios e próximos passos',
        timeEst: '~15 min', tokenCost: 600,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai fazer 3 perguntas sobre a semana: o que ficou mais claro, o que ainda gera dúvida, e qual é o maior obstáculo que você vê para a semana 2.' },
        ],
        cta: { label: '✦ Iniciar retrospectiva', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Fechar a semana',
        preview: '3 ações de encerramento',
        timeEst: '~10 min',
        content: [{ body: 'Encerrar bem uma semana é tão importante quanto começar bem a próxima.' }],
        checklist: [
          { label: 'Registrar 1 aprendizado que mudou minha perspectiva' },
          { label: 'Verificar: banco de keywords tem pelo menos 10 palavras?' },
          { label: 'Postar retrospectiva na comunidade' },
        ],
      },
    ],
  },

  // ── SEMANA 2 — Construir ────────────────────────────────────────────────────

  {
    number: 8, week: 2,
    name: 'Planning Semana 2',
    description: 'A semana 2 é sobre construir sua presença. Antes de começar, você define metas concretas e entende o que vai ser construído.',
    cards: [
      {
        type: 'learn',
        title: 'O que você vai construir esta semana',
        preview: 'CV reescrito, LinkedIn otimizado, AI fluency statements — o kit completo',
        timeEst: '3 min',
        content: [
          { heading: 'O objetivo da semana 2', body: 'Você sai desta semana com: CV em inglês com bullets no formato ACR, LinkedIn com headline e about otimizados, seção de skills atualizada, e AI fluency statements prontos para entrevistas.' },
          { heading: 'O critério de sucesso', body: 'No final da semana, seu CV e LinkedIn devem estar prontos para uma candidatura real. Não perfeitos — prontos.' },
        ],
      },
      {
        type: 'ai',
        title: 'Definir metas da semana',
        preview: 'IA ajuda a calibrar o que é realista para os próximos 6 dias',
        timeEst: '~10 min', tokenCost: 400,
        content: [
          { heading: 'O que vai acontecer', body: 'Com base no que foi feito na semana 1, a IA define as metas específicas da semana 2 — o que entregar, em que ordem, e como medir se você chegou lá.' },
        ],
        cta: { label: '✦ Planejar semana', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Comprometimento',
        preview: '2 ações de comprometimento público',
        timeEst: '~5 min',
        content: [{ body: 'Declarar intenção pública aumenta taxa de conclusão.' }],
        checklist: [
          { label: 'Postar na comunidade: minha meta da semana 2 é...' },
          { label: 'Bloquear na agenda: 1h diária para o bootcamp' },
        ],
      },
    ],
  },

  {
    number: 9, week: 2,
    name: 'CV: Narrativa',
    description: 'Bullets fracos custam entrevistas. Hoje você reescreve cada experiência no formato que recrutadores internacionais esperam.',
    cards: [
      {
        type: 'learn',
        title: 'O formato ACR: Ação + Contexto + Resultado',
        preview: 'Como transformar "responsável por" em bullets que geram entrevistas',
        timeEst: '4 min',
        content: [
          { heading: 'Por que bullets descritivos não funcionam', body: '"Responsável pelo desenvolvimento do sistema de pagamentos" não diz nada. Não tem escala, não tem resultado, não tem impacto.' },
          { heading: 'O formato que funciona', body: '"Liderei a migração do sistema de pagamentos de monolito para microserviços, reduzindo latência de 800ms para 120ms e aumentando uptime para 99.95%." Ação + Contexto + Resultado mensurável.' },
          { heading: 'E se não tiver número?', body: 'Estime. "Reduziu tempo de review em ~40%" é melhor que nenhum número.' },
        ],
      },
      {
        type: 'ai',
        title: 'Reescrever experiências com IA',
        preview: 'Percorrer cada empresa e reescrever em 3–5 bullets no formato ACR',
        timeEst: '~30 min', tokenCost: 1200,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai percorrer cada experiência de trabalho com você. Para cada empresa: role, projetos mais relevantes, resultados concretos. Em seguida, reescreve em 3–5 bullets no formato ACR e salva no seu CV.' },
        ],
        cta: { label: '✦ Reescrever CV', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Revisar e validar',
        preview: '2 ações de qualidade',
        timeEst: '~10 min',
        content: [{ body: 'A IA gera o rascunho — você valida. Nenhum bullet deve ir para o CV sem você confirmar que é verdadeiro.' }],
        checklist: [
          { label: 'Revisar todos os bullets gerados: são precisos?' },
          { label: 'Adicionar pelo menos 1 número concreto por empresa' },
        ],
      },
    ],
  },

  {
    number: 10, week: 2,
    name: 'CV: ATS',
    description: 'Um bom CV que não passa pelo ATS não existe. Hoje você otimiza o seu para ser encontrado — antes do olho humano.',
    cards: [
      {
        type: 'learn',
        title: 'Como o ATS funciona e o que ele elimina',
        preview: 'Parsing, keywords, e os erros de formatação que descartam candidatos automaticamente',
        timeEst: '4 min',
        content: [
          { heading: 'O que é ATS', body: 'Applicant Tracking System é o software que empresas usam para filtrar CVs antes de um recrutador ver qualquer coisa. Ele faz parsing do texto, busca keywords, e ranqueia candidatos.' },
          { heading: 'O que quebra o ATS', body: 'Tabelas, colunas, ícones, headers/footers, fontes não-padrão, e formatos de data inconsistentes causam falha no parsing. O CV pode ser excelente e nem ser lido.' },
          { heading: 'A estratégia de keywords', body: 'As keywords do JD devem aparecer no CV — exatamente como escritas na vaga, não como sinônimos. ATS não interpreta semântica.' },
        ],
      },
      {
        type: 'ai',
        title: 'Auditar e otimizar para ATS',
        preview: 'IA revisa seu CV para compliance com ATS e insere keywords estratégicas',
        timeEst: '~20 min', tokenCost: 900,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA verifica formatação, densidade de keywords, e estrutura do CV. Com base nas vagas analisadas até agora, insere as keywords mais frequentes nos lugares corretos.' },
        ],
        cta: { label: '✦ Otimizar para ATS', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Fechar o CV v1',
        preview: '3 ações para ter o CV pronto para aplicação',
        timeEst: '~15 min',
        content: [{ body: 'O CV não precisa ser perfeito — precisa passar pelo ATS e convencer o recrutador nos primeiros 6 segundos.' }],
        checklist: [
          { label: 'Exportar PDF em formato simples (sem tabelas)' },
          { label: 'Checar: nome do arquivo tem seu nome + cargo-alvo?' },
          { label: 'Compartilhar CV v1 na comunidade para feedback' },
        ],
      },
    ],
  },

  {
    number: 11, week: 2,
    name: 'LinkedIn: Headline e About',
    description: 'Seu LinkedIn é sua vitrine no mercado internacional. Hoje você reescreve as duas partes que recrutadores leem primeiro.',
    cards: [
      {
        type: 'learn',
        title: 'Como recrutadores usam o LinkedIn',
        preview: 'Busca por keywords, headline como filtro, about como primeiro contato',
        timeEst: '4 min',
        content: [
          { heading: 'Headline não é seu cargo', body: 'A headline aparece em buscas e em resultados. "Senior Frontend Developer" é genérico. "Senior Frontend · React · Remote-first · ex-Nubank" é específico e rankeia para termos que recrutadores usam.' },
          { heading: 'About como carta de apresentação curta', body: 'A seção About tem 2.600 caracteres. Use as primeiras 2–3 linhas para prender atenção — elas aparecem sem clicar em "ver mais".' },
        ],
      },
      {
        type: 'ai',
        title: 'Reescrever headline e about',
        preview: 'IA gera 3 versões de headline e rascunho completo do About',
        timeEst: '~20 min', tokenCost: 900,
        content: [
          { heading: 'O que vai acontecer', body: 'Com base no seu perfil e value proposition, a IA gera 3 opções de headline com diferentes ênfases e um rascunho completo da seção About — em inglês, otimizado para o mercado que você quer.' },
        ],
        cta: { label: '✦ Reescrever LinkedIn', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Atualizar o perfil',
        preview: '3 ações para publicar as mudanças',
        timeEst: '~15 min',
        content: [{ body: 'Não perfeccionize — publique e ajuste com o tempo.' }],
        checklist: [
          { label: 'Atualizar headline no LinkedIn' },
          { label: 'Atualizar seção About no LinkedIn' },
          { label: 'Verificar: perfil aparece em "Open to Work" para recrutadores?' },
        ],
      },
    ],
  },

  {
    number: 12, week: 2,
    name: 'LinkedIn: SEO',
    description: 'Ter um bom LinkedIn não basta — ele precisa ser encontrado. Hoje você ativa os sinais que fazem recrutadores chegarem até você.',
    cards: [
      {
        type: 'learn',
        title: 'Como o algoritmo do LinkedIn funciona para candidatos',
        preview: 'Open to Work, keywords, atividade — o que de fato move o ponteiro',
        timeEst: '4 min',
        content: [
          { heading: 'O que o algoritmo prioriza', body: 'Perfis com: foto profissional, 500+ conexões, atividade recente, keywords relevantes no headline e about, e Open to Work ativo aparecem mais em buscas de recrutadores.' },
          { heading: 'A alavanca mais subestimada', body: 'Skills com endorsements aumentam visibilidade em buscas por aquela skill. 5 endorsements já fazem diferença.' },
        ],
      },
      {
        type: 'ai',
        title: 'Auditoria de SEO do LinkedIn',
        preview: 'IA revisa seu perfil e aponta as 5 mudanças de maior impacto em visibilidade',
        timeEst: '~15 min', tokenCost: 600,
        content: [
          { heading: 'O que vai acontecer', body: 'Você descreve o estado atual do seu perfil. A IA faz uma auditoria baseada nos critérios de visibilidade e sugere as mudanças de maior impacto — com prioridade.' },
        ],
        cta: { label: '✦ Auditar perfil', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Implementar otimizações',
        preview: '4 ações de visibilidade',
        timeEst: '~20 min',
        content: [{ body: 'Foco nas mudanças de maior impacto — não em perfeição.' }],
        checklist: [
          { label: 'Ativar "Open to Work" para recrutadores (não público)' },
          { label: 'Adicionar ou atualizar top 5 skills' },
          { label: 'Pedir endorsements de 2 colegas para skills principais' },
          { label: 'Fazer 1 comentário relevante em post do setor' },
        ],
      },
    ],
  },

  {
    number: 13, week: 2,
    name: 'Fluência em AI',
    description: 'O mercado internacional tem um filtro invisível: você usa IA no seu trabalho? Hoje você aprende a comunicar isso corretamente.',
    cards: [
      {
        type: 'learn',
        title: 'AI fluency como diferencial competitivo',
        preview: 'Por que candidatos que usam IA no trabalho estão sendo preferidos',
        timeEst: '4 min',
        content: [
          { heading: 'O novo filtro', body: 'Recrutadores de empresas tech estão perguntando ativamente: "Como você usa IA no seu dia a dia?" Candidatos que não têm resposta concreta perdem pontos.' },
          { heading: 'Como comunicar sem exagerar', body: 'Não se trata de fingir expertise que você não tem. Se trata de articular o que você já faz — usar Copilot para refactoring, ChatGPT para documentação, Cursor para debugging — de forma concreta.' },
        ],
      },
      {
        type: 'ai',
        title: 'Formular suas AI fluency statements',
        preview: 'Criar 3 declarações concretas sobre como você usa IA no trabalho',
        timeEst: '~15 min', tokenCost: 700,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai explorar como você usa ferramentas de IA no trabalho hoje (ou poderia usar) e formular 3 declarações concretas — para usar em entrevistas, no LinkedIn, e no CV.' },
        ],
        cta: { label: '✦ Formular statements', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Inserir no CV e LinkedIn',
        preview: '2 ações para tornar AI fluency visível',
        timeEst: '~10 min',
        content: [{ body: 'AI fluency statements inseridos no CV e no About do LinkedIn aumentam relevância em buscas de empresas que valorizam isso.' }],
        checklist: [
          { label: 'Inserir 1 AI fluency statement no resumo do CV' },
          { label: 'Mencionar uso de IA no About do LinkedIn' },
        ],
      },
    ],
  },

  {
    number: 14, week: 2,
    name: 'Retro',
    description: 'Você tem um CV reescrito, LinkedIn otimizado, e presença construída. Hora de checar onde você está e preparar a semana de aplicação.',
    cards: [
      {
        type: 'reflect',
        title: 'Semana 2: construção da presença',
        preview: 'O que mudou no seu material e na sua postura',
        timeEst: '5 min',
        content: [
          { heading: 'O que você construiu', body: 'CV em inglês com bullets no formato ACR, otimizado para ATS, LinkedIn atualizado com headline, about e SEO, AI fluency statements prontos, value proposition clara.' },
          { heading: 'O teste', body: 'Se um recrutador encontrasse seu perfil hoje, você estaria pronto para uma triagem? Se a resposta for sim — a semana 2 foi bem.' },
        ],
      },
      {
        type: 'ai',
        title: 'Retrospectiva guiada + calibração',
        preview: 'IA avalia o material construído e prepara a semana 3',
        timeEst: '~15 min', tokenCost: 600,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA revisa o que foi construído, identifica lacunas, e propõe ajustes para a semana 3 com base no que você reportar.' },
        ],
        cta: { label: '✦ Fazer retrospectiva', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Definir meta da semana 3',
        preview: '3 ações de encerramento',
        timeEst: '~10 min',
        content: [{ body: 'A semana 3 é de escala: mais vagas, mais contatos, mais candidaturas.' }],
        checklist: [
          { label: 'Definir meta: quantas vagas vou analisar na semana 3?' },
          { label: 'Confirmar: CV e LinkedIn estão prontos para candidatura?' },
          { label: 'Postar retrospectiva na comunidade' },
        ],
      },
    ],
  },

  // ── SEMANA 3 — Escalar ──────────────────────────────────────────────────────

  {
    number: 15, week: 3,
    name: 'Planning Semana 3',
    description: 'A semana 3 é de execução: candidaturas, networking, e volume qualificado. Hoje você define o plano e começa.',
    cards: [
      {
        type: 'learn',
        title: 'O jogo de números da busca de emprego',
        preview: 'Por que você precisa de 20+ vagas no pipeline ao mesmo tempo',
        timeEst: '4 min',
        content: [
          { heading: 'Os números reais', body: 'Para conseguir 1 oferta, você tipicamente precisa de: 3–5 entrevistas finais, 10–15 entrevistas de triagem, 50–80 candidaturas. Com qualidade alta, os números melhoram.' },
          { heading: 'Volume qualificado', body: 'Não é enviar 80 candidaturas genéricas. É ter 20 vagas no pipeline ativo ao mesmo tempo, analisadas e priorizadas — e aplicar com material adaptado.' },
        ],
      },
      {
        type: 'ai',
        title: 'Montar o plano da semana',
        preview: 'IA define metas de candidatura, networking e análise para os 6 dias',
        timeEst: '~10 min', tokenCost: 400,
        content: [
          { heading: 'O que vai acontecer', body: 'Com base no seu board atual e no tempo disponível, a IA define quantas vagas analisar, quantas candidaturas enviar, e quantos contatos de networking fazer esta semana.' },
        ],
        cta: { label: '✦ Planejar semana', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Abastecer o pipeline',
        preview: '3 ações para começar a semana com volume',
        timeEst: '~20 min',
        content: [{ body: 'Comece a semana com pelo menos 5 vagas novas para analisar.' }],
        checklist: [
          { label: 'Buscar 5 vagas nos alertas configurados na semana 1' },
          { label: 'Adicionar ao board: empresa, role, fonte' },
          { label: 'Priorizar: qual analisar primeiro?' },
        ],
      },
    ],
  },

  {
    number: 16, week: 3,
    name: 'Estratégia de aplicação',
    description: 'Candidatura sem fit não é candidatura — é ruído. Hoje você aprende a analisar o fit real entre o seu perfil e uma vaga antes de aplicar.',
    cards: [
      {
        type: 'learn',
        title: 'O que é fit — e por que 70% é suficiente',
        preview: 'A diferença entre candidatura com tração e candidatura genérica',
        timeEst: '3 min',
        content: [
          { heading: 'Fit não é ter 100% dos requisitos', body: 'Nenhum candidato tem. Os próprios recrutadores sabem disso quando escrevem o job description. Fit é: o problema que essa empresa precisa resolver é o problema que eu sei resolver?' },
          { heading: 'Remote vs. relocation', body: 'Vaga remote tem candidatos do mundo inteiro concorrendo — a barra de comunicação escrita é mais alta. Vaga de relocation tem filtro natural — concorrência menor, mas processo mais longo.' },
          { heading: 'Startup vs. scale-up vs. enterprise', body: 'Cada um é um mercado diferente — processo, cultura e critérios mudam completamente. Saber onde você joga muda a qualidade de cada candidatura.' },
        ],
      },
      {
        type: 'ai',
        title: 'Analisar fit de uma vaga',
        preview: 'Cole o JD → análise de fit + onde você é forte + recomendação de aplicação',
        timeEst: '~20 min', tokenCost: 1200,
        content: [
          { heading: 'O que vai acontecer', body: 'Você cola uma vaga que te interessa. A IA analisa o fit entre seu perfil e essa vaga: onde você é forte, onde está vulnerável, se vale aplicar, e como personalizar a abordagem se valer.' },
        ],
        cta: { label: '✦ Analisar fit', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Registrar e aplicar',
        preview: '3 ações de candidatura intencional',
        timeEst: '~15 min',
        content: [{ body: 'A partir de hoje, toda vaga que você aplica tem um registro no tracker — não para controle, mas para aprendizado. Os padrões que vão emergir ao longo das próximas semanas valem mais que qualquer pesquisa.' }],
        checklist: [
          { label: 'Analisar 1 vaga com fit analysis completa' },
          { label: 'Registrar no board com pelo menos 1 linha de análise' },
          { label: 'Aplicar para 3 vagas hoje (volume da semana 3)' },
        ],
      },
    ],
  },

  {
    number: 17, week: 3,
    name: 'Networking estratégico',
    description: 'Candidaturas frias têm taxa de resposta de 2–5%. Referrals chegam a 40%. Hoje você começa a construir o canal que importa.',
    cards: [
      {
        type: 'learn',
        title: 'Por que networking no mercado internacional funciona diferente',
        preview: 'A cultura de networking no mercado anglo-saxão vs. o brasileiro',
        timeEst: '5 min',
        content: [
          { heading: 'Networking não é pedir favor', body: 'No mercado internacional, é normal entrar em contato com alguém que você não conhece para pedir uma conversa de 20 minutos. O erro é começar pedindo emprego.' },
          { heading: 'A sequência correta', body: '1. Encontrar pessoas relevantes (empresas-alvo, cargos similares). 2. Enviar mensagem de curiosidade genuína. 3. Construir relacionamento antes de pedir qualquer coisa.' },
        ],
      },
      {
        type: 'ai',
        title: 'Mapear contatos estratégicos',
        preview: 'IA ajuda a identificar as pessoas certas para contactar nas suas empresas-alvo',
        timeEst: '~15 min', tokenCost: 700,
        content: [
          { heading: 'O que vai acontecer', body: 'Com base nas suas empresas-alvo, a IA vai ajudar a identificar que tipo de pessoa contactar (hiring managers, devs sêniors, recruiters internos) e qual é a abordagem mais eficaz para cada.' },
        ],
        cta: { label: '✦ Mapear contatos', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Identificar 10 contatos',
        preview: '2 ações de mapeamento',
        timeEst: '~20 min',
        content: [{ body: 'Networking começa com uma lista. Sem lista, não começa.' }],
        checklist: [
          { label: 'Identificar 10 pessoas nas empresas-alvo no LinkedIn' },
          { label: 'Salvar perfis para as mensagens de amanhã' },
        ],
      },
    ],
  },

  {
    number: 18, week: 3,
    name: 'Mensagens que funcionam',
    description: 'Você tem a lista de contatos. Hoje você escreve as mensagens — personalizadas, diretas, e com propósito claro.',
    cards: [
      {
        type: 'learn',
        title: 'A anatomia de uma mensagem de outreach eficaz',
        preview: 'O que inclui, o que exclui, e por que brevidade é respeito',
        timeEst: '4 min',
        content: [
          { heading: 'A estrutura que funciona', body: '1. Por que essa pessoa (específico, não genérico). 2. Quem você é em 1 linha. 3. O que você pede (pequeno e específico — uma pergunta, não um emprego). 4. Facilitar o sim.' },
          { heading: 'O que nunca incluir', body: 'Seu CV, pedido direto de emprego, parágrafos sobre sua trajetória, ou qualquer coisa que faça a mensagem parecer um copy-paste.' },
        ],
      },
      {
        type: 'ai',
        title: 'Escrever mensagens personalizadas',
        preview: 'IA cria mensagens únicas para 5 contatos da sua lista',
        timeEst: '~20 min', tokenCost: 800,
        content: [
          { heading: 'O que vai acontecer', body: 'Você descreve 5 contatos da lista (nome, cargo, empresa, algo específico do perfil deles). A IA cria mensagens personalizadas — não templates, mensagens com contexto real.' },
        ],
        cta: { label: '✦ Criar mensagens', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Enviar as primeiras mensagens',
        preview: '2 ações de execução',
        timeEst: '~15 min',
        content: [{ body: 'Cada mensagem enviada é uma semente. Algumas germinam em dias, outras em meses.' }],
        checklist: [
          { label: 'Enviar 3 mensagens de outreach no LinkedIn' },
          { label: 'Registrar contatos no sistema (a IA salva automaticamente)' },
        ],
      },
    ],
  },

  {
    number: 19, week: 3,
    name: 'Visibilidade no LinkedIn',
    description: 'Networking passivo: fazer o LinkedIn trabalhar por você enquanto você dorme. Hoje você ativa os gatilhos de visibilidade orgânica.',
    cards: [
      {
        type: 'learn',
        title: 'Conteúdo como canal de candidatura',
        preview: 'Como um post no LinkedIn pode gerar mais entrevistas que 10 candidaturas',
        timeEst: '4 min',
        content: [
          { heading: 'A lógica do inbound', body: 'Recrutadores que veem você publicar conteúdo relevante têm um pré-conceito positivo antes do primeiro contato. Você já provou que sabe do que está falando.' },
          { heading: 'O que publicar quando você não é influencer', body: 'Não precisa de audiência. Um post sobre uma solução técnica que você encontrou, uma análise de tendência de mercado, ou um aprendizado do bootcamp — isso já é conteúdo de valor.' },
        ],
      },
      {
        type: 'ai',
        title: 'Criar post de visibilidade',
        preview: 'IA cria 1 post de LinkedIn baseado no seu expertise e cargo-alvo',
        timeEst: '~15 min', tokenCost: 600,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai identificar o tema mais relevante do seu expertise para o cargo-alvo e escrever 1 post de LinkedIn — direto, com ponto de vista próprio, e otimizado para engajamento.' },
        ],
        cta: { label: '✦ Criar post', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Publicar e engajar',
        preview: '3 ações de visibilidade',
        timeEst: '~15 min',
        content: [{ body: 'Consistência vale mais que viralizar. 1 post por semana, por 4 semanas, gera mais resultado que 1 post que explode.' }],
        checklist: [
          { label: 'Publicar o post criado com a IA' },
          { label: 'Comentar em 3 posts de pessoas das empresas-alvo' },
          { label: 'Enviar 2 convites de conexão com nota personalizada' },
        ],
      },
    ],
  },

  {
    number: 20, week: 3,
    name: 'Aplicar com contexto',
    description: 'Cover note tem reputação ruim — porque a maioria é genérica. Hoje você aprende quando escrever, como escrever em 3 parágrafos, e o teste que separa o que funciona do que não funciona.',
    cards: [
      {
        type: 'learn',
        title: 'Cover note: quando vale e quando não vale',
        preview: 'A estrutura de 3 parágrafos — e o teste do específico',
        timeEst: '4 min',
        content: [
          { heading: 'Quando escrever', body: 'Só quando você tem algo específico a dizer sobre essa empresa — pelo produto, pela missão, pelo problema que resolvem. Se não tem nada específico a dizer, não escreva. Cover note genérica prejudica mais do que ajuda.' },
          { heading: 'A estrutura de 3 parágrafos', body: 'P1: Por que essa empresa (produto, missão, uma decisão específica deles — não "estou entusiasmado"). P2: O que você entrega para esse papel com um resultado concreto. P3: Call to action direto, sem humildade excessiva.' },
          { heading: 'O teste', body: 'Antes de enviar: essa cover note poderia ser enviada para outra empresa com troca de nome? Se sim — reescreve. Cover note que funciona é radicalmente específica.' },
        ],
      },
      {
        type: 'ai',
        title: 'Criar cover note para uma vaga real',
        preview: 'IA avalia se vale escrever + gera 3 parágrafos radicalmente específicos',
        timeEst: '~20 min', tokenCost: 1200,
        content: [
          { heading: 'O que vai acontecer', body: 'Você cola a vaga de uma empresa que genuinamente te interessa. A IA avalia se justifica cover note e, se sim, gera os 3 parágrafos — radicalmente específicos, impossíveis de enviar para qualquer outra empresa.' },
        ],
        cta: { label: '✦ Criar cover note', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Fechar a semana com candidaturas',
        preview: '3 ações de encerramento',
        timeEst: '~20 min',
        content: [{ body: 'Qualidade onde faz sentido. Volume onde não tem algo específico a dizer. Os dois juntos.' }],
        checklist: [
          { label: 'Aplicar para 1 vaga com cover note (empresa que genuinamente te interessa)' },
          { label: 'Aplicar para 2 vagas sem cover note (volume)' },
          { label: 'Verificar: board tem pelo menos 5 vagas em pipeline?' },
        ],
      },
    ],
  },

  {
    number: 21, week: 3,
    name: 'Retro',
    description: 'Três semanas de bootcamp. Você tem material construído, candidaturas enviadas, e primeiros contatos feitos. Hora de avaliar e ajustar.',
    cards: [
      {
        type: 'reflect',
        title: 'Semana 3: escala e execução',
        preview: 'O que os dados de candidatura revelam sobre seu posicionamento',
        timeEst: '5 min',
        content: [
          { heading: 'O que você fez', body: 'Candidaturas enviadas, contatos de networking iniciados, conteúdo publicado no LinkedIn, pipeline com vagas ativas. Você está no mercado.' },
          { heading: 'O que os dados dizem', body: 'Olhe para o board: qual é a taxa de resposta até agora? Em qual tipo de empresa você está tendo mais retorno? Essas informações guiam a semana 4.' },
        ],
      },
      {
        type: 'ai',
        title: 'Retrospectiva guiada + ajuste de estratégia',
        preview: 'IA analisa os dados do board e ajusta a estratégia para a semana 4',
        timeEst: '~20 min', tokenCost: 700,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA revisa os dados de candidatura, identifica padrões, e propõe ajustes concretos — no material, na estratégia de networking, ou no tipo de vaga.' },
        ],
        cta: { label: '✦ Fazer retrospectiva', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Definir meta da semana 4',
        preview: '3 ações de encerramento',
        timeEst: '~10 min',
        content: [{ body: 'A semana 4 é de performar: triagens, entrevistas, negociação.' }],
        checklist: [
          { label: 'Registrar aprendizado mais importante da semana 3' },
          { label: 'Ajustar 1 elemento do material com base nos dados' },
          { label: 'Postar retrospectiva na comunidade' },
        ],
      },
    ],
  },

  // ── SEMANA 4 — Performar ────────────────────────────────────────────────────

  {
    number: 22, week: 4,
    name: 'Planning Semana 4',
    description: 'A semana 4 é sobre performar nas conversas que importam. Hoje você prepara o mindset e o plano para entrevistas, negociação, e fechamento.',
    cards: [
      {
        type: 'learn',
        title: 'O que muda na semana 4',
        preview: 'De candidato para finalista — o que a última semana exige',
        timeEst: '4 min',
        content: [
          { heading: 'O foco muda', body: 'Nas semanas 1–3 você construiu e escalou. Na semana 4, você performa: triagens telefônicas, entrevistas técnicas, comportamentais, simulações, e negociação.' },
          { heading: 'Preparação vs. performance', body: 'Candidatos que chegam a entrevistas sem preparação perdem para candidatos tecnicamente inferiores mas bem preparados. A semana 4 fecha essa lacuna.' },
        ],
      },
      {
        type: 'ai',
        title: 'Definir prioridades da semana',
        preview: 'IA analisa o pipeline e define o que precisa de atenção urgente',
        timeEst: '~10 min', tokenCost: 400,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA revisa o estado do pipeline, identifica quais vagas têm entrevistas próximas ou possibilidade de avanço, e define as prioridades de preparação para a semana.' },
        ],
        cta: { label: '✦ Planejar semana', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Preparar o terreno',
        preview: '3 ações de preparação',
        timeEst: '~15 min',
        content: [{ body: 'Prepare-se para o que pode acontecer esta semana — não só para o que já está agendado.' }],
        checklist: [
          { label: 'Listar vagas com maior probabilidade de avanço esta semana' },
          { label: 'Pesquisar cada empresa: produto, cultura, notícias recentes' },
          { label: 'Testar setup técnico: câmera, microfone, fundo, conexão' },
        ],
      },
    ],
  },

  {
    number: 23, week: 4,
    name: 'FAQs + STAR',
    description: 'Toda entrevista tem perguntas previsíveis. Hoje você prepara as respostas — com método, com histórias reais, e em inglês.',
    cards: [
      {
        type: 'learn',
        title: 'O método STAR e as perguntas que sempre aparecem',
        preview: 'Estrutura, exemplos reais, e como não parecer que está recitando',
        timeEst: '5 min',
        content: [
          { heading: 'O método STAR', body: 'Situation (contexto), Task (o que era esperado de você), Action (o que você fez especificamente), Result (o que aconteceu com números). Toda pergunta comportamental tem uma resposta STAR ideal.' },
          { heading: 'As 5 perguntas que sempre aparecem', body: '"Tell me about yourself", "Why this company?", "What\'s your biggest weakness?", "Tell me about a challenge you overcame", "Where do you see yourself in 5 years?"' },
        ],
      },
      {
        type: 'ai',
        title: 'Preparar respostas para FAQs',
        preview: 'IA ajuda a construir respostas em STAR para as principais perguntas',
        timeEst: '~25 min', tokenCost: 900,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai trabalhar com você as 5 perguntas mais comuns. Para cada uma: identifica a melhor história da sua carreira para responder, estrutura em STAR, e ajusta o inglês para soar natural.' },
        ],
        cta: { label: '✦ Preparar respostas', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Praticar em voz alta',
        preview: '2 ações de prática',
        timeEst: '~15 min',
        content: [{ body: 'Ler a resposta é diferente de falar a resposta. Você precisa praticar em voz alta.' }],
        checklist: [
          { label: 'Gravar sua resposta para "Tell me about yourself" e ouvir' },
          { label: 'Praticar 2 respostas STAR com um colega do bootcamp' },
        ],
      },
    ],
  },

  {
    number: 24, week: 4,
    name: 'Soft Skills sob pressão',
    description: 'Entrevistas comportamentais testam como você pensa, não só o que sabe. Hoje você prepara as histórias que mostram quem você é como profissional.',
    cards: [
      {
        type: 'learn',
        title: 'O que empresas internacionais realmente avaliam',
        preview: 'Ownership, communication, adaptability — e como demonstrá-los com histórias',
        timeEst: '4 min',
        content: [
          { heading: 'Soft skills que mais aparecem', body: 'Communication (especialmente escrita, em remote-first), Ownership (tomou iniciativa sem ser mandado), Adaptability (mudou de direção sem drama), Collaboration (trabalhou bem com pessoas difíceis).' },
          { heading: 'Histórias, não declarações', body: 'Dizer "sou comunicativo" não convence ninguém. Contar como você documentou um sistema complexo para um time distribuído — isso convence.' },
        ],
      },
      {
        type: 'ai',
        title: 'Construir histórias de soft skills',
        preview: 'IA identifica as melhores histórias da sua carreira para cada competência',
        timeEst: '~20 min', tokenCost: 800,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai explorar situações da sua carreira e identificar as histórias que melhor demonstram ownership, communication, e adaptability — estruturadas em STAR e prontas para entrevista.' },
        ],
        cta: { label: '✦ Construir histórias', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Criar seu banco de histórias',
        preview: '2 ações de consolidação',
        timeEst: '~10 min',
        content: [{ body: 'Um banco de 5–7 histórias cobre 90% das perguntas comportamentais.' }],
        checklist: [
          { label: 'Ter pelo menos 5 histórias STAR documentadas' },
          { label: 'Mapear: qual história responde qual pergunta?' },
        ],
      },
    ],
  },

  {
    number: 25, week: 4,
    name: 'Testes técnicos',
    description: 'Entrevistas técnicas têm formato previsível. Hoje você prepara o que esperar e como performar — independentemente do stack específico.',
    cards: [
      {
        type: 'learn',
        title: 'Os formatos de entrevista técnica no mercado internacional',
        preview: 'Live coding, take-home, system design — o que esperar de cada',
        timeEst: '5 min',
        content: [
          { heading: 'Live coding', body: 'Você resolve um problema em tempo real com o entrevistador observando. Não é só sobre resolver — é sobre como você pensa em voz alta, como pede ajuda, como itera.' },
          { heading: 'Take-home', body: 'Você recebe um problema e entrega em 24–72h. Leia os requisitos 2x antes de começar. Documente suas decisões. A qualidade do README importa tanto quanto o código.' },
          { heading: 'System design', body: 'Para sêniors e acima. Você projeta uma arquitetura de sistema de alta escala. Foco em clarificar requisitos, fazer trade-offs explícitos, e comunicar seu raciocínio.' },
        ],
      },
      {
        type: 'ai',
        title: 'Simular entrevista técnica',
        preview: 'IA conduz uma simulação de live coding ou system design',
        timeEst: '~30 min', tokenCost: 1200,
        content: [
          { heading: 'O que vai acontecer', body: 'Você escolhe o formato (live coding ou system design). A IA conduz a entrevista simulada no estilo das empresas que você está mirando — com feedback ao final sobre pontos fortes e o que melhorar.' },
        ],
        cta: { label: '✦ Iniciar simulação', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Revisar e preparar',
        preview: '2 ações de preparação técnica',
        timeEst: '~20 min',
        content: [{ body: 'Preparação técnica não é decorar — é praticar o raciocínio.' }],
        checklist: [
          { label: 'Revisar 3 conceitos fundamentais da sua área' },
          { label: 'Fazer 1 problema de coding em plataforma como LeetCode ou HackerRank' },
        ],
      },
    ],
  },

  {
    number: 26, week: 4,
    name: 'Simulação completa',
    description: 'Tudo junto agora. Hoje você passa por uma entrevista completa simulada — do "tell me about yourself" até a pergunta de fechamento.',
    cards: [
      {
        type: 'learn',
        title: 'O que acontece em uma entrevista real',
        preview: 'Estrutura típica, sinais de interesse, e como fechar bem',
        timeEst: '3 min',
        content: [
          { heading: 'A estrutura típica', body: '1. Small talk (2–3 min). 2. "Tell me about yourself" (3–4 min). 3. Perguntas sobre experiências específicas (15–20 min). 4. Perguntas técnicas ou de case (15–20 min). 5. Suas perguntas para o entrevistador (5–10 min).' },
          { heading: 'As suas perguntas importam', body: 'Candidatos que fazem boas perguntas demonstram preparação e interesse genuíno. Tenha pelo menos 3 perguntas prontas.' },
        ],
      },
      {
        type: 'ai',
        title: 'Simulação de entrevista completa',
        preview: 'IA conduz entrevista do início ao fim — com feedback detalhado',
        timeEst: '~45 min', tokenCost: 1500,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA vai conduzir uma entrevista completa simulada para o cargo-alvo da empresa que você escolher. Inclui perguntas comportamentais, técnicas, e de cultura. Ao final: feedback detalhado por categoria.' },
        ],
        cta: { label: '✦ Iniciar simulação', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Revisar e iterar',
        preview: '2 ações pós-simulação',
        timeEst: '~15 min',
        content: [{ body: 'O feedback da simulação é tão valioso quanto a simulação em si — só se você agir sobre ele.' }],
        checklist: [
          { label: 'Anotar os 2 principais pontos de melhoria identificados' },
          { label: 'Refazer a resposta mais fraca com a estrutura correta' },
        ],
      },
    ],
  },

  {
    number: 27, week: 4,
    name: 'Negociação',
    description: 'A oferta veio. Ou vai vir. Hoje você aprende a não deixar dinheiro na mesa — com método, com dados, e sem queimar pontes.',
    cards: [
      {
        type: 'learn',
        title: 'Negociação de salário no mercado internacional',
        preview: 'Anchor, range, e por que você nunca deve dar o primeiro número',
        timeEst: '5 min',
        content: [
          { heading: 'Por que negociar é esperado', body: 'No mercado internacional, especialmente em tech, é culturalmente aceito — e esperado — negociar. Empresas fazem offering sabendo que há margem. Não negociar é deixar dinheiro na mesa.' },
          { heading: 'A regra do primeiro número', body: 'Quem dá o primeiro número ancora a negociação. Se a empresa pergunta sua expectativa antes de fazer uma oferta, redirecione: "Estou curioso sobre o range que vocês têm para essa posição."' },
          { heading: 'Total comp, não só salário', body: 'Salário base + bonus + equity + benefícios + PTO + home office allowance. A negociação é sobre o pacote completo.' },
        ],
      },
      {
        type: 'ai',
        title: 'Preparar scripts de negociação',
        preview: 'IA cria scripts para os 3 cenários mais comuns de negociação',
        timeEst: '~20 min', tokenCost: 800,
        content: [
          { heading: 'O que vai acontecer', body: 'Com base no seu cargo-alvo, seniority, e dados de mercado, a IA cria scripts para: (1) redirecionar a pergunta de expectativa salarial, (2) contraofertar uma oferta abaixo do esperado, (3) negociar benefícios quando o salário está fixo.' },
        ],
        cta: { label: '✦ Preparar scripts', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Pesquisar e calibrar',
        preview: '3 ações de preparação para negociação',
        timeEst: '~20 min',
        content: [{ body: 'Negociação com dados é mais forte que negociação com feeling.' }],
        checklist: [
          { label: 'Pesquisar faixa salarial no Glassdoor, Levels.fyi ou LinkedIn Salary' },
          { label: 'Definir: meu número mínimo, alvo, e âncora' },
          { label: 'Praticar o script de redirecionamento em voz alta' },
        ],
      },
    ],
  },

  {
    number: 28, week: 4,
    name: 'Retro',
    description: 'Quatro semanas. Hoje você avalia onde chegou com honestidade — não como celebração, mas como diagnóstico do que ainda precisa de trabalho.',
    cards: [
      {
        type: 'reflect',
        title: 'Improviso vs. execução — onde você chegou',
        preview: 'O que existe hoje que não existia no Dia 1 — campo por campo',
        timeEst: '10 min',
        content: [
          { heading: 'Abra o Notion antes de qualquer coisa', body: 'Leia devagar, campo por campo. Perfil Extraído, Termos de Busca, Boolean Searches, Keyword Bank, Perfil de Mercado, Proposta de Valor, Experiências CV, Headline LinkedIn, About Section, AI Fluency, Application Tracker, Histórias STAR, scripts de negociação. Esse dossiê não existia há 28 dias.' },
          { heading: 'A pergunta central desta retro', body: 'Onde você ainda se sente frágil? Narrativa sob pressão? Entrevistas em inglês? Testes técnicos? Negociação? Esse ponto vulnerável é o que orienta o que vem depois do bootcamp.' },
        ],
      },
      {
        type: 'ai',
        title: 'Retrospectiva de 28 dias',
        preview: 'IA conduz reflexão completa — o que era no Dia 1 e o que é hoje',
        timeEst: '~25 min', tokenCost: 800,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA faz perguntas sobre a jornada dos últimos 28 dias — o que você construiu, quantas candidaturas, onde travou, o que aprendeu. Ao final: resumo da evolução, pontos ainda vulneráveis, e o que precisa acontecer nos próximos 30 dias.' },
        ],
        cta: { label: '✦ Fazer retrospectiva', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Fechar a semana 4',
        preview: '3 ações de encerramento',
        timeEst: '~10 min',
        content: [{ body: 'Amanhã você define como continuar sem depender do bootcamp para se mover.' }],
        checklist: [
          { label: 'Salvar resumo da retro no Sprint Board → Semana 4' },
          { label: 'Nomear onde ainda se sente frágil — com honestidade' },
          { label: 'Postar na comunidade: números reais + o que ainda falta' },
        ],
      },
    ],
  },

  {
    number: 29, week: 4,
    name: 'Próximos passos',
    description: 'O bootcamp acaba amanhã. O projeto não. Hoje você constrói a estrutura que vai substituir o bootcamp — o ritmo sustentável de longo prazo.',
    cards: [
      {
        type: 'learn',
        title: 'O ritmo sustentável depois do Dia 30',
        preview: 'Sprint de bootcamp não é ritmo de longo prazo — como manter sem esgotar',
        timeEst: '4 min',
        content: [
          { heading: 'O que muda depois do Dia 30', body: 'Quatro aplicações por dia, prompt diário, post diário, check-in diário — é intenso por design para criar o músculo. Depois do Dia 30, o ritmo muda. Não desaparece — muda.' },
          { heading: 'O ritmo de manutenção', body: 'Candidaturas: 2–3 por dia nos dias úteis. Networking: 2–3 ações por semana. Presença no LinkedIn: 1 post por semana. Treino de entrevista: 1 simulação por semana até ter entrevistas reais. TNG OS: atualizar o tracker depois de cada aplicação.' },
          { heading: 'Como não virar procurador de emprego em tempo integral', body: 'Bloco de 40 minutos pela manhã. Ou à noite. Mesmo horário todo dia. Fora desse bloco — você não está buscando emprego. Você está vivendo. Candidato confiante performa melhor que candidato desesperado.' },
        ],
      },
      {
        type: 'ai',
        title: 'Montar plano de continuidade',
        preview: 'IA gera plano de manutenção personalizado para os próximos 30 dias',
        timeEst: '~20 min', tokenCost: 800,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA pergunta sobre candidaturas ativas, entrevistas em andamento, contatos que precisam de follow-up, e onde você ainda se sente mais vulnerável. Ao final: plano de manutenção semanal personalizado — volume, networking, treino, e o sinal de quando é hora de pedir ajuda.' },
        ],
        cta: { label: '✦ Montar plano', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Definir o compromisso',
        preview: '3 ações de preparação para depois do bootcamp',
        timeEst: '~10 min',
        content: [{ body: 'O Dia 30 não é o fim. É o ponto onde você para, olha para trás, e vê o que construiu. E então olha para frente — com o sistema no lugar — e decide como continua.' }],
        checklist: [
          { label: 'Salvar o plano de continuidade no Sprint Board do Notion' },
          { label: 'Definir horário fixo diário para busca de emprego' },
          { label: 'Postar na comunidade: meta para os próximos 30 dias' },
        ],
      },
    ],
  },

  {
    number: 30, week: 4,
    name: 'Celebração',
    description: 'Trinta dias. Feito. Antes de qualquer coisa — abre o Notion e lê devagar, do primeiro campo ao último. Veja a distância entre os dois.',
    cards: [
      {
        type: 'reflect',
        title: 'O que você tem hoje que não tinha no Dia 1',
        preview: 'Não em sentimento — em estrutura. Campo por campo.',
        timeEst: '10 min',
        content: [
          { heading: 'O que você construiu', body: 'Perfil de Mercado definido. Proposta de valor articulada. CV com experiências reescritas em inglês com impacto e métricas. LinkedIn com headline, About section e keywords distribuídas. Keyword Bank. Application Tracker com candidaturas documentadas. Histórias STAR. Soft skills com evidências. Simulação completa. Dados de negociação. Plano de continuidade. E aproximadamente 70 aplicações feitas.' },
          { heading: 'O que o bootcamp entregou e o que não entregou', body: 'O bootcamp entregou sistema. Clareza. Ferramentas. Músculo. Não entregou a vaga. Vaga não vem de bootcamp. Vem de execução consistente ao longo do tempo — com sistema, com narrativa, com presença no mercado certo.' },
        ],
      },
      {
        type: 'ai',
        title: 'Resumo de transformação',
        preview: 'IA compara o Dia 1 com o Dia 30 — e escreve seu depoimento',
        timeEst: '~25 min', tokenCost: 1200,
        content: [
          { heading: 'O que vai acontecer', body: 'A IA pede o diagnóstico do Dia 1 (os 3 pontos críticos do seu CV original) e faz perguntas sobre a transformação nos 30 dias. Ao final: resumo em inglês (para depoimento) e em português (para a comunidade), e os 3 pontos críticos do Dia 1 respondidos — o que era frágil e o que existe hoje no lugar.' },
        ],
        cta: { label: '✦ Gerar resumo de transformação', href: '/chat' },
      },
      {
        type: 'action',
        title: 'Fechar o bootcamp',
        preview: '4 ações de celebração e compromisso',
        timeEst: '~15 min',
        content: [{ body: 'Esse depoimento é o conteúdo mais poderoso que existe para trazer novas pessoas ao bootcamp. Não anúncio. Não promessa. Resultado real de alguém real.' }],
        checklist: [
          { label: 'Salvar resumo de transformação no Notion (seção Minha Narrativa)' },
          { label: 'Postar na comunidade: Trinta dias. Feito. [diagnóstico honesto + o que construiu]' },
          { label: 'Mandar mensagem pessoal para o buddy — o que aprendeu com ele' },
          { label: 'Continuar. O ritmo não para.' },
        ],
      },
    ],
  },
]

/**
 * Returns true if a card is considered complete given the persisted state.
 * ai cards are excluded — completion can't be auto-detected without chat integration.
 */
export function isCardComplete(
  card: DayCard,
  cardIndex: number,
  savedState: Record<string, boolean>,
): boolean {
  if (card.type === 'ai') return savedState[`card_${cardIndex}_executed`] === true
  if (card.type === 'learn' || card.type === 'reflect') return savedState[`card_${cardIndex}_read`] === true
  if (card.checklist && card.checklist.length > 0) {
    return card.checklist.every((_, i) => savedState[`card_${cardIndex}_check_${i}`] === true)
  }
  return false
}

export function isDayComplete(
  dayDef: DayDefinition,
  savedState: Record<string, boolean>,
): boolean {
  return dayDef.cards.every((card, i) => isCardComplete(card, i, savedState))
}

export function getCurrentDay(completedDays: number[], maxDay = 30): number {
  if (completedDays.length === 0) return 1
  const maxDone = Math.max(...completedDays)
  return Math.min(maxDone + 1, maxDay)
}

export function getStreak(activities: { day_number: number; status: string; completed_at: string | null }[]): number {
  const doneDays = activities
    .filter(a => a.status === 'done' && a.completed_at)
    .map(a => a.day_number)
    .sort((a, b) => b - a)

  if (doneDays.length === 0) return 0

  let streak = 1
  for (let i = 0; i < doneDays.length - 1; i++) {
    if (doneDays[i] - doneDays[i + 1] === 1) streak++
    else break
  }
  return streak
}

export const WEEK_THEMES: Record<number, string> = {
  1: 'Semana 1 — Clareza',
  2: 'Semana 2 — Construir',
  3: 'Semana 3 — Escalar',
  4: 'Semana 4 — Performar',
}

// Days 29–30 belong to week 4 thematically
export function getDayWeek(dayNumber: number): number {
  if (dayNumber <= 7) return 1
  if (dayNumber <= 14) return 2
  if (dayNumber <= 21) return 3
  return 4
}
