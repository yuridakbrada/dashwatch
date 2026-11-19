const themeToggle = document.getElementById("theme-toggle");

/* =========================
   PESQUISA DE NOTÍCIAS
========================= */

let noticias = [];

const searchInput = document.getElementById("search-input");
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
        atualizarDestaques(noticias);

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



function atualizarDestaques(listaNoticias) {
    const area = document.getElementById("destaque");
    if (!area) return;
    const noticiasEscolhidas = [1, 2, 3, 4, 5, 6]
        .map(posicao => listaNoticias.find(n => Number(n.destaque) === posicao))
        .filter(Boolean);
    area.replaceChildren();
    const card = (n, principal) => {
        const el = document.createElement("article"); el.className = principal ? "hero-story" : "secondary-story";
        const imgLink = document.createElement("a"); imgLink.className = "story-image"; imgLink.href = n.url || "#";
        const img = document.createElement("img"); img.src = n.imagem || ""; img.alt = n.titulo || ""; img.loading = "lazy"; imgLink.appendChild(img);
        const content = document.createElement("div"); content.className = "story-content";
        const category = document.createElement("span"); category.className = "category"; category.textContent = (n.categoria || "GERAL").toUpperCase();
        const heading = document.createElement(principal ? "h2" : "h3");
        const title = document.createElement("a"); title.href = n.url || "#"; title.textContent = n.titulo || "Sem título"; heading.appendChild(title);
        const desc = document.createElement("p"); desc.textContent = n.descricao || "";
        const meta = document.createElement("div"); meta.className = "story-meta"; meta.textContent = n.data ? formatarData(n.data) : "";
        content.append(category, heading, desc, meta); el.append(imgLink, content); return el;
    };
    if (noticiasEscolhidas[0]) area.appendChild(card(noticiasEscolhidas[0], true));
    if (noticiasEscolhidas.length > 1) {
        const secondary = document.createElement("div"); secondary.className = "secondary-stories";
        noticiasEscolhidas.slice(1,6).forEach(n => secondary.appendChild(card(n, false)));
        area.appendChild(secondary);
    }
}


/* Pesquisa pela barra permanente */

function pesquisarPorCategoria(categoria) {
    searchInput.value = categoria;
    renderizarResultados(noticias.filter(noticia =>
        normalizar(noticia.categoria || "").includes(normalizar(categoria))
    ));
    searchInput.focus();
}

searchInput.addEventListener("input", () => {
    const termo = normalizar(searchInput.value);
    if (!termo) {
        searchResults.innerHTML = "";
        searchResults.classList.remove("active");
        return;
    }

    const resultados = noticias.filter(noticia => {
        const tags = Array.isArray(noticia.tags) ? noticia.tags.join(" ") : "";
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

document.addEventListener("click", evento => {
    if (!evento.target.closest(".search-control")) {
        searchResults.classList.remove("active");
    }
});

searchInput.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
        searchResults.classList.remove("active");
        searchInput.blur();
    }
});

document.querySelectorAll("[data-categoria]").forEach(link => {
    link.addEventListener("click", evento => {
        evento.preventDefault();
        pesquisarPorCategoria(link.dataset.categoria);
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
        .slice(0, 3);

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
        themeToggle.innerHTML = '<img class="header-svg-icon theme-svg-icon" src="' + (isDark ? "assets/sol.svg" : "assets/lua.svg") + '" alt="" aria-hidden="true">';
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

const dropdowns = document.querySelectorAll(".dropdown");

dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector(".dropdown-button");
    const menu = dropdown.querySelector(".dropdown-menu");

    button.addEventListener("click", (event) => {
        event.stopPropagation();

        const isOpen = button.getAttribute("aria-expanded") === "true";

        // Fecha todos os dropdowns
        dropdowns.forEach(item => {
            item.querySelector(".dropdown-button")
                .setAttribute("aria-expanded", "false");

            item.querySelector(".dropdown-menu").hidden = true;
        });

        // Abre o menu clicado, se estava fechado
        if (!isOpen) {
            button.setAttribute("aria-expanded", "true");
            menu.hidden = false;
        }
    });
});

// Fecha ao clicar fora
document.addEventListener("click", () => {
    dropdowns.forEach(dropdown => {
        dropdown.querySelector(".dropdown-button")
            .setAttribute("aria-expanded", "false");

        dropdown.querySelector(".dropdown-menu").hidden = true;
    });
});

// Fecha com ESC
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        dropdowns.forEach(dropdown => {
            dropdown.querySelector(".dropdown-button")
                .setAttribute("aria-expanded", "false");

            dropdown.querySelector(".dropdown-menu").hidden = true;
        });
    }
});

