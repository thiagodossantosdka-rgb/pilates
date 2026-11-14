/* ==========================================================================
   KINEHOS — comportamento da landing page (JavaScript vanilla, sem build)
   --------------------------------------------------------------------------
   Os dados editáveis ficam em js/config.js. Este arquivo cuida de:
   01. Utilidades
   02. Rastreamento: UTMs + Meta Pixel
   03. Links de WhatsApp (todos os CTAs)
   04. Preenchimento dos dados do config + renderização de listas
   05. Schema.org (SEO local)
   06. Header, navegação ativa e parallax do hero
   07. Animações de entrada (IntersectionObserver)
   08. Vídeos (hero responsivo + lazy load dos demais)
   09. Linha de pulso (ECG) desenhada conforme o scroll
   10. Carrossel de motivos e slider de depoimentos
   11. Modal de tratamentos
   12. Lightbox das galerias
   13. WhatsApp flutuante e mapa
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 01. Utilidades ---------- */
  var cfg = window.KINEHOS_CONFIG || {};
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  /** Lê "a.b.c" dentro do config */
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, cfg);
  }
  /** Um texto é placeholder quando começa com "[" */
  function isPh(v) { return typeof v === "string" && v.trim().charAt(0) === "["; }
  function filled(v) { return typeof v === "string" && v.trim() !== "" && !isPh(v); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /** Texto escapado; se for placeholder e o destaque estiver ligado, envolve em .is-ph */
  function phHtml(v) {
    var t = esc(v);
    return isPh(v) && cfg.destacarPlaceholders ? '<span class="is-ph">' + t + "</span>" : t;
  }
  function store(kind, key, val) {
    try {
      var s = window[kind];
      if (val === undefined) return s.getItem(key);
      s.setItem(key, val);
    } catch (e) { return null; }
  }
  function onIdle(fn) {
    if ("requestIdleCallback" in window) requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 600);
  }

  /* ---------- 02. Rastreamento: UTMs + Meta Pixel ---------- */
  // UTMs da URL ficam guardadas na sessão para não se perderem ao navegar por âncoras.
  var utm = (function () {
    var p = new URLSearchParams(location.search);
    var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var found = {};
    keys.forEach(function (k) { if (p.get(k)) found[k] = p.get(k); });
    if (Object.keys(found).length) { store("sessionStorage", "kinehos_utm", JSON.stringify(found)); return found; }
    try { return JSON.parse(store("sessionStorage", "kinehos_utm") || "{}") || {}; } catch (e) { return {}; }
  })();

  /** Ex.: "meta-ads / cpc / campanha-pilates" */
  function utmLabel() {
    return [utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content]
      .filter(Boolean).join(" / ");
  }

  // Meta Pixel: só carrega se houver ID no config. O "stub" fbq é criado já,
  // para enfileirar eventos; o script da Meta é baixado após o load (não pesa no LCP).
  var pixelOn = /^\d{6,}$/.test(String(cfg.metaPixelId || "").trim());
  if (pixelOn) {
    (function (f) {
      if (f.fbq) return;
      var n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    })(window);
    window.fbq("init", String(cfg.metaPixelId).trim());
    window.fbq("track", "PageView");
    window.addEventListener("load", function () {
      onIdle(function () {
        var s = document.createElement("script");
        s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(s);
      });
    });
  }

  function trackWhatsApp(origem, servico) {
    if (!pixelOn || !window.fbq) return;
    var params = { content_name: servico || "Avaliação", content_category: origem };
    var u = utmLabel(); if (u) params.utm = u;
    (cfg.metaPixelEventos || ["Contact"]).forEach(function (ev) { window.fbq("track", ev, params); });
  }

  /* ---------- 03. Links de WhatsApp ---------- */
  /**
   * Monta https://wa.me/NUMERO?text=... com:
   * - mensagem do config.mensagens[chave]
   * - origem do clique (ex.: "hero", "card-coluna", "metodo")
   * - UTMs, se a pessoa chegou por campanha
   */
  function waUrl(msgKey, origem) {
    var msgs = cfg.mensagens || {};
    var text = msgs[msgKey] || msgs.padrao || "Olá! Vi o site da Kinehos e gostaria de agendar uma avaliação.";
    var tags = "[ref: " + origem + "]";
    var u = utmLabel();
    if (u) tags += " [origem: " + u + "]";
    var num = String(cfg.whatsapp || "5561995719079").replace(/\D/g, "");
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(text + "\n\n" + tags);
  }

  function setupWaLinks() {
    $$("a[data-wa]").forEach(function (a) {
      a.href = waUrl(a.getAttribute("data-wa-msg") || "padrao", a.getAttribute("data-wa"));
    });
    // Delegação: atualiza o href no clique (garante UTMs atuais) e dispara o pixel.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-wa]");
      if (!a) return;
      var origem = a.getAttribute("data-wa");
      a.href = waUrl(a.getAttribute("data-wa-msg") || "padrao", origem);
      trackWhatsApp(origem, a.getAttribute("data-wa-servico"));
    });
  }

  /* ---------- 04. Dados do config ---------- */
  function bindConfig() {
    $$("[data-cfg]").forEach(function (el) {
      var v = get(el.getAttribute("data-cfg"));
      if (typeof v !== "string" || v === "") return;
      el.textContent = v;
      el.classList.toggle("is-ph", isPh(v) && !!cfg.destacarPlaceholders);
    });
    $$("[data-cfg-href]").forEach(function (el) {
      var v = get(el.getAttribute("data-cfg-href"));
      if (filled(v)) el.href = v;
    });
    var y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear();
  }

  var ICON_PERSON = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="17" r="8"/><path d="M8 42c2-9 8-13 16-13s14 4 16 13"/></svg>';
  var ICON_PHOTO = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="10" width="36" height="28" rx="5"/><circle cx="17" cy="20" r="4"/><path d="m6 34 11-9 9 7 6-5 10 8"/></svg>';

  var renderers = {
    equipe: function (list) {
      return list.map(function (p) {
        var foto = filled(p.foto)
          ? '<img src="' + esc(p.foto) + '" alt="' + esc(isPh(p.nome) ? "Foto do profissional" : p.nome) + '" width="400" height="440" loading="lazy" decoding="async">'
          : '<div class="member__ph">' + ICON_PERSON + "<span>[FOTO]</span></div>";
        return '<li class="member reveal"><div class="member__photo">' + foto + "</div>" +
          '<div class="member__body"><h3 class="member__name">' + phHtml(p.nome) + "</h3>" +
          '<p class="member__role">' + phHtml(p.cargo) + "</p>" +
          '<p class="member__formacao">' + phHtml(p.formacao) + "</p>" +
          '<span class="member__crefito">CREFITO ' + phHtml(p.crefito) + "</span></div></li>";
      }).join("");
    },
    depoimentos: function (list) {
      return list.map(function (d, i) {
        return '<li class="quote">' +
          '<blockquote><p class="quote__text">' + phHtml(d.texto) + "</p></blockquote>" +
          '<p class="quote__who">' + phHtml(d.nome) + '<span class="quote__ctx">' + phHtml(d.contexto) + "</span></p></li>";
      }).join("");
    },
    videosDepoimento: function (list) {
      return list.map(function (v) {
        if (filled(v.src)) {
          return '<li class="vt"><video controls playsinline preload="none"' +
            (filled(v.poster) ? ' poster="' + esc(v.poster) + '"' : "") + ' aria-label="' + esc(v.legenda || "Depoimento em vídeo") + '">' +
            '<source src="' + esc(v.src) + '" type="video/mp4"></video></li>';
        }
        return '<li class="vt"><div class="vt__ph"><span class="vt__play" aria-hidden="true"></span><span>' + phHtml(v.legenda || "[VÍDEO DE DEPOIMENTO]") + "</span></div></li>";
      }).join("");
    },
    gallery: function (list) {
      return list.map(function (g, i) {
        var inner = filled(g.src)
          ? '<img src="' + esc(g.src) + '" alt="' + esc(g.alt) + '" loading="lazy" decoding="async" width="800" height="600">'
          : '<span class="gallery__ph">' + ICON_PHOTO + "<span>" + esc(g.alt) + "</span></span>";
        return '<li class="reveal"><button class="gallery__btn" type="button" data-index="' + i + '" aria-label="Ampliar: ' + esc(g.alt) + '">' + inner + "</button></li>";
      }).join("");
    }
  };

  function renderLists() {
    $$("[data-render]").forEach(function (el) {
      var key = el.getAttribute("data-render");
      var list = cfg[key];
      if (!Array.isArray(list) || !list.length) { el.hidden = true; return; }
      var fn = renderers[key] || (key.indexOf("galeria") === 0 ? renderers.gallery : null);
      if (fn) el.innerHTML = fn(list);
    });
  }

  /* ---------- 05. Schema.org (SEO local) ---------- */
  // Tipo MedicalClinic com especialidade Physiotherapy. Campos com placeholder são omitidos.
  function injectSchema() {
    var c = cfg.clinica || {};
    var site = filled(cfg.siteUrl) ? cfg.siteUrl : location.origin + location.pathname;
    var address = { "@type": "PostalAddress", addressLocality: c.cidade || "Brasília", addressRegion: c.uf || "DF", addressCountry: "BR" };
    if (filled(c.endereco)) address.streetAddress = c.endereco + (c.bairro ? ", " + c.bairro : "");
    else if (c.bairro) address.streetAddress = c.bairro;
    if (filled(c.cep)) address.postalCode = c.cep;

    var data = {
      "@context": "https://schema.org",
      "@type": "MedicalClinic",
      name: c.nome || "Kinehos Pilates e Fisioterapia",
      description: "Pilates em aparelhos e Fisioterapia integrados no Condomínio RK, Brasília/DF, com avaliação e plano individualizado.",
      slogan: "Transformando o seu movimento na sua melhor biografia.",
      url: site,
      image: new URL("assets/img/og-image.jpg", site).href,
      telephone: "+" + String(cfg.whatsapp || "").replace(/\D/g, ""),
      address: address,
      medicalSpecialty: "Physiotherapy",
      availableService: ["Fisioterapia", "Pilates em aparelhos", "Pressoterapia", "Liberação miofascial", "Massagem esportiva", "Eletroestimulação"]
        .map(function (n) { return { "@type": "MedicalTherapy", name: n }; }),
      areaServed: { "@type": "City", name: "Brasília" },
      sameAs: filled(cfg.instagram) ? [cfg.instagram] : []
    };
    if (filled(c.latitude) && filled(c.longitude)) data.geo = { "@type": "GeoCoordinates", latitude: c.latitude, longitude: c.longitude };
    if (filled(c.mapaLink)) data.hasMap = c.mapaLink;
    if (filled(c.cnpj)) data.taxID = c.cnpj;

    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  /* ---------- 06. Header, navegação ativa e parallax ---------- */
  function setupHeader() {
    var header = $("[data-header]");
    var hero = $(".hero");
    var heroContent = $(".hero__content");
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      // Parallax leve no conteúdo do hero
      if (!reduceMotion && heroContent && y < hero.offsetHeight) {
        heroContent.style.transform = "translate3d(0," + (y * 0.18).toFixed(1) + "px,0)";
        heroContent.style.opacity = String(Math.max(0, 1 - y / (hero.offsetHeight * 0.9)).toFixed(3));
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    // Destaca o link da seção visível
    var links = $$(".nav__list a");
    if (!("IntersectionObserver" in window) || !links.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.setAttribute("aria-current", l.getAttribute("href") === "#" + en.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (l) { var s = $(l.getAttribute("href")); if (s) io.observe(s); });
  }

  /* ---------- 07. Animações de entrada ---------- */
  function setupReveal() {
    var els = $$(".reveal, .reveal-mask, [data-flow], [data-timeline]");
    // Pequeno escalonamento entre irmãos (cards entram um após o outro)
    els.forEach(function (el) {
      if (!el.classList.contains("reveal")) return;
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); });
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty("--d", Math.min(i * 0.08, 0.4) + "s");
    });
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    // .reveal-mask começa 100% recortado (clip-path) e o IntersectionObserver
    // o consideraria invisível para sempre: por isso observamos o elemento pai.
    var targets = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        (targets.get(en.target) || []).forEach(function (el) {
          el.classList.add("is-visible");
          // Depois da entrada, troca para transições rápidas (hover sem atraso)
          var d = parseFloat(el.style.getPropertyValue("--d")) || 0;
          setTimeout(function () { el.classList.add("is-settled"); }, 1900 + d * 1000);
        });
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    els.forEach(function (el) {
      var watch = el.classList.contains("reveal-mask") ? el.parentElement : el;
      if (!targets.has(watch)) targets.set(watch, []);
      targets.get(watch).push(el);
      io.observe(watch);
    });
  }

  /* ---------- 08. Vídeos ---------- */
  // Sem vídeos para quem pediu menos movimento ou economia de dados: fica o poster.
  var videosAllowed = !reduceMotion && !saveData;

  // iPhone/iPad (qualquer navegador no iOS usa o motor do Safari) e Safari no Mac.
  // O Safari diz que "talvez" toque WebM, escolhe o .webm e trava. Para ele, o MP4
  // (H.264) vem primeiro. iPadOS se apresenta como Mac, por isso o teste de toque.
  var ua = navigator.userAgent;
  var isIOS = /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isSafari = isIOS || (/Safari/.test(ua) && /Apple/.test(navigator.vendor || "") && !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS/.test(ua));

  /** Tenta tocar; se o navegador bloquear (ex.: iPhone em Modo de Pouca Energia),
   *  guarda o vídeo para tocar no primeiro toque da pessoa na tela. */
  var blockedVideos = new Set();
  function tryPlay(video) {
    var p = video.play();
    if (p && p.then) p.then(function () { blockedVideos.delete(video); }, function () {
      blockedVideos.add(video);
      safariImgFallback(video);
    });
    return p;
  }

  /**
   * Plano B do Safari: quando o iPhone recusa o autoplay do <video> (Modo de Pouca
   * Energia, por exemplo) ele mostra um botão de play. O Safari também aceita MP4
   * dentro de <img>, que roda sozinho e em loop como um GIF e não passa por essa
   * regra. Então trocamos o <video> por um <img src="....mp4"> com as mesmas classes.
   */
  function safariImgFallback(video) {
    if (!isSafari || video.dataset.imgFallback || !video.dataset.loaded) return;
    video.dataset.imgFallback = "1";
    var img = document.createElement("img");
    img.className = video.className.replace("is-playing", "") + " is-img-video";
    img.alt = ""; img.setAttribute("aria-hidden", "true"); img.decoding = "async";
    img.onload = function () {
      video.pause();
      video.style.display = "none";   // só esconde o <video> quando a imagem animada carregou
      blockedVideos.delete(video);
    };
    img.onerror = function () { img.remove(); };
    img.src = video.dataset.loaded + ".mp4";
    video.parentNode.insertBefore(img, video.nextSibling);
  }
  function unlockOnGesture() {
    function unlock() {
      blockedVideos.forEach(function (v) {
        var r = v.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) tryPlay(v);
      });
    }
    ["touchstart", "touchend", "click", "scroll"].forEach(function (t) { window.addEventListener(t, unlock, { passive: true }); });
  }

  /** Coloca <source> WebM + MP4 a partir de um caminho base (sem extensão).
   *  play=false só baixa o vídeo (pré-carregamento), sem tocar. */
  function loadVideo(video, base, play) {
    var webm = '<source src="' + base + '.webm" type=\'video/webm; codecs="vp9"\'>';
    var mp4 = '<source src="' + base + '.mp4" type=\'video/mp4; codecs="avc1.64001F"\'>';
    // O vídeo fica visível desde o início (regra do iOS); para não aparecer um
    // quadro preto antes de tocar, ele usa a mesma imagem do poster ao lado.
    var img = video.parentElement && video.parentElement.querySelector("img");
    if (img && !video.getAttribute("poster")) video.setAttribute("poster", img.currentSrc || img.src);
    video.innerHTML = isSafari ? mp4 + webm : webm + mp4;
    // iOS só deixa tocar sozinho se estiver mudo E inline (atributos, não só propriedades)
    video.muted = true; video.defaultMuted = true;
    video.setAttribute("muted", ""); video.setAttribute("playsinline", ""); video.setAttribute("webkit-playsinline", "");
    if (play === false) { video.autoplay = false; video.preload = "auto"; }
    var sources = video.querySelectorAll("source");
    // Se os arquivos não existirem, o poster continua visível (o vídeo só aparece ao tocar)
    sources[sources.length - 1].addEventListener("error", function () { video.classList.add("is-broken"); });
    video.addEventListener("playing", function () { video.classList.add("is-playing"); }, { once: true });
    video.load();
    video.dataset.loaded = base;
    if (play !== false) {
      tryPlay(video);
      // Vigia: se no Safari o vídeo continuar parado (promessa que nunca resolve),
      // cai para o plano B em vez de deixar o botão de play na tela.
      if (isSafari) setTimeout(function () {
        if (video.paused && video.currentTime === 0) safariImgFallback(video);
      }, 3500);
    }
  }

  /**
   * Vídeo do hero: começa a baixar JÁ, por trás da tela de carregamento, e
   * a página só abre quando ele consegue tocar sem pausas (canplaythrough).
   * Retorna uma Promise + progresso (0–1) para a barra do loader.
   */
  var heroVideoState = { progress: 0, ready: Promise.resolve() };
  function setupHeroVideo() {
    var v = $("[data-hero-video]");
    if (!v || !videosAllowed) { heroVideoState.progress = 1; return; }
    var mq = window.matchMedia("(max-width: 767px)");
    function base() { return mq.matches ? v.getAttribute("data-src-mobile") : v.getAttribute("data-src-desktop"); }

    heroVideoState.ready = new Promise(function (resolve) {
      function done() { heroVideoState.progress = 1; resolve(); }
      v.preload = "auto";
      v.addEventListener("canplaythrough", done, { once: true });
      // O Safari do iOS raramente dispara "canplaythrough" (ele não bufferiza à frente):
      // lá, "já está tocando" é o sinal de pronto.
      v.addEventListener("playing", done, { once: true });
      v.addEventListener("error", done, { once: true });
      v.addEventListener("progress", function () {
        try {
          if (v.duration && v.buffered.length) heroVideoState.progress = Math.min(1, v.buffered.end(v.buffered.length - 1) / v.duration);
        } catch (e) {}
      });
      loadVideo(v, base());
      var srcs = v.querySelectorAll("source");
      srcs[srcs.length - 1].addEventListener("error", done);
      // Autoplay bloqueado (Modo de Pouca Energia): não segura o loader, fica o poster
      var p = v.play();
      if (p && p.catch) p.catch(function () { blockedVideos.add(v); done(); });
    });

    if (mq.addEventListener) mq.addEventListener("change", function () {
      if (v.dataset.loaded !== base()) { v.classList.remove("is-playing"); loadVideo(v, base()); }
    });
    // Pausa quando o hero sai da tela
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        if (!v.dataset.loaded) return;
        if (en[0].isIntersecting) tryPlay(v); else v.pause();
      }).observe(v.parentElement);
    }
  }

  /** Depois que a página abre, baixa os demais vídeos em segundo plano (sem tocar),
   *  para que já estejam prontos quando a pessoa rolar até eles. */
  function preloadLazyVideos() {
    // No iOS o pré-carregamento sem tocar é ignorado e só gasta memória: lá cada
    // vídeo carrega quando chega perto da tela (rootMargin generoso abaixo).
    if (!videosAllowed || saveData || isIOS) return;
    var vids = $$("[data-lazy-video]").filter(function (v) { return !v.dataset.loaded; });
    var i = 0;
    (function next() {
      var v = vids[i++];
      if (!v) return;
      if (!v.dataset.loaded) loadVideo(v, v.getAttribute("data-src"), false);
      // um de cada vez, para não disputar banda
      var go = function () { onIdle(next); };
      v.addEventListener("canplaythrough", go, { once: true });
      v.addEventListener("error", go, { once: true });
      setTimeout(go, 4000);
    })();
  }

  function setupLazyVideos() {
    var vids = $$("[data-lazy-video]");
    // tocam só quando visíveis (o atributo autoplay faria tocarem fora da tela)
    vids.forEach(function (v) { v.autoplay = false; v.removeAttribute("autoplay"); });
    if (!vids.length || !videosAllowed || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (!v.dataset.loaded) loadVideo(v, v.getAttribute("data-src"));
          else tryPlay(v);
        } else if (v.dataset.loaded) {
          v.pause();
        }
      });
    }, { rootMargin: isIOS ? "600px 0px" : "200px 0px", threshold: 0.01 });
    vids.forEach(function (v) { io.observe(v); });
    unlockOnGesture();
  }

  /* ---------- 09. Linha de pulso (ECG) ---------- */
  // Uma linha vertical na margem esquerda (desktop ≥1100px) que se desenha com o scroll
  // e faz um "batimento" no início de cada seção.
  function setupPulseLine() {
    var svg = $("[data-pulse-line]");
    var main = $("main");
    var hero = $(".hero");
    if (!svg || !main || !hero) return;
    var track = $(".pulse-line__track", svg);
    var path = $(".pulse-line__path", svg);
    var dot = $(".pulse-line__dot", svg);
    var mq = window.matchMedia("(min-width: 1100px)");
    var total = 0, samples = [], startY = 0, endY = 0, raf = 0;

    // Batimento (dx, dy) relativo — soma de dx = 0, para voltar ao eixo
    var BEAT = [[5, 6], [-5, 6], [0, 10], [-4, 3], [22, 6], [-26, 7], [4, 4], [0, 10], [7, 8], [-3, 8]];

    function build() {
      if (!mq.matches) { svg.classList.remove("is-ready"); return; }
      var W = main.clientWidth, H = main.scrollHeight;
      var mainTop = main.getBoundingClientRect().top + window.scrollY;
      var x = Math.max(24, Math.round((W - 1180) / 2 - 30));
      startY = hero.offsetHeight - 39;
      var cta = $(".cta-final");
      endY = cta ? cta.offsetTop + 40 : H - 40;

      var d = "M" + x + " " + startY;
      $$("[data-pulse-anchor]").forEach(function (sec) {
        var head = $(".ecg-mark", sec) || sec;
        var y = Math.round(head.getBoundingClientRect().top + window.scrollY - mainTop) - 20;
        if (y <= startY + 60 || y >= endY) return;
        d += " L" + x + " " + y;
        BEAT.forEach(function (b) { d += " l" + b[0] + " " + b[1]; });
      });
      d += " L" + x + " " + endY;

      // SVG é só uma faixa de 100px em volta da linha (camada leve para o navegador)
      svg.style.left = (x - 50) + "px";
      svg.setAttribute("viewBox", (x - 50) + " 0 100 " + H);
      track.setAttribute("d", d);
      path.setAttribute("d", d);
      total = path.getTotalLength();
      path.style.strokeDasharray = total + " " + total;

      // Tabela comprimento → y para achar rápido quanto desenhar
      samples = [];
      for (var l = 0; l <= total; l += 16) samples.push([l, path.getPointAtLength(l).y]);
      samples.push([total, endY]);
      svg.classList.add("is-ready");
      draw();
    }

    function lengthAtY(y) {
      if (y <= startY) return 0;
      if (y >= endY) return total;
      var lo = 0, hi = samples.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (samples[mid][1] < y) lo = mid + 1; else hi = mid; }
      return samples[lo][0];
    }

    function draw() {
      raf = 0;
      if (!total) return;
      if (reduceMotion) { path.style.strokeDashoffset = 0; dot.style.display = "none"; return; }
      var mainTop = main.getBoundingClientRect().top + window.scrollY;
      var targetY = window.scrollY + window.innerHeight * 0.62 - mainTop;
      var len = lengthAtY(targetY);
      path.style.strokeDashoffset = String(total - len);
      var pt = path.getPointAtLength(Math.max(len, 0.1));
      dot.setAttribute("cx", pt.x.toFixed(1));
      dot.setAttribute("cy", pt.y.toFixed(1));
    }

    var rebuildTimer;
    function rebuildSoon() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(build, 150); }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(draw); }, { passive: true });
    window.addEventListener("resize", rebuildSoon);
    if ("ResizeObserver" in window) new ResizeObserver(rebuildSoon).observe(main);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuildSoon);
    window.addEventListener("load", rebuildSoon);
    build();
  }

  /* ---------- 10. Carrossel de motivos e slider de depoimentos ---------- */
  function makeDots(container, count) {
    if (!container) return [];
    container.innerHTML = "";
    var dots = [];
    for (var i = 0; i < count; i++) { var s = document.createElement("span"); container.appendChild(s); dots.push(s); }
    return dots;
  }
  function activeIndex(track) {
    var items = track.children;
    if (!items.length) return 0;
    var left = track.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0);
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < items.length; i++) {
      var d = Math.abs(items[i].getBoundingClientRect().left - left);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    // Fim da rolagem: último item ativo
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = items.length - 1;
    return best;
  }
  function bindDots(track, dots) {
    var t;
    function update() { var i = activeIndex(track); dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i); }); }
    track.addEventListener("scroll", function () { cancelAnimationFrame(t); t = requestAnimationFrame(update); }, { passive: true });
    update();
    return update;
  }

  function setupCarousels() {
    // Carrosséis com arraste (motivos e equipe): só os "dots" precisam de JS
    $$("[data-carousel]").forEach(function (mc) {
      var tr = $("[data-carousel-track]", mc);
      if (!tr || !tr.children.length) return;
      bindDots(tr, makeDots($("[data-carousel-dots]", mc), tr.children.length));
    });

    var sl = $("[data-slider]");
    if (!sl) return;
    var track = $("[data-slider-track]", sl);
    if (!track || !track.children.length) { sl.hidden = true; return; }
    var update = bindDots(track, makeDots($("[data-slider-dots]", sl), track.children.length));
    function go(dir) {
      var item = track.children[0];
      var step = item.getBoundingClientRect().width + 20;
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });
      else if (dir < 0 && track.scrollLeft <= 4) track.scrollTo({ left: track.scrollWidth, behavior: reduceMotion ? "auto" : "smooth" });
      else track.scrollBy({ left: dir * step, behavior: reduceMotion ? "auto" : "smooth" });
      setTimeout(update, 450);
    }
    $("[data-slider-prev]", sl).addEventListener("click", function () { go(-1); });
    $("[data-slider-next]", sl).addEventListener("click", function () { go(1); });
    track.setAttribute("tabindex", "0");
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
  }

  /* ---------- 11. Modal de tratamentos ---------- */
  function setupModal() {
    var dlg = $("[data-modal]");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var title = $("#modal-title", dlg);
    var content = $("[data-modal-content]", dlg);
    var cta = $("[data-modal-cta]", dlg);

    $$("[data-modal-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = document.getElementById(btn.getAttribute("data-modal-open"));
        if (!src) return;
        title.textContent = src.getAttribute("data-title");
        content.innerHTML = src.innerHTML;
        var key = src.getAttribute("data-wa-msg") || "padrao";
        cta.setAttribute("data-wa", "modal-" + key);
        cta.setAttribute("data-wa-msg", key);
        cta.setAttribute("data-wa-servico", src.getAttribute("data-wa-servico") || "");
        cta.href = waUrl(key, "modal-" + key);
        dlg.showModal();
      });
    });
    $("[data-modal-close]", dlg).addEventListener("click", function () { softClose(dlg); });
    // Clique fora da caixa fecha
    dlg.addEventListener("click", function (e) { if (e.target === dlg) softClose(dlg); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); softClose(dlg); });
  }

  /* ---------- 12. Lightbox ---------- */
  function setupLightbox() {
    var lb = $("[data-lightbox]");
    if (!lb || typeof lb.showModal !== "function") return;
    var stage = $("[data-lightbox-stage]", lb);
    var caption = $("[data-lightbox-caption]", lb);
    var list = [], idx = 0;

    function show(i) {
      idx = (i + list.length) % list.length;
      var g = list[idx];
      stage.innerHTML = filled(g.src)
        ? '<img src="' + esc(g.src) + '" alt="' + esc(g.alt) + '">'
        : '<span class="gallery__ph">' + ICON_PHOTO + "<span>" + esc(g.alt) + "</span></span>";
      caption.textContent = (filled(g.alt) ? g.alt + " · " : "") + (idx + 1) + "/" + list.length;
    }
    $$("[data-gallery]").forEach(function (gal) {
      var key = gal.getAttribute("data-render");
      gal.addEventListener("click", function (e) {
        var b = e.target.closest(".gallery__btn");
        if (!b) return;
        list = cfg[key] || [];
        show(+b.getAttribute("data-index"));
        lb.showModal();
      });
    });
    $("[data-lightbox-close]", lb).addEventListener("click", function () { softClose(lb); });
    lb.addEventListener("cancel", function (e) { e.preventDefault(); softClose(lb); });
    $("[data-lightbox-prev]", lb).addEventListener("click", function () { show(idx - 1); });
    $("[data-lightbox-next]", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) softClose(lb); });
  }

  /** Fecha um <dialog> com animação de saída */
  function softClose(dlg) {
    if (!dlg.open || dlg.classList.contains("is-closing")) return;
    if (reduceMotion) { dlg.close(); return; }
    dlg.classList.add("is-closing");
    setTimeout(function () { dlg.classList.remove("is-closing"); dlg.close(); }, 280);
  }

  /* ---------- 13. WhatsApp flutuante e mapa ---------- */
  function setupFloat() {
    var wrap = $("[data-wa-float]");
    var bubble = $("[data-wa-bubble]");
    if (!wrap || !bubble) return;
    function hideBubble(remember) {
      bubble.classList.remove("is-in");
      if (remember) store("sessionStorage", "kinehos_bubble_off", "1");
      setTimeout(function () { bubble.hidden = true; }, 450);
    }
    // Surge após 5s e some sozinho após 14s (para não cobrir conteúdo no celular)
    if (store("sessionStorage", "kinehos_bubble_off") !== "1") {
      setTimeout(function () {
        bubble.hidden = false;
        requestAnimationFrame(function () { requestAnimationFrame(function () { bubble.classList.add("is-in"); }); });
        setTimeout(function () { hideBubble(false); }, 14000);
      }, 5000);
    }
    $("[data-wa-bubble-close]", bubble).addEventListener("click", function () { hideBubble(true); });
    // Quieto quando o CTA final ou o rodapé já estão na tela
    if ("IntersectionObserver" in window) {
      var visible = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
        wrap.classList.toggle("is-quiet", visible.size > 0);
      });
      [".cta-final", ".footer"].forEach(function (s) { var el = $(s); if (el) io.observe(el); });
    }
  }

  function setupMap() {
    var box = $("[data-map]");
    var url = (cfg.clinica || {}).mapaEmbedUrl;
    if (!box || !filled(url) || !/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(url)) return;
    box.innerHTML = '<iframe src="' + esc(url) + '" title="Mapa: localização da Kinehos no Condomínio RK, Brasília/DF" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }

  /* ---------- 14. Camada dinâmica ---------- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /** Envolve cada palavra em <span class="w"><span>…</span></span> (preserva <em> etc.) */
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { walk(n); return; }
        if (n.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement("span"); w.className = "w";
          var inner = document.createElement("span");
          inner.textContent = part; inner.style.setProperty("--i", i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      });
    })(el);
    el.classList.add("split");
  }

  function setupIntro() {
    if (!reduceMotion) $$(".hero__title, .section__title, .cta-final__title").forEach(splitWords);
  }
  function playHeroIntro() {
    var hero = $(".hero");
    if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add("is-in"); }); });
  }

  /**
   * Tela de carregamento: espera fontes + poster + vídeo do hero (com teto de
   * tempo, para nunca prender a pessoa), anima a saída e só então abre o hero.
   */
  function setupLoader() {
    var loader = $("[data-loader]");
    var bar = $("[data-loader-bar]");
    if (!loader) { playHeroIntro(); preloadLazyVideos(); return; }
    var root = document.documentElement;
    root.style.overflow = "hidden";
    var t0 = performance.now();
    var MIN = reduceMotion ? 300 : 2000;  // tempo para a animação da logo acontecer
    var MAX = 8000;                       // conexão lenta: abre mesmo assim
    var parts = { fonts: 0, poster: 0 };

    var fonts = (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
      .then(function () { parts.fonts = 1; });
    var poster = new Promise(function (res) {
      var img = $(".hero__poster");
      if (!img || (img.complete && img.naturalWidth)) return res();
      img.addEventListener("load", res, { once: true });
      img.addEventListener("error", res, { once: true });
    }).then(function () { parts.poster = 1; });

    var shown = 0, raf;
    (function tick() {
      var target = parts.fonts * 0.15 + parts.poster * 0.25 + heroVideoState.progress * 0.6;
      var timeCap = Math.min(1, (performance.now() - t0) / MIN); // barra não corre mais que a animação
      shown += (Math.min(target, timeCap) - shown) * 0.12;
      if (bar) bar.style.transform = "scaleX(" + shown.toFixed(3) + ")";
      raf = requestAnimationFrame(tick);
    })();

    var minTime = new Promise(function (r) { setTimeout(r, MIN); });
    var allReady = Promise.all([fonts, poster, heroVideoState.ready, minTime]);
    var cap = new Promise(function (r) { setTimeout(r, MAX); });

    Promise.race([allReady, cap]).then(function () {
      if (bar) bar.style.transform = "scaleX(1)";
      setTimeout(function () {
        cancelAnimationFrame(raf);
        loader.classList.add("is-done");
        root.style.overflow = "";
        // o hero começa a entrar enquanto a cortina sobe
        setTimeout(playHeroIntro, 350);
        setTimeout(function () {
          loader.remove();
          onIdle(preloadLazyVideos);
        }, 1150);
      }, 250);
    });
  }

  /** Progresso de leitura, header que se esconde, parallax do CTA e texto que acende */
  function setupScrollFx() {
    var bar = $("[data-progress]");
    var header = $("[data-header]");
    var hero = $(".hero");
    var ctaMedia = $(".cta-final__media");
    var scrub = $("[data-scrub]");
    var words = [];
    if (scrub && !reduceMotion) {
      scrub.innerHTML = scrub.textContent.trim().split(/\s+/).map(function (w) { return '<span class="sw">' + esc(w) + "</span>"; }).join(" ");
      words = $$(".sw", scrub);
      scrub.classList.add("is-scrub");
    }
    var lastY = window.scrollY, ticking = false, lit = -1;

    function update() {
      ticking = false;
      var y = window.scrollY, vh = window.innerHeight;
      var max = document.documentElement.scrollHeight - vh;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";

      var dy = y - lastY;
      if (Math.abs(dy) > 8) {
        var hide = dy > 0 && y > hero.offsetHeight * 0.6 && !header.contains(document.activeElement);
        header.classList.toggle("is-hidden", hide);
        lastY = y;
      }
      if (reduceMotion) return;

      if (ctaMedia) {
        var r = ctaMedia.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
          ctaMedia.style.transform = "translate3d(0," + (p * -20).toFixed(2) + "%,0)";
        }
      }
      if (words.length) {
        var sr = scrub.getBoundingClientRect();
        var prog = (vh * 0.88 - sr.top) / (vh * 0.5);
        var n = Math.round(Math.max(0, Math.min(1, prog)) * words.length);
        if (n !== lit) { words.forEach(function (w, k) { w.classList.toggle("on", k < n); }); lit = n; }
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /** Inclinação 3D + luz que segue o cursor (só mouse/trackpad) */
  function setupTilt() {
    if (!finePointer || reduceMotion) return;
    $$(".motive__link, .treat, .member").forEach(function (el) {
      var raf = 0, ev = null;
      el.setAttribute("data-tilt", "");
      el.addEventListener("pointermove", function (e) {
        ev = e;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          var k = r.width > 600 ? 2.5 : 6; // cards largos inclinam menos
          el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
          el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
          el.style.setProperty("--ry", ((x - 0.5) * k).toFixed(2) + "deg");
          el.style.setProperty("--rx", ((0.5 - y) * k).toFixed(2) + "deg");
        });
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /** Botões principais "puxam" levemente em direção ao cursor */
  function setupMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$(".btn--lg, .btn--xl, .hero .btn, .split__text > .btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px");
        b.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
    });
  }

  /* ---------- Inicialização ---------- */
  function init() {
    bindConfig();
    renderLists();
    setupIntro();
    setupHeroVideo();
    setupLoader();
    setupScrollFx();
    setupTilt();
    setupMagnetic();
    setupWaLinks();
    injectSchema();
    setupHeader();
    setupReveal();
    setupLazyVideos();
    setupCarousels();
    setupModal();
    setupLightbox();
    setupFloat();
    setupMap();
    setupPulseLine();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
