import { upgrades } from '../../assets/terr_upgrades.js';

const MAP_WIDTH = 1009;
const MAP_HEIGHT = 1604;

export { MAP_WIDTH, MAP_HEIGHT };

const FADE_DISTANCE = 0.2;

export const RESOURCE_EMOJIS = {
    emeralds: { glyph: "E", color: "#55d746" },
    ore:      { glyph: "A", color: "#e8e8e8" },
    crops:    { glyph: "D", color: "#e8e84d" },
    fish:     { glyph: "C", color: "#4de8e8" },
    wood:     { glyph: "B", color: "#e89b00" }
};



export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function shortenName(str) {
    if (!str || typeof name !== "string") return "";

    return str
        .split(/\s+/)                         // split by spaces
        .filter(word => word.length)          // ignore empty strings
        .map(word => word[0].toUpperCase())   // first letter, uppercased
        .join("");                            // combine into acronym
}

export function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}

export function hexToRgba(hex, alphaOverride = null) {
    hex = hex.replace(/^#/, '');

    let r, g, b, a = 1;

    if (hex.length === 4) {
        // Format: #RGBA
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
        // Format: #RRGGBB
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else {
        throw new Error(`Invalid hex color: ${hex}`);
    }

    if (alphaOverride !== null) {
        a = alphaOverride;
    }

    return `rgba(${r},${g},${b},${a})`;
}

export function fixHexCode(hex) {
    // Remove "#" if present
    hex = hex.replace(/^#/, '');

    if (hex.length === 4) {
        const r = hex[0] + hex[0];
        const g = hex[1] + hex[1];
        const b = hex[2] + hex[2];
        return `#${r}${g}${b}`;
    }

    // Return original if not 4 digits
    return `#${hex}`;
}


export function toCanvasCoords(x_ingame, z_ingame) {
    const x_canvas = (x_ingame + 2382) * MAP_WIDTH / 4034;
    const y_canvas = (z_ingame + 6572) * MAP_HEIGHT / 6414;
    return { x: x_canvas, y: y_canvas };
}


export function drawOutlinedText(ctx, text, x, y, font, color = `rgba(255,255,255,255)`, alpha = 1.0, outlineWidth = 3) {
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.strokeText(text, x, y);

    ctx.fillStyle = color;  // color is already rgba
    ctx.fillText(text, x, y);
}


export function getFadeAlpha(scale, threshold, fadeDistance = FADE_DISTANCE) {
    let alpha = (scale - threshold + fadeDistance) / fadeDistance;
    return Math.max(0, Math.min(1, alpha));
}

export function getTerritoryType(resources, resEmojiMap = RESOURCE_EMOJIS) {
    const emeralds = parseInt(resources.emeralds || "0");
    const ore = parseInt(resources.ore || "0");
    const crops = parseInt(resources.crops || "0");
    const fish = parseInt(resources.fish || "0");
    const wood = parseInt(resources.wood || "0");

    const resourceAmounts = { ore, crops, fish, wood };
    const producedResources = Object.entries(resourceAmounts).filter(([_, amt]) => amt > 0);

    // Rainbow check
    if (emeralds === 1800 && ore === 900 && crops === 900 && fish === 900 && wood === 900) {
        const rainbowIcons = [
            { glyph: resEmojiMap["ore"].glyph,   color: resEmojiMap["ore"].color },
            { glyph: resEmojiMap["crops"].glyph, color: resEmojiMap["crops"].color },
            { glyph: resEmojiMap["fish"].glyph,  color: resEmojiMap["fish"].color },
            { glyph: resEmojiMap["wood"].glyph,  color: resEmojiMap["wood"].color }
        ];
        return { type: "rainbow", icons: rainbowIcons };
    }

    // City check
    if (emeralds === 18000) {
        const resType = producedResources.length > 0 ? producedResources[0][0] : null;
        const res = resType ? resEmojiMap[resType] : { glyph: "", color: "#FFFFFF" };
        return { type: "city", icons: [
            { glyph: resEmojiMap["emeralds"].glyph, color: resEmojiMap["emeralds"].color },
            { glyph: res.glyph, color: res.color }
        ] };
    }

    // Double resource check
    if (producedResources.length === 1 && producedResources[0][1] === 7200) {
        const res = resEmojiMap[producedResources[0][0]];
        return { type: "double", icons: [
            { glyph: res.glyph, color: res.color },
            { glyph: res.glyph, color: res.color }
        ] };
    }

    // Duo resource check
    if (producedResources.length === 2 && producedResources.every(([_, amt]) => amt === 3600)) {
        const icons = producedResources.map(([res, _]) => {
            return { glyph: resEmojiMap[res].glyph, color: resEmojiMap[res].color };
        });
        return { type: "duo", icons };
    }

    // Normal resource territory
    if (producedResources.length === 1 && producedResources[0][1] === 3600) {
        const res = resEmojiMap[producedResources[0][0]];
        return { type: "normal", icons: [{ glyph: res.glyph, color: res.color }] };
    }

    // Unknown fallback
    return { type: "unknown", icons: [{ glyph: "?", color: "#FFFFFF" }] };
}

export function generateTooltip(t, guilds) {
    const { type, icons } = getTerritoryType(t.resources);
    
    const resourceAmounts = {
        emeralds: parseInt(t.production.emeralds || "0"),
        ore:      parseInt(t.production.ore || "0"),
        crops:    parseInt(t.production.crops || "0"),
        fish:     parseInt(t.production.fish || "0"),
        wood:     parseInt(t.production.wood || "0"),
    };

    // Build resources multiline
    let resourceLines = Object.entries(resourceAmounts)
        .filter(([res, amount]) => amount > 0)
        .map(([res, amount]) => {
            const emoji = RESOURCE_EMOJIS[res];
            return `<div style="margin-left: 16px;">
                <span style="font-family: Icons; color: ${emoji.color}; font-size: 12px;">${emoji.glyph}</span> <span style="color: ${emoji.color}">+${amount}</span>
            </div>`;
        }).join("");

    // Build type label dynamically
    let typeLabel = type.charAt(0).toUpperCase() + type.slice(1);  // Capitalize

    return `
        <div style="font-family: Minecraft, sans-serif; font-size: 16px;">
            <b style="font-family: MinecraftBold; font-size: 18px;">${t.name}</b><br>
            Guild: <span style="color: ${guilds[t.guild].color};">${guilds[t.guild].name} [${t.guild}]</span><br>
            Type: ${typeLabel}<br>
            Resources:<br>
            ${resourceLines}
        </div>
    `;
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function updateTerritory(territory) {
    const base = territory.resources;
    const upgradesData = territory.upgrades;
    const treasuryBonus = 0; // Future feature

    const resEff = upgrades["efficientResources"].effects[upgradesData.efficientResources || 0];
    const resRate = upgrades["resourceRate"].effects[upgradesData.resourceRate || 0];
    const emeraldEff = upgrades["efficientEmeralds"].effects[upgradesData.efficientEmeralds || 0];
    const emeraldRate = upgrades["emeraldRate"].effects[upgradesData.emeraldRate || 0];

    const adjusted = {
        wood: Math.round(base.wood * resEff * (4 / resRate)),
        ore: Math.round(base.ore * resEff * (4 / resRate)),
        fish: Math.round(base.fish * resEff * (4 / resRate)),
        crops: Math.round(base.crops * resEff * (4 / resRate)),
        emeralds: Math.round(base.emeralds * emeraldEff * (4 / emeraldRate))
    };

    // Apply treasury bonus (currently 0%)
    for (const key in adjusted) {
        adjusted[key] = Math.round(adjusted[key] * (1 + treasuryBonus));
    }

    territory.production = adjusted;
}


