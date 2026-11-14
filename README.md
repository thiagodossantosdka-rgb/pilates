# Kinehos Pilates e Fisioterapia — Landing page

Landing page de conversão para agendamento de **avaliação via WhatsApp**.
HTML + CSS + JavaScript puro, sem build: basta abrir num servidor estático.

```
index.html
css/style.css
js/config.js      ← ÚNICO arquivo que você precisa editar no dia a dia
js/main.js
assets/
  video/          vídeos otimizados (.mp4 H.264 + .webm VP9, sem áudio, 720p)
  img/            posters dos vídeos + imagem de compartilhamento (og-image.jpg)
  fonts/          Cormorant Garamond + DM Sans (Google Fonts, hospedadas localmente)
  logo/           logo.svg (provisório) e favicon.svg
  (os vídeos ORIGINAIS do Google Flow foram movidos para ../Kinehos - videos originais)
```

> ⚠️ **Publicidade em saúde (COFFITO):** os textos foram escritos sem promessa de cura,
> sem "o melhor", "garantido" ou "100%", e sem antes/depois. Mesmo assim, **valide todos os
> textos com a clínica e o responsável técnico antes de publicar.** Depoimentos só com
> autorização por escrito e sem citar resultados clínicos.

---

## 1. Ver o site no computador

Os vídeos e alguns recursos não funcionam abrindo o `index.html` com duplo clique. Use um
servidor local, por exemplo:

```bash
python -m http.server 5500
```

e abra `http://localhost:5500`.

---

## 2. Editar o `js/config.js`

Tudo que está entre `[COLCHETES]` é placeholder. Troque pelo dado real **mantendo as aspas**:

```js
horarios: "Seg. a sex., 7h às 20h · Sáb., 8h às 12h",
```

| Campo | O que é |
|---|---|
| `whatsapp` | Número só com dígitos, com 55 + DDD |
| `metaPixelId` | ID do Pixel da Meta. **Vazio = pixel não carrega** |
| `metaPixelEventos` | Eventos disparados a cada clique no WhatsApp (`Contact`, `Schedule`) |
| `destacarPlaceholders` | `true` mostra os placeholders com contorno tracejado. Use `false` ao publicar |
| `siteUrl` | URL final do site (usada no schema.org) |
| `clinica.*` | Endereço, CEP, horários, duração da avaliação, CNPJ, responsável técnico, mapa |
| `mensagens.*` | Textos pré-preenchidos do WhatsApp para cada botão |
| `equipe` | Lista de profissionais (adicione/remova objetos) |
| `depoimentos`, `videosDepoimento` | Depoimentos reais em texto e vídeos 9:16 |
| `galeriaEspaco` | Fotos da galeria do espaço (`src` vazio = placeholder) |

**Mapa:** Google Maps → pesquise a clínica → Compartilhar → *Incorporar um mapa* → copie só a URL
que está dentro de `src="..."` e cole em `clinica.mapaEmbedUrl`.

### Como o rastreamento funciona
- Todo botão gera `https://wa.me/5561995719079?text=...` com a mensagem do botão + a origem do
  clique, ex.: `[ref: card-coluna]`.
- Se a pessoa chegou por campanha (`?utm_source=meta-ads&utm_medium=cpc&utm_campaign=coluna`),
  a mensagem ganha `[origem: meta-ads / cpc / coluna]`. As UTMs ficam guardadas durante a visita.
- Com `metaPixelId` preenchido: `PageView` ao abrir e `Contact`/`Schedule` a cada clique no
  WhatsApp, com `content_name` = dor/serviço escolhido e `content_category` = origem do clique.

---

## 3. Trocar fotos

1. Coloque a imagem em `assets/img/` (JPG ou WebP, até ~1600px de largura, idealmente < 250 KB).
2. No `config.js`, preencha `src` e um `alt` descritivo:
   ```js
   { src: "assets/img/espaco-reformer.jpg", alt: "Sala de Pilates com aparelhos Reformer" }
   ```
3. Equipe: `foto: "assets/img/equipe-nome.jpg"` (formato quadrado ou 4:5).

Para comprimir uma foto com ffmpeg:
```bash
ffmpeg -i original.jpg -vf "scale=1600:-2" -q:v 4 assets/img/nova-foto.jpg
```

**Logo oficial:** substitua `assets/logo/logo.svg` e `assets/logo/favicon.svg`. O logo do
header/rodapé é um SVG inline em `index.html` (procure `class="logo__mark"`).

---

## 4. Trocar ou comprimir vídeos

O site procura cada vídeo em dois formatos (o navegador escolhe o melhor):
`assets/video/NOME.webm` e `assets/video/NOME.mp4`, mais o poster `assets/img/poster-NOME.jpg`.

| Arquivo | Onde aparece |
|---|---|
| `hero` (16:9) e `hero-mobile` (9:16) | Topo. Abaixo de 768px usa o mobile |
| `avaliacao` | Card Fisioterapia |
| `recuperacao` | Card Pressoterapia |
| `pilates` | Card Pilates em aparelhos |
| `pulse` | Fundo do CTA final |

