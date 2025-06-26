import { fetchGuilds, fetchTerritories } from './api.js';
import { generateTooltip, MAP_WIDTH, MAP_HEIGHT, easeInOutQuad, updateTerritory, RESOURCE_EMOJIS, capitalize } from './utils.js';
import { upgrades } from '../../assets/terr_upgrades.js';
import { draw } from './draw.js';

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");
const selectedList = document.getElementById("selected-territory-list");
const popupVignette = document.getElementById("popup-vignette");
const upgradesPopup = document.getElementById('upgrades-popup');
const upgradesGrid = document.getElementById('upgrades-grid');
const upgradesTooltip = document.getElementById('upgrades-tooltip');
const toggleSwitch = document.getElementById('toggle-switch');
const economySummary = document.getElementById('economy-summary');

let territories = [];
let guilds =  {"None": {prefix: "None", name: "No one", color: "#ffffff"}, "Claim": {prefix: "Claim", name: "Claim", color: "#ff0000"}};
let guildsList = await fetchGuilds();
let selectedTerritories = [];

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
    updateGuildEconomy();
    render();

    setInterval(() => {
        updateGuildEconomy();
        render();
    }, 500);
};

if (!toggleSwitch.dataset.initialized) {
    toggleSwitch.dataset.initialized = "true";
    toggleSwitch.addEventListener("click", () => {
        toggleSwitch.classList.toggle("active");
        renderEconomySummary();
    });
}


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
    const isPopupOpen = !upgradesPopup.classList.contains("hidden") || 
                        !document.getElementById("import-popup").classList.contains("hidden");

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


canvas.addEventListener('dblclick', e => {
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
        selectedTerritories = [];
        updateUI();
        if (clicked.guild == "None") {
            alert("You can only edit upgrades on territories that are part of the claim!");
            return;
        }
        openUpgradePopup(clicked);
    }
});

// --- Eco Calculations ---

function updateGuildEconomy() {
    const guild = guilds["Claim"];
    const produced = { wood: 0, ore: 0, fish: 0, crops: 0, emeralds: 0 };
    const costs = { wood: 0, ore: 0, fish: 0, crops: 0, emeralds: 0 };

    for (const territory of territories) {
        if (territory.guild !== "Claim") continue;

        updateTerritory(territory);

        // Add production
        for (const type in produced) {
            produced[type] += territory.production[type] || 0;
        }

        // Add costs from upgrades
        for (const key in territory.upgrades) {
            const level = territory.upgrades[key];
            const data = upgrades[key];
            const res = data.resource;
            if (res && data.costs[level]) {
                costs[res] += data.costs[level];
            }
        }
    }

    guild.produced = produced;
    guild.costs = costs;
    renderEconomySummary();
}

