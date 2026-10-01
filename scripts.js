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

const breaking = document.querySelector(".breaking");
const track = document.querySelector(".breaking-track");
const item = document.querySelector(".breaking-item");

if (breaking && track && item && window.innerWidth > 700) {

    let x = breaking.offsetWidth;
    let lastTime = performance.now();

    function ticker(time) {
        const delta = time - lastTime;
        lastTime = time;

        x -= delta * 0.04;

        if (x < -item.offsetWidth) {
            x = breaking.offsetWidth;
        }

        track.style.transform = `translateX(${x}px`;

        requestAnimationFrame(ticker);
    }

    requestAnimationFrame(ticker);
}

document.getElementById("year").textContent = new Date().getFullYear();