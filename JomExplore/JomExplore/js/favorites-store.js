const FAVORITES_STORAGE_KEY = "jomExploreFavorites";
const ITINERARY_STORAGE_KEY = "jomExploreSavedItinerary";

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
