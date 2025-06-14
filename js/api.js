import { toCanvasCoords } from './utils.js';

const API_URL = "https://athena.wynntils.com/cache/get/territoryList";

export async function fetchTerritories() {
    const res = await axios.get(API_URL);
    const data = res.data.territories;
    let territories = [];

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

    return territories;
}
