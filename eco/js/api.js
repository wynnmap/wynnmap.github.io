import { terr_data } from '../../assets/terr_data.js';
import { upgrades } from '../../assets/terr_upgrades.js';


const API_URL = "https://athena.wynntils.com/cache/get/territoryList";

// Fetch and merge both APIs
export async function fetchTerritories(import_guild) {
    const res = await axios.get(API_URL);

    const data = res.data.territories;

    let territories = terr_data;
    let guilds = {}

    for (const name in territories) {
        const t = data[name];
        territories[name].production = territories[name].resources
        territories[name].upgrades = {}
        for (const key in upgrades) {
           territories[name].upgrades[key] = 0;
        }
        
        if (import_guild && t.guildPrefix === import_guild) {
            territories[name].guild = "Claim"
        } else {
            territories[name].guild = "None";
        }
    }

    return Object.values(territories);
}

export async function fetchGuilds() {
    const res = await axios.get(API_URL);
    const data = res.data.territories;

    let guilds = {};

    for (const t in data) {
        guilds[data[t].guildPrefix] = `${data[t].guild} [${data[t].guildPrefix}]`;
    }

    return guilds;
}


