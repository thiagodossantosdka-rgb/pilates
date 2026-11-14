/* ==========================================================================
   KINEHOS — CONFIGURAÇÃO CENTRAL
   --------------------------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa editar para trocar dados da clínica.
   Tudo que está entre [COLCHETES] é PLACEHOLDER e deve ser substituído por
   informação real e confirmada pela clínica.

   Enquanto "destacarPlaceholders" estiver true, os placeholders aparecem
   com um destaque tracejado no site, para facilitar a revisão.
   Antes de publicar, deixe false (ou preencha tudo).

   ⚠️ PUBLICIDADE EM SAÚDE (COFFITO): todos os textos devem ser validados
   pela clínica / responsável técnico. Não prometer cura ou resultado,
   não usar "o melhor", "garantido", "100%", nem fotos de antes/depois.
   Depoimentos: confirme com a clínica se o uso é permitido pelas normas
   vigentes do COFFITO/CREFITO e use apenas com autorização por escrito do
   paciente, sem citar resultados clínicos.
   ========================================================================== */

window.KINEHOS_CONFIG = {
  /* ---------------- Contato e conversão ---------------- */
  whatsapp: "5561995719079",            // só números, com DDI 55 + DDD
  telefoneExibicao: "(61) 99571-9079",
  instagram: "https://www.instagram.com/kinehospilates/",
  instagramUsuario: "@kinehospilates",

  /* Meta Pixel: cole só o número do ID. Vazio = pixel NÃO é carregado. */
  metaPixelId: "",
  /* Eventos disparados a cada clique de WhatsApp.
     Se a campanha otimiza para um só evento, deixe apenas ele na lista. */
  metaPixelEventos: ["Contact", "Schedule"],

  /* Destaque visual dos placeholders (use false antes de publicar). */
  destacarPlaceholders: true,

  /* URL final do site (usada no schema.org). Ex.: "https://kinehos.com.br/" */
  siteUrl: "[URL DO SITE]",

  /* ---------------- Dados da clínica ---------------- */
  clinica: {
    nome: "Kinehos Pilates e Fisioterapia",
    endereco: "[ENDEREÇO COMPLETO — rua/quadra, nº, sala]",
    bairro: "Condomínio RK",
    cidade: "Brasília",
    uf: "DF",
    cep: "[CEP]",
    horarios: "[HORÁRIOS DE ATENDIMENTO — ex.: seg. a sex., 7h às 20h]",
    duracaoAvaliacao: "[DURAÇÃO DA AVALIAÇÃO — ex.: cerca de 50 minutos]",
    cnpj: "[CNPJ]",
    responsavelTecnico: "[NOME DO RESPONSÁVEL TÉCNICO]",
    crefitoRT: "[CREFITO DO RESPONSÁVEL TÉCNICO]",
    /* Google Maps → Compartilhar → Incorporar um mapa → copie SÓ a URL do src */
    mapaEmbedUrl: "",
    /* Link "Como chegar" (Google Maps → Compartilhar → Copiar link) */
    mapaLink: "",
    latitude: "",   // opcional, ex.: "-15.8"
    longitude: ""   // opcional
  },


  /* ---------------- Mensagens pré-preenchidas do WhatsApp ----------------
     A chave é usada no HTML em data-wa-msg="chave".
     A origem do clique e as UTMs são adicionadas automaticamente no final. */
  mensagens: {
    padrao:      "Olá! Vi o site da Kinehos e gostaria de agendar uma avaliação.",
    coluna:      "Olá! Vi o site da Kinehos. Tenho dor nas costas e gostaria de agendar uma avaliação.",
    lesao:       "Olá! Vi o site da Kinehos. Estou me recuperando de uma lesão ou cirurgia e gostaria de agendar uma avaliação.",
    postura:     "Olá! Vi o site da Kinehos. Quero cuidar da minha postura e mobilidade e gostaria de agendar uma avaliação.",
    esporte:     "Olá! Vi o site da Kinehos. Pratico esporte e gostaria de agendar uma avaliação.",
    vida50:      "Olá! Vi o site da Kinehos. Busco mais qualidade de vida e gostaria de agendar uma avaliação.",
    fisioterapia:"Olá! Vi o site da Kinehos. Tenho interesse em Fisioterapia e gostaria de agendar uma avaliação.",
    pilates:     "Olá! Vi o site da Kinehos. Tenho interesse em Pilates em aparelhos e gostaria de agendar uma avaliação.",
    pressoterapia:"Olá! Vi o site da Kinehos. Tenho interesse em Pressoterapia e gostaria de agendar uma avaliação.",
    miofascial:  "Olá! Vi o site da Kinehos. Tenho interesse em Liberação miofascial e gostaria de agendar uma avaliação.",
    eletro:      "Olá! Vi o site da Kinehos. Tenho interesse em Eletroestimulação e gostaria de agendar uma avaliação."
  },

  /* ---------------- Equipe ----------------
     foto: caminho da imagem (ex.: "assets/img/equipe-ana.jpg"), quadrada ou 4:5.
     Vazio = mostra um placeholder. Adicione/remova objetos à vontade. */
  equipe: [
    {
      nome: "[NOME DA FISIOTERAPEUTA]",
      cargo: "Fisioterapeuta",
      formacao: "[FORMAÇÃO / ESPECIALIZAÇÕES]",
      crefito: "[CREFITO]",
      foto: ""
    },
    {
      nome: "[NOME DO(A) FISIOTERAPEUTA]",
      cargo: "Fisioterapeuta · Instrutor(a) de Pilates",
      formacao: "[FORMAÇÃO / ESPECIALIZAÇÕES]",
      crefito: "[CREFITO]",
      foto: ""
    },
    {
      nome: "[NOME DO(A) PROFISSIONAL]",
      cargo: "[FUNÇÃO]",
      formacao: "[FORMAÇÃO / ESPECIALIZAÇÕES]",
      crefito: "[CREFITO]",
      foto: ""
    }
  ],

  /* ---------------- Depoimentos (texto) ----------------
     Use SOMENTE depoimentos reais, com autorização por escrito.
     Não publique relatos que prometam cura ou citem resultados clínicos. */
  depoimentos: [
    { texto: "[DEPOIMENTO REAL 1 — sobre o atendimento, acolhimento, ambiente]", nome: "[NOME OU INICIAIS]", contexto: "[EX.: ALUNA DE PILATES]" },
    { texto: "[DEPOIMENTO REAL 2]", nome: "[NOME OU INICIAIS]", contexto: "[EX.: PACIENTE DE FISIOTERAPIA]" },
    { texto: "[DEPOIMENTO REAL 3]", nome: "[NOME OU INICIAIS]", contexto: "[EX.: ATLETA DE FUTEVÔLEI]" }
  ],

  /* Vídeos curtos de depoimento (9:16). src vazio = placeholder. */
  videosDepoimento: [
    { src: "", poster: "", legenda: "[VÍDEO DE DEPOIMENTO 1]" },
    { src: "", poster: "", legenda: "[VÍDEO DE DEPOIMENTO 2]" }
  ],

  /* ---------------- O espaço ---------------- */
  galeriaEspaco: [
    { src: "", alt: "[FOTO DO ESPAÇO — sala de Pilates com aparelhos]" },
    { src: "", alt: "[FOTO DO ESPAÇO — recepção]" },
    { src: "", alt: "[FOTO DO ESPAÇO — sala de fisioterapia]" },
    { src: "", alt: "[FOTO DO ESPAÇO — Reformer]" },
    { src: "", alt: "[FOTO DO ESPAÇO — Cadillac]" },
    { src: "", alt: "[FOTO DO ESPAÇO — fachada / acesso]" }
  ]
};
