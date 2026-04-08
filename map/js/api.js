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
export async function fetchTerritories() {
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
    const mergedTerritories = new Map();

    for (const [apiKey, liveTerritory] of Object.entries(liveTerritories)) {
        const territoryName = liveTerritory.territory ?? apiKey;
        const baseEntry = baseIndex.get(normalizeTerritoryName(territoryName));
        const baseTerritory = baseEntry?.territory ?? {};

        mergedTerritories.set(baseEntry?.key ?? territoryName, {
            ...baseTerritory,
            name: territoryName,
            guild: liveTerritory.guild,
            guildPrefix: liveTerritory.guildPrefix,
            acquired: liveTerritory.acquired,
            acquiredDate: new Date(liveTerritory.acquired),
            color: liveTerritory.guildColor,
            rect: liveTerritory.location ? locationToRect(liveTerritory.location) : baseTerritory.rect,
            tradingRoutes: baseTerritory.tradingRoutes ?? [],
            resources: baseTerritory.resources ?? {}
        });
    }

    return Array.from(mergedTerritories.values());
}
