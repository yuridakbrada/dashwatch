const themeToggle = document.getElementById("theme-toggle");

/* =========================
   PESQUISA DE NOTÍCIAS
========================= */

let noticias = [];

const searchToggle = document.getElementById("search-toggle");
const searchPanel = document.getElementById("search-panel");
const searchInput = document.getElementById("search-input");
const searchClose = document.getElementById("search-close");
const searchResults = document.getElementById("search-results");


/* Normaliza texto para permitir pesquisas
   sem acentos */

function normalizar(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}


/* Carrega o catálogo inteiro */


async function carregarNoticias() {
    try {
        const resposta = await fetch("noticias.json");

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        noticias = await resposta.json();

        atualizarUltimos(noticias);
        atualizarUltimasNoticias(noticias);

        console.log(`${noticias.length} notícias carregadas.`);
    } catch (erro) {
        console.error("Erro ao carregar noticias.json:", erro);
        noticias = [];
    }
}

/* Atualiza os cartões de "Últimas notícias" */
function atualizarUltimasNoticias(listaNoticias) {
    const lista = document.getElementById("news-list");

    if (!lista) return;

    const recentes = [...listaNoticias]
        .sort((a, b) => {
            const dataA = `${a.data || ""} ${a.hora || ""}`;
            const dataB = `${b.data || ""} ${b.hora || ""}`;
            return dataB.localeCompare(dataA);
        })
        .slice(0, 10);

    lista.replaceChildren();

    recentes.forEach((noticia) => {
        const artigo = document.createElement("article");
        artigo.className = "news-row";

        const linkImagem = document.createElement("a");
        linkImagem.className = "news-thumb";
        linkImagem.href = noticia.url;

        const imagem = document.createElement("img");
        imagem.src = noticia.imagem || "";
        imagem.alt = noticia.titulo || "Notícia";
        imagem.loading = "lazy";

        linkImagem.appendChild(imagem);
        artigo.appendChild(linkImagem);

        const conteudo = document.createElement("div");
        conteudo.className = "news-row-content";

        const categoria = document.createElement("span");
        categoria.className = "category";
        categoria.textContent = noticia.categoria || "GERAL";
        conteudo.appendChild(categoria);

        const titulo = document.createElement("h3");
        const linkTitulo = document.createElement("a");

        linkTitulo.href = noticia.url;
        linkTitulo.textContent = noticia.titulo || "Sem título";

        titulo.appendChild(linkTitulo);
        conteudo.appendChild(titulo);

        const descricao = document.createElement("p");
        descricao.textContent = noticia.descricao || "";
        conteudo.appendChild(descricao);

        const data = document.createElement("time");

        if (noticia.data) {
            data.dateTime = noticia.data;

            const [ano, mes, dia] = noticia.data.split("-").map(Number);
            const dataLocal = new Date(ano, mes - 1, dia);

            data.textContent =
                new Intl.DateTimeFormat("pt-BR", {
                    day: "numeric",
                    month: "long"
                }).format(dataLocal) + ` · ${ano}`;
        }

        conteudo.appendChild(data);
        artigo.appendChild(conteudo);
        lista.appendChild(artigo);
    });
}


/* Abre e fecha a pesquisa */

function fecharPesquisa() {
    searchPanel.classList.remove("active");
    searchToggle.classList.remove("hidden");

    searchInput.value = "";
    searchResults.innerHTML = "";
    searchResults.classList.remove("active");
}

searchToggle.addEventListener("click", () => {
    searchPanel.classList.add("active");
    searchToggle.classList.add("hidden");

    searchInput.focus();
});

/* Fecha a pesquisa */

searchClose.addEventListener("click", fecharPesquisa);



/* Fecha a pesquisa */


function fecharPesquisa() {
    searchPanel.classList.remove("active");
    searchToggle.classList.remove("hidden");

    searchInput.value = "";
    searchResults.innerHTML = "";
    searchResults.classList.remove("active");
}

searchToggle.addEventListener("click", () => {
    searchPanel.classList.add("active");
    searchToggle.classList.add("hidden");
    searchInput.focus();
});

searchClose.addEventListener("click", fecharPesquisa);



/* Pesquisa */

searchInput.addEventListener("input", () => {

    const termo = normalizar(searchInput.value);

    if (!termo) {

        searchResults.innerHTML = "";

        searchResults.classList.remove("active");

        return;
    }


    const resultados = noticias.filter(noticia => {

        const tags = Array.isArray(noticia.tags)
            ? noticia.tags.join(" ")
            : "";

        const texto = normalizar(`
            ${noticia.titulo}
            ${noticia.descricao}
            ${noticia.categoria}
            ${noticia.autor}
            ${tags}
        `);

        return texto.includes(termo);

    });


    renderizarResultados(resultados);

    
function pesquisarPorCategoria(categoria) {
    searchPanel.classList.add("active");
    searchToggle.classList.add("hidden");

    searchInput.value = categoria;
    searchInput.focus();

    const termo = normalizar(categoria);

    const resultados = noticias.filter(noticia =>
        normalizar(noticia.categoria || "").includes(termo)
    );

    renderizarResultados(resultados);
}


});


document.querySelectorAll("[data-categoria]").forEach(link => {
    link.addEventListener("click", evento => {
        evento.preventDefault();

        pesquisarPorCategoria(link.dataset.categoria);
    });
});


