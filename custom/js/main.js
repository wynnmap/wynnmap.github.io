import { fetchTerritories } from './api.js';
import { generateTooltip, MAP_WIDTH, MAP_HEIGHT, easeInOutQuad } from './utils.js';
import { draw } from './draw.js';

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

const defaultScale = 0.75;

let offsetX = 0;
let offsetY = 0;
let scale = defaultScale;

offsetX = (window.innerWidth - (MAP_WIDTH * scale)) / 2;
offsetY = (window.innerHeight - (MAP_HEIGHT * scale)) / 2;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

const params = new URLSearchParams(window.location.search);
const encodedData = params.get("data");

let image = new Image();
image.src = "../assets/map.png";

let crownImage = new Image();
crownImage.src = "../assets/HQ.png";

image.onload = async () => {
    ctx.imageSmoothingEnabled = false;
    territories = await fetchTerritories();

    if (encodedData) {
        try {
            const json = LZString.decompressFromEncodedURIComponent(encodedData);
            const decoded = JSON.parse(json);

            guilds = decoded.guilds || {};

            for (const t of territories) {
                if (decoded.territories && decoded.territories[t.name]) {
                    t.guild = decoded.territories[t.name];
                }
            }
        } catch (e) {
            console.error("Failed to parse URL data", e);
        }
    }

    updateUI();
    
    let alpha = 0;
    const duration = 600; // in ms
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); 
        alpha = progress;

        render(alpha);

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);

    setInterval(() => {
        render();
    }, 500);
};

function render(globalAlpha = 1) {
    draw(ctx, canvas, image, crownImage, territories, selectedTerritories, guilds, offsetX, offsetY, scale, globalAlpha);
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
    const isSidebarHovered = document.querySelector(".sidebar:hover");
    const isPopupOpen = !document.querySelector(".popup")?.classList.contains("hidden");

    if (isSidebarHovered || isPopupOpen) {
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
        if (guilds[territory.guild].hq == territory.name) { guilds[territory.guild].hq = ""; }
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



window.exportMap = function () {
    const data = {
        territories: {},
        guilds
    };

    for (const t of territories) {
        data.territories[t.name] = t.guild;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "territory_data.json";
    a.click();

    URL.revokeObjectURL(url);
};

window.handleImportMap = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            guilds = data.guilds || {};

            // Apply ownership to existing territories
            const ownership = data.territories || {};
            for (const t of territories) {
                if (ownership[t.name]) {
                    t.guild = ownership[t.name];
                } else {
                    t.guild = "None";
                }
            }

            updateUI();
            render();
        } catch (err) {
            alert("Failed to load map data.");
            console.error(err);
        }
    };
    reader.readAsText(file);
};

window.copyMapURL = function () {
    const data = {
        territories: {},
        guilds
    };

    for (const t of territories) {
        data.territories[t.name] = t.guild;
    }

    const encoded = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(encoded);
    const url = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
    navigator.clipboard.writeText(url);
    alert("Map URL copied to clipboard.");
};

window.importFromAPI = async function () {
    [territories, guilds] = await fetchTerritories(true);

    updateUI();
    render();
    
};

window.resetMap = async function () {
    territories = []
    selectedTerritories = []

    territories = await fetchTerritories();
    updateUI();
    render();
};

window.resetAll = async function () {
    guilds = {"None": {prefix: "None", name: "No one", color: "#ffffff"}};

    resetMap();
};

window.setHQ = async function () {
    if (!(selectedTerritories.length === 1)) {
        alert("Select one territory to mark as HQ.");
        return;
    }
    const hqTerritory = selectedTerritories[0];
    guilds[hqTerritory.guild].hq = hqTerritory.name;

    selectedTerritories = [];
    updateUI();
    render();
};

window.backToHub = function () {
    document.getElementById('sidebar').classList.add('exit');
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


