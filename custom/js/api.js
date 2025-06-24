import { terr_data } from '../../assets/terr_data.js';

const API_URL = "https://athena.wynntils.com/cache/get/territoryList";

// Fetch and merge both APIs
export async function fetchTerritories(full_output) {
    const res = await axios.get(API_URL);

    const data = res.data.territories;

    let territories = terr_data;
    let guilds = {}

    for (const name in territories) {
        const t = data[name];
        
        if (full_output) {
            territories[name].guild = t.guildPrefix

            territories[name].guild = t.guildPrefix
            if (!guilds[t.guildPrefix]) {
                guilds[t.guildPrefix] = {name: t.guild, prefix: t.guildPrefix, color: t.guildColor}
            }
        } else {
            territories[name].guild = "None";
        }
    }

    if (full_output) {
        guilds["None"] = {prefix: "None", name: "No one", color: "#ffffff"}
        return [Object.values(territories), guilds];
    } else {
        return Object.values(territories);
    }
}
