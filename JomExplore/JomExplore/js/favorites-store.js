const FAVORITES_STORAGE_KEY = "jomExploreFavorites";
const ITINERARY_STORAGE_KEY = "jomExploreSavedItinerary";
const SAVED_ITINERARIES_STORAGE_KEY = "jomExploreSavedItineraries";
const EDITING_ITINERARY_STORAGE_KEY = "jomExploreEditingItineraryId";
const ITINERARY_MIGRATION_STORAGE_KEY = "jomExploreItineraryMigrationV1";

function getFavoriteIds() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];
    }
    catch {
        return [];
    }
}

function isFavorite(placeId) {
    return getFavoriteIds().includes(placeId);
}

function toggleFavorite(placeId) {
    const favorites = getFavoriteIds();
    const nextFavorites = favorites.includes(placeId)
        ? favorites.filter(id => id !== placeId)
        : [...favorites, placeId];

    localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(nextFavorites)
    );

    window.dispatchEvent(new CustomEvent("favoriteschange", {
        detail: nextFavorites
    }));

    return nextFavorites;
}

function createStorageId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `itinerary-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSavedItineraries() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(SAVED_ITINERARIES_STORAGE_KEY)
        );
        return Array.isArray(saved) ? saved : [];
    }
    catch {
        return [];
    }
}

function writeSavedItineraries(savedItineraries) {
    localStorage.setItem(
        SAVED_ITINERARIES_STORAGE_KEY,
        JSON.stringify(savedItineraries)
    );
    window.dispatchEvent(new CustomEvent("saveditinerarieschange", {
        detail: savedItineraries
    }));
    return savedItineraries;
}

function saveItineraryRecord(itinerary, name, existingId = null) {
    const savedItineraries = getSavedItineraries();
    const now = new Date().toISOString();
    const cleanedName = String(name || "Kuala Lumpur itinerary").trim();
    const existingIndex = existingId
        ? savedItineraries.findIndex(record => record.id === existingId)
        : -1;

    if (existingIndex >= 0) {
        const existing = savedItineraries[existingIndex];
        savedItineraries[existingIndex] = {
            ...existing,
            name: cleanedName || existing.name,
            updatedAt: now,
            itinerary
        };
        writeSavedItineraries(savedItineraries);
        return savedItineraries[existingIndex];
    }

    const record = {
        id: createStorageId(),
        name: cleanedName || "Kuala Lumpur itinerary",
        savedAt: now,
        updatedAt: now,
        itinerary
    };
    savedItineraries.unshift(record);
    writeSavedItineraries(savedItineraries);
    return record;
}

function renameItineraryRecord(id, name) {
    const savedItineraries = getSavedItineraries();
    const record = savedItineraries.find(item => item.id === id);
    if (!record || !String(name).trim()) return null;
    record.name = String(name).trim();
    record.updatedAt = new Date().toISOString();
    writeSavedItineraries(savedItineraries);
    return record;
}

function duplicateItineraryRecord(id) {
    const savedItineraries = getSavedItineraries();
    const source = savedItineraries.find(record => record.id === id);
    if (!source) return null;
    const now = new Date().toISOString();
    const duplicate = {
        ...source,
        id: createStorageId(),
        name: `${source.name} (Copy)`,
        savedAt: now,
        updatedAt: now,
        itinerary: JSON.parse(JSON.stringify(source.itinerary))
    };
    savedItineraries.unshift(duplicate);
    writeSavedItineraries(savedItineraries);
    return duplicate;
}

function deleteItineraryRecord(id) {
    const nextSavedItineraries = getSavedItineraries()
        .filter(record => record.id !== id);
    writeSavedItineraries(nextSavedItineraries);
    if (localStorage.getItem(EDITING_ITINERARY_STORAGE_KEY) === id) {
        localStorage.removeItem(EDITING_ITINERARY_STORAGE_KEY);
    }
    return nextSavedItineraries;
}

function migrateLegacyItinerary() {
    if (localStorage.getItem(ITINERARY_MIGRATION_STORAGE_KEY)) return;
    if (getSavedItineraries().length) {
        localStorage.setItem(ITINERARY_MIGRATION_STORAGE_KEY, "complete");
        return;
    }
    try {
        const legacy = JSON.parse(localStorage.getItem(ITINERARY_STORAGE_KEY));
        if (legacy?.scheduled?.length) {
            const date = legacy.settings?.date || "Saved plan";
            saveItineraryRecord(legacy, `Kuala Lumpur · ${date}`);
        }
    }
    catch {
        // A malformed legacy plan is ignored; the planner can create a new one.
    }
    localStorage.setItem(ITINERARY_MIGRATION_STORAGE_KEY, "complete");
}

migrateLegacyItinerary();
