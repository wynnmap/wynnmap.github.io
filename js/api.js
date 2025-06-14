import { toCanvasCoords } from './utils.js';

const API1_URL = "https://athena.wynntils.com/cache/get/territoryList";
const API2_URL = "https://raw.githubusercontent.com/jakematt123/Wynncraft-Territory-Info/refs/heads/main/territories.json";

// Fetch and merge both APIs
export async function fetchTerritories() {
    const res1 = await axios.get(API1_URL);
    const res2 = await axios.get(API2_URL);

    const data = res1.data.territories;
    const extraData = res2.data;

    let territories = {};

    for (const name in data) {
        const t = data[name];
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

    // Merge in the extra trading routes data
    for (const name in extraData) {
        if (territories[name]) {
            const extra = extraData[name];
            territories[name].tradingRoutes = extra["Trading Routes"] || [];
            territories[name].resources = extra.resources || {};
        }
    }

    return Object.values(territories);
}