document.querySelectorAll(".main-nav [data-categoria]").forEach(link => {
    link.addEventListener("click", evento => {
        evento.preventDefault();

        searchPanel.classList.add("active");
        searchToggle.classList.add("hidden");
        searchInput.value = link.dataset.categoria;

        const termo = normalizar(link.dataset.categoria);

        const resultados = noticias.filter(noticia =>
            normalizar(noticia.categoria || "").includes(termo)
        );

        renderizarResultados(resultados);
    });
});




/* Mostra os resultados */

function renderizarResultados(resultados) {

    searchResults.classList.add("active");


    if (resultados.length === 0) {

        searchResults.innerHTML = `
            <div class="search-empty">
                Nenhuma notícia encontrada.
            </div>
        `;

        return;
    }


    searchResults.innerHTML = resultados.map(noticia => {

        const imagem = noticia.imagem
            ? `<img src="${noticia.imagem}" alt="">`
            : `<div></div>`;


        return `
            <article class="search-result">

                <a
                    class="search-result-link"
                    href="${noticia.url}"
                >

                    ${imagem}

                    <div class="search-result-content">

                        <div class="search-result-category">
                            ${noticia.categoria}
                        </div>

                        <h3>
                            ${noticia.titulo}
                        </h3>

                        <div class="search-result-date">
                            ${formatarData(noticia.data)}
                        </div>

                    </div>

                </a>

            </article>
        `;

    }).join("");

}


/* Formata a data */

function formatarData(data) {

    if (!data) {
        return "";
    }

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}


/* Carrega o JSON */

carregarNoticias();


/* Atualiza o ticker "ÚLTIMAS" com as 3 notícias mais recentes */
function atualizarUltimos(listaNoticias) {
    const faixa = document.getElementById("breaking-track");

    if (!faixa) return;

    const recentes = [...listaNoticias]
        .sort((a, b) => {
            const dataA = `${a.data || ""} ${a.hora || ""}`;
            const dataB = `${b.data || ""} ${b.hora || ""}`;

            return dataB.localeCompare(dataA);
        })
        .slice(0, 3);

    faixa.replaceChildren();

    recentes.forEach((noticia) => {
        const link = document.createElement("a");

        link.href = noticia.url;
        link.textContent = noticia.titulo || "Sem título";
        link.className = "breaking-item";

        faixa.appendChild(link);
    });
}


/* Atualiza a faixa "Últimos" com as 3 notícias mais recentes */
function atualizarUltimos(listaNoticias) {
    const faixa = document.getElementById("breaking-track");

    if (!faixa) return;

    // Ordena as notícias da mais recente para a mais antiga
    const recentes = [...listaNoticias]
.sort((a, b) => {
    const dataA = `${a.data || ""} ${a.hora || ""}`;
    const dataB = `${b.data || ""} ${b.hora || ""}`;

    return dataB.localeCompare(dataA);
})

    // Limpa os links anteriores
    faixa.replaceChildren();

    // Cria os links automaticamente
    recentes.forEach((noticia, indice) => {
        if (indice > 0) {
            const separador = document.createElement("span");
            separador.textContent = "•";
            faixa.appendChild(separador);
        }

        const link = document.createElement("a");
        link.href = noticia.url;
        link.textContent = noticia.titulo;

        faixa.appendChild(link);
    });
}

// =========================================
// TEMA
// =========================================

function applyTheme(theme) {

    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️" : "🌙";
        themeToggle.setAttribute(
            "aria-label",
            isDark
                ? "Ativar tema claro"
                : "Ativar tema escuro"
        );
    }
}


const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    applyTheme("dark");
} else {
    applyTheme("light");
}


if (themeToggle) {

    themeToggle.addEventListener("click", () => {

        const darkMode =
            document.body.classList.contains("dark-mode");

        const newTheme =
            darkMode ? "light" : "dark";

        localStorage.setItem("theme", newTheme);

        applyTheme(newTheme);

    });

}

// =========================================
// TEMA — TRANSIÇÃO APÓS CARREGAMENTO
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    requestAnimationFrame(() => {

        document.body.classList.add("theme-ready");

    });

});


// =========================================
// ÚLTIMAS NOTÍCIAS
// =========================================

const breakingWindow =
    document.querySelector(".breaking-window");

const breakingTrack =
    document.querySelector(".breaking-track");


function startBreakingTicker() {

    if (!breakingWindow || !breakingTrack) {
        return;
    }

    if (window.innerWidth <= 650) {
        breakingTrack.style.transform = "none";
        return;
    }

    let position = breakingWindow.offsetWidth;

    let lastTime = performance.now();


    function animate(time) {

        // Se a janela ficar pequena durante a execução,
        // interrompe a animação.
        if (window.innerWidth <= 650) {

            breakingTrack.style.transform = "none";

            return;

        }


        const delta =
            time - lastTime;

        lastTime = time;


        position -= delta * 0.04;


        if (position < -breakingTrack.offsetWidth) {

            position =
                breakingWindow.offsetWidth;

        }


        breakingTrack.style.transform =
            `translateX(${position}px)`;


        requestAnimationFrame(animate);

    }


    requestAnimationFrame(animate);

}


startBreakingTicker();


// =========================================
// ANO DO FOOTER
// =========================================

const year =
    document.getElementById("year");

if (year) {

    year.textContent =
        new Date().getFullYear();

}


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        console.log("DashWatch: Service Worker registrado!");
      })
      .catch((error) => {
        console.error("Erro ao registrar Service Worker:", error);
      });
  });
}