function renderEconomySummary() {
    const guild = guilds["Claim"];
    const produced = guild.produced;
    const costs    = guild.costs;

    // Calculate combined totals
    const totalProduced = Object.values(produced).reduce((a, b) => a + b, 0);
    const totalCost     = Object.values(costs).reduce((a, b) => a + b, 0);

    const isDetailView = toggleSwitch.classList.contains("active");

    // ----------------- SUMMARY VIEW -----------------
    if (!isDetailView) {
        const net = {};
        const utilisation = {};
        let totalProduced = 0;
        let totalCost = 0;

        for (const res in RESOURCE_EMOJIS) {
            const prod = produced[res] || 0;
            const cost = costs[res] || 0;
            const diff = prod - cost;

            net[res] = diff;
            utilisation[res] = prod > 0 ? ((cost / prod) * 100).toFixed(1) : "∞";

            totalProduced += prod;
            totalCost += cost;
        }

        const totalUtilisation = totalProduced > 0
            ? ((totalCost / totalProduced) * 100).toFixed(1)
            : "∞";

        let html = `
            <div style="color:#bbb; margin-bottom:4px;">
                Resource Utilisation: (${totalUtilisation}%)
            </div>
        `;

        for (const res in RESOURCE_EMOJIS) {
            const amount = net[res];
            const emoji = RESOURCE_EMOJIS[res];
            const sign = amount >= 0 ? "+" : "-";
            const absVal = Math.abs(amount).toLocaleString();
            const resourceUtil = utilisation[res];
            const utilClass = Number(resourceUtil) > 100 ? "util-high" : "";

            html += `
            <div>
                <span style="font-family:Icons; color:${emoji.color}; font-size:13px;">
                    ${emoji.glyph}
                </span>
                <span style="color:${emoji.color}; font-weight:bold; padding-left:4px;" class="${utilClass}">
                    ${sign}${absVal} ${capitalize(res)} (${resourceUtil}%)
                </span>
            </div>
            `;
        }

        economySummary.innerHTML = html.trim();
        return;
        }

    // ----------------- DETAIL VIEW -----------------
    // Cost block
    let html = `
        <div style="color:#bbb; margin-bottom:4px;">
        Overall Cost (per hour):
        </div>
    `;

    for (const res in RESOURCE_EMOJIS) {
        const amount  = costs[res] || 0;
        const emoji   = RESOURCE_EMOJIS[res];
        const valStr  = amount.toLocaleString();

        html += `
            <div>
                <span style="font-family:Icons; color:${emoji.color}; font-size:13px;">
                    ${emoji.glyph}
                </span>
                <span style="color:${emoji.color}; font-weight:bold; padding-left:4px;">
                    -${valStr} ${capitalize(res)}
                </span>
            </div>
        `;
    }

    // Spacer line
    html += `<hr style="border:0; border-top:1px solid #3f0a85; margin:6px 0;">`;

    // Production block
    html += `
        <div style="color:#bbb; margin-bottom:4px;">
            Overall Production (per hour):
        </div>
    `;

    for (const res in RESOURCE_EMOJIS) {
        const amount  = produced[res] || 0;
        const emoji   = RESOURCE_EMOJIS[res];
        const valStr  = amount.toLocaleString();

        html += `
            <div>
                <span style="font-family:Icons; color:${emoji.color}; font-size:13px;">
                    ${emoji.glyph}
                </span>
                <span style="color:${emoji.color}; font-weight:bold; padding-left:4px;">
                    +${valStr} ${capitalize(res)}
                </span>
            </div>
        `;
    }

    economySummary.innerHTML = html.trim();
}


// --- Vignette Functions ---
function showVignette() {
    popupVignette.style.pointerEvents = "all";
    popupVignette.classList.remove("fade-out", "hidden");
    // Force reflow
    void popupVignette.offsetWidth;
    popupVignette.classList.add("fade-in");
}

function hideVignette() {
    popupVignette.style.pointerEvents = "none";
    popupVignette.classList.remove("fade-in");
    popupVignette.classList.add("fade-out");

    setTimeout(() => {
        popupVignette.classList.add("hidden");
    }, 400);
}



// --- Guild UI Management ---

window.removeSelectedTerritories = function () {
    selectedTerritories = [];
    updateUI();
};

window.addToClaim = function () {
    for (const i in selectedTerritories) {
        selectedTerritories[i].guild = "Claim";
    }
    selectedTerritories = [];
    updateUI();
    render();
};


function updateUI() {
    // --- Update selected territory list ---
    if (selectedTerritories.length === 0) {
        selectedList.innerHTML = "<i>No territories selected</i>";
        return;
    }

    // Show all selected territories
    selectedList.innerHTML = selectedTerritories
        .map(t => `<div>${t.name} <span style="color: ${guilds[t.guild].color};">[${t.guild}]</div>`)
        .join("");
}


function openUpgradePopup(territory) {
    const rowLayout = [4, 4, 7, 6];
    const keys = Object.keys(upgrades);
    let keyIndex = 0;

    document.getElementById('upgrades-popup-title').textContent = territory.name + " Upgrades";
    upgradesGrid.innerHTML = '';
    

    for (const rowSize of rowLayout) {
        const row = document.createElement('div');
        row.classList.add('upgrades-row');

        for (let i = 0; i < rowSize && keyIndex < keys.length; i++, keyIndex++) {
            const key = keys[keyIndex];
            const icon = document.createElement('div');
            icon.classList.add('upgrades-icon');
            icon.dataset.key = key;
            icon.dataset.lvl = territory.upgrades[key] ?? 0;

            const img = document.createElement('img');
            img.src = `../assets/upgrades/${key}.png`;
            icon.appendChild(img);

            icon.addEventListener('mouseenter', e => {
                showUpgradeTooltip(e, key, territory);
                icon.addEventListener('mousemove', moveUpgradeTooltip);
            });

            icon.addEventListener('mouseleave', () => {
                upgradesTooltip.style.display = "none";
                icon.removeEventListener('mousemove', moveUpgradeTooltip);
            });

            icon.addEventListener('click', e => {
                if (territory.upgrades[key] < upgrades[key].costs.length - 1) {
                    territory.upgrades[key]++;
                    icon.dataset.lvl = territory.upgrades[key];
                    showUpgradeTooltip(e, key, territory);
                }
            });

            icon.addEventListener('contextmenu', e => {
                e.preventDefault();
                if (territory.upgrades[key] > 0) {
                    territory.upgrades[key]--;
                    icon.dataset.lvl = territory.upgrades[key];
                    showUpgradeTooltip(e, key, territory);
                }
            });

            row.appendChild(icon);
        }

        upgradesGrid.appendChild(row);
    }

    showVignette();
    upgradesPopup.style.animation = "fadeInUp 0.4s ease forwards";
    upgradesPopup.style.pointerEvents = "all";
    upgradesPopup.classList.remove('hidden');
}


