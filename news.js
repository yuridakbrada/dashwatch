const themeToggle = document.getElementById("theme-toggle");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeToggle.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeToggle.textContent = "🌙";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.add("theme-ready");
        });
    });
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
