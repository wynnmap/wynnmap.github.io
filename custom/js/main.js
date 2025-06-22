import { fetchTerritories } from './api.js';
import { generateTooltip, MAP_WIDTH } from './utils.js';
import { draw } from './draw.js';

const IMAGE_SRC = "../assets/map.png";

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");
const selectedList = document.getElementById("selected-territory-list");
const terrGuildListSelect = document.getElementById("territory-guild-list");
const guildListSelect = document.getElementById("guild-list");

let territories = [];
let guilds = {"None": {prefix: "None", name: "No one", color: "#ffffff"}};
let selectedTerritories = [];
let editingGuildPrefix = null;

const opt = document.createElement("option");
opt.value = "None";
opt.textContent = `No one [None]`;

terrGuildListSelect.appendChild(opt);
guildListSelect.appendChild(opt);

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
    updateUI();
    render();

    setInterval(() => {
        render();
    }, 500);
};

function render() {
    draw(ctx, canvas, image, territories, selectedTerritories, guilds, offsetX, offsetY, scale);
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

canvas.addEventListener("mousemove", (e) => {
    if (isDragging) {
        offsetX = e.clientX - dragStartX;
        offsetY = e.clientY - dragStartY;
        render();
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

    render();
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
        tooltip.innerHTML = generateTooltip(found, guilds)
        tooltip.style.display = "block";
    } else {
        tooltip.style.display = "none";
    }
}

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - offsetX) / scale;
    const mouseY = (e.clientY - rect.top - offsetY) / scale;

    let clicked = null;
    for (const t of territories) {
        const r = t.rect;
        if (
            mouseX >= r.x &&
            mouseX <= r.x + r.w &&
            mouseY >= r.y &&
            mouseY <= r.y + r.h
        ) {
            clicked = t;
            break;
        }
    }

    if (clicked) {
        if (selectedTerritories.includes(clicked)) {
            selectedTerritories = selectedTerritories.filter(t => t !== clicked);
        } else {
            selectedTerritories.push(clicked);
        }
        updateUI();
    }
    render();
});

// --- Guild UI Management ---

window.openGuildPopup = function () {
    document.getElementById("popup").classList.remove("hidden");
};

window.closeGuildPopup = function () {
    document.getElementById("popup").classList.add("hidden");
};

window.removeSelectedTerritories = function () {
    selectedTerritories = [];
    updateUI();
};


window.addGuild = function () {
    document.getElementById("popup-guild-name").value = "";
    document.getElementById("popup-guild-prefix").value = "";
    document.getElementById("popup-guild-color").value = "#ffffff";

    openGuildPopup();
};

window.editGuild = function () {
    const selectedPrefix = document.getElementById("guild-list").value;

    if (selectedPrefix === "None") {
        alert("Cannot edit that guild.");
        return;
    }

    if (!selectedPrefix || !guilds[selectedPrefix]) {
        alert("Please select a guild to edit.");
        return;
    }

    const g = guilds[selectedPrefix];
    editingGuildPrefix = selectedPrefix;

    document.getElementById("popup-guild-name").value = g.name;
    document.getElementById("popup-guild-prefix").value = g.prefix;
    document.getElementById("popup-guild-color").value = g.color;

    openGuildPopup();
};

window.submitGuildPopup = function () {
    const name = document.getElementById("popup-guild-name").value.trim();
    const prefix = document.getElementById("popup-guild-prefix").value.trim();
    const color = document.getElementById("popup-guild-color").value;

    if (!name || !prefix) return alert("Name and prefix are required.");

    const isEdit = editingGuildPrefix !== null;

    // If adding a new guild, check for duplicates
    if (!isEdit && guilds[prefix]) {
        return alert("Prefix already exists.");
    }

    // If editing and the prefix changed, we need to reassign
    if (isEdit && prefix !== editingGuildPrefix) {
        // Update territories using the old prefix to use the new one
        for (const t of territories) {
            if (t.guild === editingGuildPrefix) {
                t.guild = prefix;
            }
        }

        delete guilds[editingGuildPrefix]; // remove old entry
    }

    // Create or overwrite guild entry
    guilds[prefix] = { name, prefix, color };

    editingGuildPrefix = null;
    closeGuildPopup();
    updateUI()
    render();
};

// REMOVE GUILD
window.removeGuild = function () {
    const selectedPrefix = document.getElementById("guild-list").value;

    if (!selectedPrefix || !guilds[selectedPrefix] || selectedPrefix === "None") {
        alert("Cannot remove that guild.");
        return;
    }

    if (!confirm(`Are you sure you want to remove ${guilds[selectedPrefix].name} [${selectedPrefix}]?`)) {
        return;
    }

    delete guilds[selectedPrefix];

    // Reset all territories owned by this guild
    for (const t of territories) {
        if (t.guild === selectedPrefix) {
            t.guild = "None";
        }
    }

    updateUI();
    render();
};


// --- Assign selected territories to selected guild ---
terrGuildListSelect.addEventListener("change", () => {
    const selectedPrefix = terrGuildListSelect.value;
    if (!selectedPrefix || !guilds[selectedPrefix]) return;

    for (const territory of selectedTerritories) {
        territory.guild = selectedPrefix;
    }

    render(); // Re-render the canvas if needed
    updateUI(); // Update list in the UI
});

function updateUI() {
    // --- Refresh guild select dropdowns ---
    terrGuildListSelect.innerHTML = "";
    guildListSelect.innerHTML = "";

    for (const prefix in guilds) {
        const g = guilds[prefix];

        const opt1 = document.createElement("option");
        opt1.value = prefix;
        opt1.textContent = `${g.name} [${prefix}]`;
        terrGuildListSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = prefix;
        opt2.textContent = `${g.name} [${prefix}]`;
        guildListSelect.appendChild(opt2);
    }

    // --- Update selected territory list ---
    if (selectedTerritories.length === 0) {
        terrGuildListSelect.value = "";
        selectedList.innerHTML = "<i>No territories selected</i>";
        return;
    }

    // Show all selected territories
    selectedList.innerHTML = selectedTerritories
        .map(t => `<div>${t.name} <span style="color: ${guilds[t.guild].color};">[${t.guild}]</div>`)
        .join("");

    // Determine if all selected territories have the same guild
    const firstGuild = selectedTerritories[0].guild;
    const allSame = selectedTerritories.every(t => t.guild === firstGuild);
    terrGuildListSelect.value = allSame ? firstGuild : "";
}

