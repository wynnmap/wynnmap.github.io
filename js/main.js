import { fetchTerritories } from './api.js';
import { generateTooltip, MAP_WIDTH, MAP_HEIGHT } from './utils.js';
import { draw } from './draw.js';

const IMAGE_SRC = "assets/map.png";

const canvas = document.getElementById("map-canvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");

let territories = [];
let offsetX = 0;
let offsetY = 0;
let scale = 0.75;

offsetX = -(canvas.width - MAP_WIDTH) / 2;
offsetY = -canvas.height * 1.1;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

let image = new Image();
image.src = IMAGE_SRC;

image.onload = async () => {
    territories = await fetchTerritories();
    drawEverything();

    setInterval(async () => {
        territories = await fetchTerritories();
        drawEverything();
    }, 10000);

    setInterval(() => {
        drawEverything();
    }, 500);
};

function drawEverything() {
    draw(ctx, canvas, image, territories, offsetX, offsetY, scale);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawEverything();
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

canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
        offsetX = e.clientX - dragStartX;
        offsetY = e.clientY - dragStartY;
        drawEverything();
    } else {
        handleHover(e);
    }
});

canvas.addEventListener("wheel", (e) => {
    const zoomAmount = -e.deltaY * 0.001;
    const prevScale = scale;
    scale += zoomAmount;
    scale = Math.min(Math.max(0.3, scale), 5);

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    offsetX -= (mx - offsetX) * (scale / prevScale - 1);
    offsetY -= (my - offsetY) * (scale / prevScale - 1);

    drawEverything();
});

function handleHover(e) {
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
