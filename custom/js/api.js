import { locationToRect, normalizeTerritoryName } from './utils.js';

const API_URL = "https://athena.wynntils.com/cache/get/territoryList";
const TERRITORY_DATA_URL = new URL('../../assets/terr_data.json', import.meta.url);

function indexTerritories(data) {
    const indexed = new Map();

    for (const [key, territory] of Object.entries(data)) {
        indexed.set(normalizeTerritoryName(key), { key, territory });
    }

    return indexed;
}

// Fetch and merge both APIs
export async function fetchTerritories(full_output) {
    const [territoryDataResponse, apiResponse] = await Promise.all([
        fetch(TERRITORY_DATA_URL),
        axios.get(API_URL)
    ]);

    if (!territoryDataResponse.ok) {
        throw new Error(`Failed to load territory data from ${TERRITORY_DATA_URL}`);
    }

    const baseTerritories = await territoryDataResponse.json();
    const liveTerritories = apiResponse.data?.territories ?? {};
    const baseIndex = indexTerritories(baseTerritories);
    const territories = [];
    const guilds = {};

    for (const [apiKey, liveTerritory] of Object.entries(liveTerritories)) {
        const territoryName = liveTerritory.territory ?? apiKey;
        const baseEntry = baseIndex.get(normalizeTerritoryName(territoryName));
        const baseTerritory = baseEntry?.territory ?? {};
        const guildPrefix = full_output ? (liveTerritory.guildPrefix || 'None') : 'None';

        territories.push({
            ...baseTerritory,
            name: territoryName,
            guild: guildPrefix,
            guildPrefix: liveTerritory.guildPrefix,
            acquired: liveTerritory.acquired,
            acquiredDate: new Date(liveTerritory.acquired),
            color: liveTerritory.guildColor,
            rect: liveTerritory.location ? locationToRect(liveTerritory.location) : baseTerritory.rect,
            tradingRoutes: baseTerritory.tradingRoutes ?? [],
            resources: baseTerritory.resources ?? {}
        });

        if (full_output && guildPrefix !== 'None' && !guilds[guildPrefix]) {
            guilds[guildPrefix] = {
                name: liveTerritory.guild,
                prefix: guildPrefix,
                color: liveTerritory.guildColor
            };
        }
    }

    if (full_output) {
        guilds.None = { prefix: 'None', name: 'No one', color: '#ffffff' };
        return [territories, guilds];
    } else {
        return territories;
    }
}
