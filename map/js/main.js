import { fetchTerritories } from './api.js';
import { generateTooltip, MAP_WIDTH, MAP_HEIGHT, easeInOutQuad } from './utils.js';
import { draw } from './draw.js';

const IMAGE_SRC = "../assets/map.png";

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");

const defaultScale = 0.75;

let territories = [];
let offsetX = 0;
let offsetY = 0;
let scale = defaultScale;

offsetX = (window.innerWidth - (MAP_WIDTH * scale)) / 2;
offsetY = (window.innerHeight - (MAP_HEIGHT * scale)) / 2;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

let image = new Image();
image.src = IMAGE_SRC;

image.onload = async () => {
    ctx.imageSmoothingEnabled = false;
    territories = await fetchTerritories();
    render();

    setInterval(async () => {
        territories = await fetchTerritories();
        render();
    }, 10000);

    setInterval(() => {
        render();
    }, 500);
};

function render(globalAlpha = 1) {
    draw(ctx, canvas, image, territories, offsetX, offsetY, scale, globalAlpha);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragStartX = e.clientX - offsetX;
    dragStartY = e.clientY - offsetY;
    canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mouseup", () => {
    isDragging = false;
    canvas.style.cursor = "grab";
});

canvas.addEventListener("mouseleave", () => {
    isDragging = false;
    canvas.style.cursor = "grab";
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        offsetX = e.clientX - dragStartX;
        offsetY = e.clientY - dragStartY;
        tooltip.style.left = e.clientX + 10 + "px";
        tooltip.style.top = e.clientY + 10 + "px";
        render();
    } else {
        handleHover(e);
    }
});

canvas.addEventListener("wheel", (e) => {
    const zoomAmount = -e.deltaY * 0.001;
    const prevScale = scale;
    scale += zoomAmount;
    scale = Math.min(Math.max(0.4, scale), 5);

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    offsetX -= (mx - offsetX) * (scale / prevScale - 1);
    offsetY -= (my - offsetY) * (scale / prevScale - 1);

    render();
});

function handleHover(e) {
    if (document.querySelector(".map-controls:hover")) {
        tooltip.style.display = "none";
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offsetX) / scale;
    const mouseY = (e.clientY - rect.top - offsetY) / scale;

    let found = null;
    for (const t of territories) {
        const r = t.rect;
        if (mouseX >= r.x && mouseX <= r.x + r.w && mouseY >= r.y && mouseY <= r.y + r.h) {
            found = t;
            break;
        }
    }

    if (found) {
        tooltip.style.left = e.clientX + 10 + "px";
        tooltip.style.top = e.clientY + 10 + "px";
        tooltip.innerHTML = generateTooltip(found)
        tooltip.style.display = "block";
    } else {
        tooltip.style.display = "none";
    }
}

window.backToHub = function () {
    document.getElementById('map-controls').classList.add('exit');
    const duration = 600; // milliseconds

    // Start values
    const startX = offsetX;
    const startY = offsetY;
    const startScale = scale;
    const deltaScale = defaultScale - startScale;

    // Recalculate centered position after scaling
    const targetOffsetX = (window.innerWidth - (MAP_WIDTH * defaultScale)) / 2;
    const targetOffsetY = (window.innerHeight - (MAP_HEIGHT * defaultScale)) / 2;

    const deltaX = targetOffsetX - startX;
    const deltaY = targetOffsetY - startY;

    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1); // Clamp between 0 and 1
        const eased = easeInOutQuad(progress);

        // Interpolate scale and position
        scale = startScale + deltaScale * eased;
        offsetX = startX + deltaX * eased;
        offsetY = startY + deltaY * eased;

        render(1-eased);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            // Snap to final values
            scale = defaultScale;
            offsetX = targetOffsetX;
            offsetY = targetOffsetY;
            render(1-eased);

            sessionStorage.setItem('returningToHub', 'true');
            window.location.href = '/';
        }
    }

    requestAnimationFrame(step);
};
