const API_URL = "https://athena.wynntils.com/cache/get/territoryList";
const IMAGE_SRC = "assets/map.png";
const MAP_WIDTH = 1009;
const MAP_HEIGHT = 1604;

const canvas = document.getElementById("map-canvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");

let image = new Image();
let territories = [];

let offsetX = 0;
let offsetY = 0;
let scale = 0.75;

const SHOW_TIME_THRESHOLD = 2.3;
const SHOW_NAME_THRESHOLD = 1.0;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

image.onload = () => {
    fetchTerritories();
    setInterval(fetchTerritories, 10000); // auto-refresh every 10s
};
image.src = IMAGE_SRC;

// coordinate converter (from your formula)
function toCanvasCoords(x_ingame, z_ingame) {
    const x_canvas = (x_ingame + 2382) * MAP_WIDTH / 4034;
    const y_canvas = (z_ingame + 6572) * MAP_HEIGHT / 6414;
    return { x: x_canvas, y: y_canvas };
}

async function fetchTerritories() {
    const res = await axios.get(API_URL);
    const data = res.data.territories;
    territories = [];

    for (const name in data) {
        const t = data[name];
        const loc = t.location;

        const topLeft = toCanvasCoords(loc.startX, loc.startZ);
        const bottomRight = toCanvasCoords(loc.endX, loc.endZ);

        territories.push({
            name: t.territory,
            guild: t.guild,
            guildPrefix: t.guildPrefix,
            acquired: t.acquired,
            acquiredDate: new Date(t.acquired),
            color: t.guildColor,
            rect: {
                x: Math.min(topLeft.x, bottomRight.x),
                y: Math.min(topLeft.y, bottomRight.y),
                w: Math.abs(bottomRight.x - topLeft.x),
                h: Math.abs(bottomRight.y - topLeft.y),
            }
        });
    }
    draw();
}

// draw entire map
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw rectangles (always drawn)
    for (const t of territories) {
        ctx.fillStyle = hexToRgba(t.color, 0.4);
        ctx.fillRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(t.rect.x, t.rect.y, t.rect.w, t.rect.h);
    }

    // Draw labels and timers based on zoom level
    for (const t of territories) {
        const centerX = t.rect.x + t.rect.w / 2;
        const centerY = t.rect.y + t.rect.h / 2;
        const screenX = offsetX + centerX * scale;
        const screenY = offsetY + centerY * scale;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (scale > SHOW_NAME_THRESHOLD) {
            ctx.font = "16px Minecraft, monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(t.guildPrefix, screenX, screenY - 10);
        }

        if (scale > SHOW_TIME_THRESHOLD) {
            const heldFor = getTimeDiffString(t.acquiredDate);
            ctx.font = "12px Minecraft, monospace";
            ctx.fillStyle = "#aaaaaa";
            ctx.fillText(heldFor, screenX, screenY + 10);
        }
    }

    ctx.restore();
}



// convert color
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function getTimeDiffString(date) {
    const now = new Date();
    let diff = Math.floor((now - date) / 1000);
    const days = Math.floor(diff / 86400);
    diff %= 86400;
    const hours = Math.floor(diff / 3600);
    diff %= 3600;
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 ) parts.push(`${hours}h`);
    if (mins > 0 ) parts.push(`${mins}m`);
    if (secs > 0 ) parts.push(`${secs}s`);

    return parts.join(" ");
}



// keep refreshing text timers
setInterval(() => {
    draw();
}, 1000);

// canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}

// panning logic
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
        draw();
    } else {
        handleHover(e);
    }
});

// zoom logic
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

    draw();
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
        tooltip.innerHTML = `
            <b>${found.name}</b><br>
            Guild: ${found.guild} [${found.guildPrefix}]<br>
            Since: ${new Date(found.acquired).toLocaleString()}
        `;
        tooltip.style.display = "block";
    } else {
        tooltip.style.display = "none";
    }
}