Se um arquivo faltar, o poster continua aparecendo sem quebrar o layout.

**Comprimir (meta: ~1–3 MB por vídeo)** — substitua `entrada.mp4` e `NOME`:

```bash
ffmpeg -i entrada.mp4 -an -vf "scale=1280:-2,fps=24" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart assets/video/NOME.mp4
```
```bash
ffmpeg -i entrada.mp4 -an -vf "scale=1280:-2,fps=24" -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 assets/video/NOME.webm
```
```bash
ffmpeg -ss 1 -i entrada.mp4 -frames:v 1 -vf "scale=1280:-2" -q:v 5 assets/img/poster-NOME.jpg
```

Versão vertical (9:16) do hero a partir de um vídeo 16:9 (recorte central):
```bash
ffmpeg -i entrada.mp4 -an -vf "crop=ih*9/16:ih,scale=540:960,fps=24" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart assets/video/hero-mobile.mp4
```

Ficou grande? Aumente o `-crf` (28 → 30 no MP4; 40 → 44 no WebM) ou reduza para `scale=960:-2`.

> O vídeo do hero é **espelhado** no desktop (a pessoa fica à direita, liberando espaço para o
> texto). Se trocar por um vídeo com a pessoa já à direita, remova a regra
> `.hero__poster, .hero__video { transform: scaleX(-1); }` em `css/style.css`.

Acessibilidade e dados: para quem ativa "reduzir movimento" no sistema ou "economia de dados"
no celular, os vídeos não carregam e só os posters aparecem.

---

## 5. Publicar

Antes: `destacarPlaceholders: false`, `siteUrl` preenchido e, em `index.html`, descomente as
tags `canonical` / `og:url` e troque `og:image` pela URL absoluta
(ex.: `https://seudominio.com.br/assets/img/og-image.jpg`).

**Netlify (mais simples):** entre em app.netlify.com → *Add new site* → *Deploy manually* →
arraste a pasta do projeto (pode deixar a pasta `assets/vídeo` de fora). Depois, em *Domain
settings*, conecte o domínio.

**Vercel:** instale a CLI e, dentro da pasta, rode:
```bash
npx vercel --prod
```
(framework: "Other", sem comando de build, diretório de saída: `.`)

**Hospedagem comum (cPanel/FTP):** envie `index.html`, `css/`, `js/` e `assets/` (exceto
`assets/vídeo/`) para a pasta `public_html`. Ative a compressão gzip/brotli e o cache de
arquivos estáticos se o painel oferecer.

Depois de publicar, teste no PageSpeed Insights (pagespeed.web.dev) e cadastre o site no Google
Search Console e no Perfil da Empresa no Google (essencial para SEO local).

---

## 6. Lista de placeholders a preencher

**Dados da clínica (`config.js → clinica`)**
- [ ] `[ENDEREÇO COMPLETO — rua/quadra, nº, sala]`
- [ ] `[CEP]`
- [ ] `[HORÁRIOS DE ATENDIMENTO]`
- [ ] `[DURAÇÃO DA AVALIAÇÃO]` (aparece na seção "Primeira consulta")
- [ ] `[CNPJ]`
- [ ] `[NOME DO RESPONSÁVEL TÉCNICO]`
- [ ] `[CREFITO DO RESPONSÁVEL TÉCNICO]`
- [ ] `mapaEmbedUrl` e `mapaLink` (Google Maps), `latitude` / `longitude` (opcional)
- [ ] `siteUrl` — `[URL DO SITE]`
- [ ] `metaPixelId` (se for usar anúncios na Meta)

**Equipe (`config.js → equipe`)** — para cada profissional
- [ ] `[NOME DA FISIOTERAPEUTA]` / `[NOME DO(A) FISIOTERAPEUTA]` / `[NOME DO(A) PROFISSIONAL]`
- [ ] `[FUNÇÃO]`
- [ ] `[FORMAÇÃO / ESPECIALIZAÇÕES]`
- [ ] `[CREFITO]`
- [ ] Foto (`foto`)

**Depoimentos**
- [ ] `[DEPOIMENTO REAL 1, 2, 3]`, `[NOME OU INICIAIS]`, `[EX.: ALUNA DE PILATES]`
- [ ] `[VÍDEO DE DEPOIMENTO 1, 2]` (arquivo 9:16 + poster)
- [ ] Confirmar com a clínica se o uso de depoimentos é permitido e ter autorização por escrito

**O espaço**
- [ ] 6 fotos reais do espaço (`galeriaEspaco`)

**Marca e publicação**
- [ ] Logo oficial (`assets/logo/` e SVG inline no `index.html`)
- [ ] Domínio: `canonical`, `og:url` e `og:image` absolutos no `index.html`
- [ ] Revisão de todos os textos pela clínica / responsável técnico (COFFITO)
- [ ] `destacarPlaceholders: false`

> Observação: os vídeos foram gerados por IA (Google Flow/Veo). Considere substituí-los, aos
> poucos, por imagens reais do espaço e da equipe, que tendem a gerar mais confiança.