document.getElementById('upgrades-close').addEventListener('click', () => {
    hideVignette();
    upgradesPopup.style.animation = "fadeOutDown 0.4s ease forwards";
    upgradesPopup.style.pointerEvents = "none";
    setTimeout(() => upgradesPopup.classList.add('hidden'), 400);
});

function moveUpgradeTooltip(e) {
    upgradesTooltip.style.left = e.pageX + 12 + 'px';
    upgradesTooltip.style.top = e.pageY + 12 + 'px';
}


function showUpgradeTooltip(e, key, territory) {
    const data = upgrades[key];
    const lvl = territory.upgrades[key] ?? 0;
    const rawEffect = data.effects[lvl];

    let effectText = "";
    if (data.display.includes("+{}%")) {
        const percent = Math.round((rawEffect - 1) * 100);
        effectText = data.display.replace("{}", `${percent}`);
    } else {
        effectText = data.display.replace("{}", rawEffect);
    }

    document.getElementById('tooltip-title').innerHTML = data.name + ` <span style="color:#ccc">[Lv. ${lvl}]</span>`;
    document.getElementById('tooltip-effect').textContent = effectText;

    const cost = data.costs[lvl];
    const resKey = data.resource;
    const emoji = RESOURCE_EMOJIS[resKey];
    const resName = resKey.charAt(0).toUpperCase() + resKey.slice(1);

    const costText = `Cost (per hour): <br>
        <span style="font-family: Icons; color: ${emoji.color}; font-size: 13px;">
        ${emoji.glyph}
        </span>
        <span style="color: ${emoji.color}; font-weight: bold; padding-left: 6px;">
        ${cost.toLocaleString()} ${resName}
        </span>
    `;

    document.getElementById('tooltip-cost').innerHTML = costText;

    upgradesTooltip.style.left = e.pageX + 12 + 'px';
    upgradesTooltip.style.top = e.pageY + 12 + 'px';
    upgradesTooltip.classList.remove('hidden');
    upgradesTooltip.style.display = "block";
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
    const popup = document.getElementById("import-popup");
    const select = document.getElementById("import-select");

    console.log(guildsList)
    
    select.innerHTML = "";
    for (const prefix in guildsList) {
        const opt = document.createElement("option");
        opt.value = prefix;
        opt.textContent = guildsList[prefix];
        select.appendChild(opt);
    }

    showVignette();
    popup.style.animation = "fadeInUp 0.4s ease forwards";
    popup.style.pointerEvents = "all";
    popup.classList.remove('hidden');
    
};

document.getElementById("import-close").addEventListener("click", closeImportPopup);
document.getElementById("import-confirm").addEventListener("click", async () => {
    const prefix = document.getElementById("import-select").value;
    const territories = await fetchTerritories(prefix);

    window.territories = territories;

    updateUI();
    render();
    closeImportPopup();
});

function closeImportPopup() {
    const popup = document.getElementById("import-popup");

    hideVignette();
    popup.style.animation = "fadeOutDown 0.4s ease forwards";
    popup.style.pointerEvents = "none";
    setTimeout(() => popup.classList.add('hidden'), 400);
}


window.resetAll = async function () {
    guilds =  {"None": {prefix: "None", name: "No one", color: "#ffffff"}, "Claim": {prefix: "Claim", name: "Claim", color: "#ff0000"}};
    selectedTerritories = []

    territories = await fetchTerritories();
    updateUI();
    render();
};

window.setHQ = async function () {
    if (!(selectedTerritories.length === 1)) {
        alert("Select one territory to mark as HQ.");
        return;
    }
    if (!(selectedTerritories[0].guild == "Claim")) {
        alert("Select a claimed territory to mark as HQ.");
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


