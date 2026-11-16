const GITHUB_OWNER = "yuridakbrada";
const GITHUB_REPO = "dashwatch";
const GITHUB_BRANCH = "main";
const USER_ID = "3705d4ab-4f17-45cf-8a0e-593295143f68";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;

const allowedOrigins = ["https://dashwatch.news", "https://www.dashwatch.news"];

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.includes(origin) ? origin : "https://dashwatch.news",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(data: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

function escapeHTML(value: unknown): string {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function safeURL(value: unknown): string {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
}

function githubHeaders() {
  return {
    "Authorization": \`Bearer \${GITHUB_TOKEN}\`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function githubPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getGitHubFile(path: string) {
  const response = await fetch(
    \`https://api.github.com/repos/\${GITHUB_OWNER}/\${GITHUB_REPO}/contents/\${githubPath(path)}?ref=\${GITHUB_BRANCH}\`,
    { headers: githubHeaders() },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(\`GitHub não conseguiu ler \${path}: \${response.status}\`);
  return await response.json();
}

async function saveGitHubFile(path: string, content: string, message: string) {
  const existing = await getGitHubFile(path);
  const body: Record<string, unknown> = {
    message, content: encodeBase64(content), branch: GITHUB_BRANCH,
  };
  if (existing?.sha) body.sha = existing.sha;
  const response = await fetch(
    \`https://api.github.com/repos/\${GITHUB_OWNER}/\${GITHUB_REPO}/contents/\${githubPath(path)}\`,
    {
      method: "PUT",
      headers: { ...githubHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) throw new Error(\`GitHub não conseguiu salvar \${path}: \${await response.text()}\`);
  return await response.json();
}

async function readNews(): Promise<any[]> {
  const file = await getGitHubFile("noticias.json");
  if (!file?.content) throw new Error("Não foi possível encontrar noticias.json no GitHub.");
  const parsed = JSON.parse(decodeBase64(file.content));
  if (!Array.isArray(parsed)) throw new Error("O noticias.json não contém uma lista válida.");
  return parsed;
}

async function writeNews(news: any[], message: string) {
  await saveGitHubFile("noticias.json", JSON.stringify(news, null, 2) + "\n", message);
}

function getYouTubeId(value: string): string {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    else if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
      else id = url.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/)?.[2] ?? "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  } catch { return ""; }
}

function normalizeMediaURL(value: unknown): string {
  try {
    const url = new URL(String(value ?? ""));
    if (url.protocol !== "https:") return "";
    if (url.hostname === "github.com") {
      const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
      if (!match) return "";
      url.hostname = "raw.githubusercontent.com";
      url.pathname = \`/\${match[1]}/\${match[2]}/\${match[3]}/\${match[4]}\`;
      return url.href;
    }
    return url.hostname === "raw.githubusercontent.com" ? url.href : "";
  } catch { return ""; }
}

function renderBlock(block: any): string {
  const type = String(block?.tipo ?? "");
  const text = escapeHTML(block?.texto ?? "");
  const caption = escapeHTML(block?.legenda ?? "");
  if (type === "titulo") return \`<h2>\${text}</h2>\`;
  if (type === "citacao") return \`<blockquote><p>\${text}</p></blockquote>\`;
  if (type === "paragrafo") return \`<p>\${text}</p>\`;
  if (type === "imagem" || type === "midia") {
    const original = String(block?.url ?? "");
    const youtubeId = type === "midia" ? getYouTubeId(original) : "";
    if (youtubeId) return \`<div class="image-wrapper"><div class="image"><iframe src="https://www.youtube-nocookie.com/embed/\${youtubeId}" title="\${caption || "Vídeo do YouTube"}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>\${caption ? \`<div class="caption">\${caption}</div>\` : ""}</div>\`;
    const url = type === "imagem" ? safeArticleAsset(original) : normalizeMediaURL(original);
    if (!url) return "";
    const path = new URL(url).pathname.toLowerCase();
    const videoTypes: Record<string, string> = { ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg" };
    const ext = Object.keys(videoTypes).find(e => path.endsWith(e));
    if (ext) return \`<div class="image-wrapper"><div class="image"><video controls playsinline preload="metadata"><source src="\${escapeHTML(url)}" type="\${videoTypes[ext]}">Seu navegador não suporta vídeo HTML5.</video></div>\${caption ? \`<div class="caption">\${caption}</div>\` : ""}</div>\`;
    if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].some(e => path.endsWith(e))) {
      return \`<div class="image-wrapper"><div class="image"><img src="\${escapeHTML(url)}" alt="\${caption}" loading="lazy"></div>\${caption ? \`<div class="caption">\${caption}</div>\` : ""}</div>\`;
    }
  }
  return "";
}

function renderSources(sources: any[]): string {
  if (!Array.isArray(sources) || !sources.length) return "";
  const items = sources.map(source => {
    if (typeof source === "string") return escapeHTML(source);
    const name = escapeHTML(source?.nome ?? "Fonte");
    const url = safeURL(source?.url);
    return url ? \`<a href="\${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">\${name}</a>\` : name;
  });
  return \`<div class="source"><strong>Fontes:</strong><br>\${items.join("<br>")}</div>\`;
}

function buildArticle(article: any): string {
  const title = escapeHTML(article.titulo);
  const description = escapeHTML(article.descricao);
  const category = escapeHTML(article.categoria);
  const coverOriginal = safeArticleAsset(article.imagem);
  const coverURL = coverOriginal ? normalizeMediaURL(coverOriginal) || coverOriginal : "";
  const coverPath = coverURL ? new URL(coverURL).pathname.toLowerCase() : "";
  const isVideo = /\.(mp4|webm|ogg)$/.test(coverPath);
  const caption = escapeHTML(article.legenda ?? "");
  const author = "yuridakbrada";
  const dateParts = String(article.data).split("-");
  const months = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const formattedDate = dateParts.length === 3 ? \`\${dateParts[2]} de \${months[Number(dateParts[1])] ?? ""} de \${dateParts[0]}\` : article.data;
  const body = Array.isArray(article.corpo) ? article.corpo.map(renderBlock).join("\n") : "";
  const sources = renderSources(article.fontes ?? []);
  let cover = "";
  if (coverURL) {
    if (isVideo) {
      const type = coverPath.endsWith(".mp4") ? "video/mp4" : coverPath.endsWith(".webm") ? "video/webm" : "video/ogg";
      cover = \`<div class="image-wrapper"><div class="image"><video controls playsinline preload="metadata"><source src="\${escapeHTML(coverURL)}" type="\${type}">Seu navegador não suporta vídeo HTML5.</video></div>\${caption ? \`<div class="caption">\${caption}</div>\` : ""}</div>\`;
    } else cover = \`<div class="image-wrapper"><div class="image"><img src="\${escapeHTML(coverURL)}" alt="\${caption}"></div>\${caption ? \`<div class="caption">\${caption}</div>\` : ""}</div>\`;
  }
  return \`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>\${title} | DashWatch</title>
<link rel="shortcut icon" href="../../../assets/dashwatch_favicon.png" type="image/x-icon"><link rel="stylesheet" href="../../article.css"></head>
<body><header><div class="header-inner"><div class="brand-row"><div class="logo">DASH<span>WATCH</span></div></div><nav>
<a href="../../../index.html#general">GERAL</a><a href="../../../index.html#competition">COMPETIÇÃO</a><a href="../../../index.html#levels">NÍVEIS</a><a href="../../../index.html#community">COMUNIDADE</a><a href="../../../index.html#updates">ATUALIZAÇÕES</a><a href="../../../index.html#ferramentas">FERRAMENTAS</a>
</nav></div></header><main><article><a class="back" href="../../../index.html">← VOLTAR PARA O PORTAL</a><br><div class="category">\${category}</div><h1>\${title}</h1><p class="subtitle">\${description}</p>
<div class="info"><span>Publicado em \${formattedDate}</span><span class="dot">•</span><span>Por <strong>\${author}</strong></span></div>
\${cover}<div class="body">\${body}</div>\${sources}</article></main>
<footer><strong>DashWatch</strong><br>Notícias de Geometry Dash · \${dateParts[0]}</footer><button id="theme-toggle" aria-label="Alternar tema">🌙</button><script src="../../../news.js"></script></body></html>\`;
}

function validArticleInput(article: any): string | null {
  if (typeof article.titulo !== "string" || !article.titulo.trim() ||
      typeof article.descricao !== "string" || !article.descricao.trim() ||
      typeof article.categoria !== "string" || !article.categoria.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(article.data))) {
    return "Preencha título, descrição, categoria e data corretamente.";
  }
  if (article.imagem && !safeURL(article.imagem) && !/^\.\.\/\.\.\/\.\.\/assets\/[a-zA-Z0-9_./-]+$/.test(String(article.imagem))) return "A imagem precisa ter um endereço HTTPS válido ou apontar para a pasta assets.";
  return null;
}

function validArticlePath(value: unknown): string {
  const path = String(value ?? "");
  return /^notícias\/\d{4}\/\d{2}\/[a-z0-9-]+\.html$/.test(path) ? path : "";
}

Deno.serve(async (req: Request) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return jsonResponse({ erro: "Método não permitido." }, 405, headers);

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY || !GITHUB_TOKEN) throw new Error("Configuração de ambiente incompleta.");
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return jsonResponse({ erro: "Sessão não informada." }, 401, headers);

    const userResponse = await fetch(\`\${SUPABASE_URL}/auth/v1/user\`, {
      headers: { "Authorization": authorization, "apikey": SUPABASE_KEY },
    });
    if (!userResponse.ok) return jsonResponse({ erro: "Sessão inválida." }, 401, headers);
    const user = await userResponse.json();
    if (user.id !== USER_ID) return jsonResponse({ erro: "Você não tem permissão para administrar as notícias." }, 403, headers);

    const article = await req.json();
    const action = String(article.acao ?? "publicar");

    if (action === "listar") {
      const news = await readNews();
      return jsonResponse({ sucesso: true, noticias: news }, 200, headers);
    }

    if (action === "destaque") {
      const path = validArticlePath(article.url);
      const position = Number(article.destaque);
      if (!path || !Number.isInteger(position) || position < 0 || position > 3) {
        return jsonResponse({ erro: "Notícia ou posição de destaque inválida." }, 400, headers);
      }
      const news = await readNews();
      const target = news.find(item => item.url === path);
      if (!target) return jsonResponse({ erro: "Notícia não encontrada." }, 404, headers);
      if (position !== 0) news.forEach(item => { if (item.url !== path && Number(item.destaque) === position) delete item.destaque; });
      if (position === 0) delete target.destaque;
      else target.destaque = position;
      await writeNews(news, \`Atualiza destaque: \${target.titulo}\`);
      return jsonResponse({ sucesso: true, mensagem: "Destaques atualizados." }, 200, headers);
    }

    if (action === "editar") {
      const path = validArticlePath(article.url);
      if (!path) return jsonResponse({ erro: "Endereço da notícia inválido." }, 400, headers);
      const validationError = validArticleInput(article);
      if (validationError) return jsonResponse({ erro: validationError }, 400, headers);
      const news = await readNews();
      const entry = news.find(item => item.url === path);
      if (!entry) return jsonResponse({ erro: "Notícia não encontrada no catálogo." }, 404, headers);
      const existingArticle = await getGitHubFile(path);
      if (!existingArticle) return jsonResponse({ erro: "O arquivo HTML desta notícia não foi encontrado." }, 404, headers);

      const updatedEntry = {
        ...entry,
        titulo: article.titulo.trim(),
        descricao: article.descricao.trim(),
        categoria: article.categoria.trim(),
        autor: "yuridakbrada",
        data: article.data,
        hora: String(article.hora ?? ""),
        imagem: safeURL(article.imagem),
        tags: Array.isArray(article.tags) ? article.tags : [],
      };
      const html = buildArticle(article);
      await saveGitHubFile(path, html, \`Edita notícia: \${article.titulo}\`);
      Object.assign(entry, updatedEntry);
      await writeNews(news, \`Atualiza catálogo após edição: \${article.titulo}\`);
      return jsonResponse({ sucesso: true, mensagem: "Notícia atualizada com sucesso!", url: path }, 200, headers);
    }

    if (action !== "publicar") return jsonResponse({ erro: "Ação desconhecida." }, 400, headers);
    const validationError = validArticleInput(article);
    if (validationError) return jsonResponse({ erro: validationError }, 400, headers);

    const slug = slugify(article.titulo);
    if (!slug) return jsonResponse({ erro: "Não foi possível criar o endereço da notícia." }, 400, headers);
    const [year, month] = article.data.split("-");
    const articlePath = \`notícias/\${year}/\${month}/\${slug}.html\`;
    if (await getGitHubFile(articlePath)) return jsonResponse({ erro: "Já existe uma notícia com esse endereço. Altere o título." }, 409, headers);

    const news = await readNews();
    if (news.some(item => item.url === articlePath)) return jsonResponse({ erro: "Essa notícia já está cadastrada no noticias.json." }, 409, headers);
    const entry = {
      titulo: article.titulo.trim(), descricao: article.descricao.trim(), categoria: article.categoria.trim(),
      autor: "yuridakbrada", data: article.data, hora: String(article.hora ?? ""), url: articlePath,
      imagem: catalogImage(article.imagem), tags: Array.isArray(article.tags) ? article.tags : [],
    };
    await saveGitHubFile(articlePath, buildArticle(article), \`Publica notícia: \${article.titulo}\`);
    news.unshift(entry);
    await writeNews(news, \`Atualiza noticias.json: \${article.titulo}\`);
    return jsonResponse({ sucesso: true, mensagem: "Notícia publicada com sucesso!", url: articlePath }, 200, headers);
  } catch (error) {
    console.error(error);
    return jsonResponse({ erro: error instanceof Error ? error.message : "Erro interno ao administrar notícias." }, 500, headers);
  }
});
