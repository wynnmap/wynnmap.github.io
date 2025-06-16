import { toCanvasCoords } from './utils.js';

const API1_URL = "https://athena.wynntils.com/cache/get/territoryList";
const API2_URL = "https://raw.githubusercontent.com/jakematt123/Wynncraft-Territory-Info/refs/heads/main/territories.json";

// Fetch and merge both APIs
export async function fetchTerritories() {
    const res1 = await axios.get(API1_URL);
    const res2 = await axios.get(API2_URL);

    const data1 = res1.data.territories;
    const data2 = res2.data;

    let territories = {};

    for (const name in data1) {
        const t = data1[name];
        const loc = t.location;

        const topLeft = toCanvasCoords(loc.startX, loc.startZ);
        const bottomRight = toCanvasCoords(loc.endX, loc.endZ);

        territories[name] = {
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
            },
            tradingRoutes: [],
            resources: {}
        };
    }

    // Merge in the trading routes data
    for (const name in data2) {
        if (territories[name]) {
            const t = data2[name];
            territories[name].tradingRoutes = t["Trading Routes"] || [];
            territories[name].resources = t.resources || {};
        }
    }

    return Object.values(territories);
}