// =========================================
// TUTORIAL DE TRADUÇÃO DO NAVEGADOR
// =========================================
(function iniciarAjudaDeTraducao() {
    const idioma = (navigator.language || navigator.userLanguage || "pt-BR").toLowerCase();
    const jaDispensou = localStorage.getItem("dashwatch-translation-dismissed") === "1";

    // O portal já está em português: não há motivo para exibir o aviso.
    if (idioma.startsWith("pt") || jaDispensou) return;

    let nomeIdioma = idioma;
    try {
        nomeIdioma = new Intl.DisplayNames(["pt-BR"], { type: "language" }).of(idioma) || idioma;
    } catch (_) {}

    const aviso = document.createElement("section");
    aviso.className = "dw-translate-prompt";
    aviso.setAttribute("aria-label", "Ajuda para traduzir o DashWatch");
    aviso.innerHTML = `
        <h2>🌐 Percebemos o seu idioma!</h2>
        <p>Seu navegador está configurado em <strong>${nomeIdioma}</strong>. Deseja aprender a traduzir automaticamente o DashWatch?</p>
        <div class="dw-translate-actions">
            <button class="dw-primary" type="button" data-translate-start>Ativar tradução</button>
            <button type="button" data-translate-dismiss>Continuar em português</button>
        </div>
    `;
    document.body.appendChild(aviso);

    const fecharAviso = () => aviso.remove();

    aviso.querySelector("[data-translate-dismiss]").addEventListener("click", () => {
        localStorage.setItem("dashwatch-translation-dismissed", "1");
        fecharAviso();
    });

    aviso.querySelector("[data-translate-start]").addEventListener("click", () => {
        fecharAviso();
        abrirSelecaoDeNavegador();
    });

    function abrirSelecaoDeNavegador() {
        const overlay = document.createElement("div");
        overlay.className = "dw-translate-overlay";
        overlay.innerHTML = `
            <section class="dw-translate-dialog" role="dialog" aria-modal="true" aria-labelledby="dw-translate-title">
                <div class="dw-translate-kicker">DashWatch · Tradução</div>
                <h2 id="dw-translate-title">Qual navegador você utiliza?</h2>
                <p>Escolha seu navegador para ver as instruções de tradução automática.</p>
                <div class="dw-browser-choices">
                    <button class="dw-browser-choice" type="button" data-browser="chromium">Chromium</button>
                    <button class="dw-browser-choice" type="button" data-browser="edge">Edge</button>
                    <button class="dw-browser-choice" type="button" data-browser="firefox">Firefox</button>
                </div>
                <div class="dw-translate-actions">
                    <button type="button" data-translate-close>Fechar</button>
                </div>
            </section>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector("[data-translate-close]").addEventListener("click", () => overlay.remove());
        overlay.addEventListener("click", event => {
            if (event.target === overlay) overlay.remove();
        });

        overlay.querySelectorAll("[data-browser]").forEach(button => {
            button.addEventListener("click", () => mostrarTutorial(overlay, button.dataset.browser));
        });
    }

    function mostrarTutorial(overlay, navegador) {
        const tutoriais = {
            chromium: {
                nome: "Chromium (Chrome e similares)",
                passos: [
                    "Abra o menu de três pontos do navegador.",
                    "Selecione “Traduzir…” ou “Traduzir para português”. Em alguns navegadores, a opção também aparece ao clicar com o botão direito na página.",
                    "Escolha português como idioma de destino.",
                    "Se aparecer a opção, marque para sempre traduzir páginas em " + nomeIdioma + "."
                ],
                nota: "A disponibilidade e o nome da opção variam entre Chrome, Chromium, Brave e outros navegadores baseados em Chromium."
            },
            edge: {
                nome: "Microsoft Edge",
                passos: [
                    "Procure o ícone de tradução na barra de endereços quando a página estiver aberta.",
                    "Clique nele e escolha português como idioma de destino.",
                    "Se desejar, abra as opções de tradução e escolha traduzir sempre páginas neste idioma."
                ],
                nota: "Se o ícone não aparecer, abra Configurações → Idiomas e ative a oferta de tradução de páginas que não estejam em um idioma que você lê."
            },
            firefox: {
                nome: "Mozilla Firefox",
                passos: [
                    "Clique no ícone de tradução na barra de endereços, quando ele aparecer.",
                    "Escolha o idioma de origem e português como idioma de destino.",
                    "Clique em “Traduzir” para exibir a página no idioma escolhido."
                ],
                nota: "O tradutor integrado depende da versão do Firefox e dos idiomas disponíveis. Se o ícone não aparecer, atualize o navegador e confira se a tradução de páginas está disponível."
            }
        };

        const tutorial = tutoriais[navegador];
        if (!tutorial) return;

        const passos = tutorial.passos.map(passo => "<li>" + passo + "</li>").join("");
        overlay.querySelector(".dw-translate-dialog").innerHTML = `
            <div class="dw-translate-kicker">DashWatch · Tradução</div>
            <h2>${tutorial.nome}</h2>
            <ol class="dw-translate-steps">${passos}</ol>
            <div class="dw-translate-note">${tutorial.nota}</div>
            <div class="dw-translate-actions">
                <button type="button" data-translate-back>Voltar</button>
                <button class="dw-primary" type="button" data-translate-done>Entendi</button>
            </div>
        `;

        overlay.querySelector("[data-translate-back]").addEventListener("click", () => {
            overlay.remove();
            abrirSelecaoDeNavegador();
        });
        overlay.querySelector("[data-translate-done]").addEventListener("click", () => {
            localStorage.setItem("dashwatch-translation-dismissed", "1");
            overlay.remove();
        });
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".dw-translate-overlay").forEach(element => element.remove());
        }
    });
})();
