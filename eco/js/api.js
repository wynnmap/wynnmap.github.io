import { upgrades } from '../../assets/terr_upgrades.js';
import { locationToRect, normalizeTerritoryName } from './utils.js';


const API_URL = "https://athena.wynntils.com/cache/get/territoryList";
const TERRITORY_DATA_URL = new URL('../../assets/terr_data.json', import.meta.url);

function indexTerritories(data) {
    const indexed = new Map();

    for (const [key, territory] of Object.entries(data)) {
        indexed.set(normalizeTerritoryName(key), territory);
    }

    return indexed;
}

// Fetch and merge both APIs
export async function fetchTerritories(import_guild) {
    const [territoryDataResponse, apiResponse] = await Promise.all([
        fetch(TERRITORY_DATA_URL),
        axios.get(API_URL)
    ]);

    if (!territoryDataResponse.ok) {
        throw new Error(`Failed to load territory data from ${TERRITORY_DATA_URL}`);
    }

    const baseTerritories = await territoryDataResponse.json();
    const baseIndex = indexTerritories(baseTerritories);
    const liveTerritories = apiResponse.data?.territories ?? {};
    const territories = [];

    for (const [apiKey, liveTerritory] of Object.entries(liveTerritories)) {
        const territoryName = liveTerritory.territory ?? apiKey;
        const baseTerritory = baseIndex.get(normalizeTerritoryName(territoryName)) ?? {};

        const territory = {
            ...baseTerritory,
            name: territoryName,
            rect: liveTerritory.location ? locationToRect(liveTerritory.location) : baseTerritory.rect,
            resources: baseTerritory.resources ?? {},
            tradingRoutes: baseTerritory.tradingRoutes ?? [],
            production: { ...(baseTerritory.resources ?? {}) },
            upgrades: {},
            treasury: 'vlow',
            guild: import_guild && liveTerritory.guildPrefix === import_guild ? 'Claim' : 'None'
        };

        for (const key in upgrades) {
            territory.upgrades[key] = 0;
        }

        territories.push(territory);
    }

    return territories;
}

export async function fetchGuilds() {
    const res = await axios.get(API_URL);
    const data = res.data.territories;

    let guilds = {};

    for (const t in data) {
        const prefix = data[t].guildPrefix;
        if (!prefix) continue;
        guilds[prefix] = `${data[t].guild} [${prefix}]`;
    }

    return guilds;
}


