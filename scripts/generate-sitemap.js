// Mantém o sitemap sincronizado com as URLs canônicas geradas pelo workflow.
const fs = require("node:fs");

const SITE = "https://dashwatch.news/";
const news = JSON.parse(fs.readFileSync("noticias.json", "utf8"));

if (!Array.isArray(news)) {
  throw new Error("noticias.json precisa conter uma lista de notícias.");
}

const seen = new Set();
const xmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const latestDate = news
  .map((item) => item.data)
  .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date || ""))
  .sort()
  .at(-1);

const entries = [];

entries.push([
  "  <url>",
  `    <loc>${SITE}</loc>`,
  ...(latestDate ? [`    <lastmod>${latestDate}</lastmod>`] : []),
  "  </url>",
].join("\n"));

for (const item of news) {
  if (typeof item.url !== "string" || !item.url.startsWith("notícias/")) {
    throw new Error(`URL inválida no catálogo: ${item.url}`);
  }

  const url = new URL(item.url, SITE).href;
  if (seen.has(url)) {
    throw new Error(`URL duplicada no catálogo: ${url}`);
  }
  seen.add(url);

  const lines = ["  <url>", `    <loc>${xmlEscape(url)}</loc>`];

  if (/^\d{4}-\d{2}-\d{2}$/.test(item.data || "")) {
    lines.push(`    <lastmod>${item.data}</lastmod>`);
  }

  if (item.imagem) {
    try {
      const imageUrl = new URL(item.imagem, SITE);
      if (imageUrl.protocol === "https:") {
        lines.push(
          "    <image:image>",
          `      <image:loc>${xmlEscape(imageUrl.href)}</image:loc>`,
          "    </image:image>",
        );
      }
    } catch {
      console.warn(`Imagem ignorada por URL inválida: ${item.imagem}`);
    }
  }

  lines.push("  </url>");
  entries.push(lines.join("\n"));
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...entries,
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync("sitemap.xml", sitemap, "utf8");
console.log(`sitemap.xml atualizado: página inicial + ${news.length} notícias.`);
