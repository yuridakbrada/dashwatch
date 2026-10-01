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

        console.log(`${noticias.length} notícias carregadas.`);
    } catch (erro) {
        console.error("Erro ao carregar noticias.json:", erro);

        noticias = [];
    }
}


/* Abre a pesquisa */

searchToggle.addEventListener("click", () => {

    searchPanel.classList.toggle("active");

    if (searchPanel.classList.contains("active")) {
        searchInput.focus();
    } else {
        searchInput.value = "";
        searchResults.innerHTML = "";
        searchResults.classList.remove("active");
    }

});


/* Fecha a pesquisa */

searchClose.addEventListener("click", () => {

    searchPanel.classList.remove("active");

    searchInput.value = "";

    searchResults.innerHTML = "";

    searchResults.classList.remove("active");

});


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
// RESIZE
// =========================================

let resizeTimer;

window.addEventListener("resize", () => {

    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {

        location.reload();

    }, 250);

});


// =========================================
// ANO DO FOOTER
// =========================================

const year =
    document.getElementById("year");

if (year) {

    year.textContent =
        new Date().getFullYear();

}