import { terr_data } from '../../assets/terr_data.js';

const API_URL = "https://athena.wynntils.com/cache/get/territoryList";

// Fetch and merge both APIs
export async function fetchTerritories() {
    const res = await axios.get(API_URL);

    const data = res.data.territories;

    let territories = terr_data;

    for (const name in data) {
        const t = data[name];

        territories[name] = {
            name: t.territory,
            guild: t.guild,
            guildPrefix: t.guildPrefix,
            acquired: t.acquired,
            acquiredDate: new Date(t.acquired),
            color: t.guildColor,
            rect: territories[name].rect,
            tradingRoutes: territories[name].tradingRoutes,
            resources: territories[name].resources
        };
    }

    return Object.values(territories);
}
