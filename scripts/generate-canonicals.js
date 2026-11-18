const fs = require("node:fs");
const path = require("node:path");

const SITE = "https://dashwatch.news/";
const catalog = JSON.parse(fs.readFileSync("noticias.json", "utf8"));

if (!Array.isArray(catalog)) {
  throw new Error("noticias.json precisa conter uma lista de notícias.");
}

function setCanonical(filePath, canonicalUrl) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo de notícia não encontrado: ${filePath}`);
  }

  let html = fs.readFileSync(filePath, "utf8");
  const tag = `<link rel="canonical" href="${canonicalUrl}">`;

  if (/<link\s+rel=["\']canonical["\'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["\']canonical["\'][^>]*>/i, tag);
  } else if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (head) => `${head}\n    ${tag}`);
  } else {
    throw new Error(`Não foi possível localizar a tag <head> em ${filePath}`);
  }

  fs.writeFileSync(filePath, html, "utf8");
}

setCanonical("index.html", SITE);

const seen = new Set();
for (const item of catalog) {
  if (typeof item.url !== "string" || !item.url.startsWith("notícias/")) {
    throw new Error(`URL inválida no catálogo: ${item.url}`);
  }

  const canonicalUrl = new URL(item.url, SITE).href;
  if (seen.has(canonicalUrl)) {
    throw new Error(`URL canônica duplicada: ${canonicalUrl}`);
  }
  seen.add(canonicalUrl);

  const localPath = path.join(process.cwd(), decodeURIComponent(new URL(canonicalUrl).pathname));
  setCanonical(localPath, canonicalUrl);
}

console.log(`Canonicals atualizadas: página inicial + ${catalog.length} notícias.`);
