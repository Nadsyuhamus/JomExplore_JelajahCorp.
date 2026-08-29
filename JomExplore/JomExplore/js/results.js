// =================================
// GET USER PREFERENCES
// =================================

const savedPreferences =
    localStorage.getItem(
        "jomExplorePreferences"
    );


// If no preferences exist
if (!savedPreferences) {

    window.location.href =
        "explore.html";

}


// Convert saved JSON back into object
const preferences =
    JSON.parse(savedPreferences);


// =================================
// HTML ELEMENTS
// =================================

const resultsContainer =
    document.getElementById(
        "resultsContainer"
    );


const resultDescription =
    document.getElementById(
        "resultDescription"
    );


const noResults =
    document.getElementById(
        "noResults"
    );

const resultCount = document.getElementById("resultCount");
const resultFilters = document.getElementById("resultFilters");
const browseAllButton = document.getElementById("browseAllButton");
const useLocationButton = document.getElementById("useLocationButton");
const locationStatus = document.getElementById("locationStatus");
const mapCount = document.getElementById("mapCount");
const favoriteCount = document.getElementById("favoriteCount");

let userLocation = null;
let resultsMap;
let placeMarkerLayer;
let userLocationMarker;
const markersByPlaceId = new Map();


// =================================
// SHOW USER PREFERENCES
// =================================

function getPreferenceDescription() {
    const budgetText = preferences.budget === "Free"
        ? "free entry"
        : `the ${preferences.budget} spending range`;

    return `Places in ${preferences.location} matching at least one of your interests ` +
        `(${preferences.interests.join(", ")}), ${budgetText}, and a visit within ${preferences.time}.`;
}

resultDescription.textContent = getPreferenceDescription();


// =================================
// FILTER PLACES
// =================================


function calculateScore(place) {

    let score = 0;


    // Interest match
    if (
        preferences.interests.some(
            interest => place.tags.includes(interest) || place.category === interest
        )
    ) {

        score += 3;

    }


    // Budget match
    if (
        checkBudget(
            place.price,
            preferences.budget
        )
    ) {

        score += 2;

    }


    // Time match
    if (
        checkTime(
            place.visitTime,
            preferences.time
        )
    ) {

        score += 2;

    }


    // Closer places get higher score
    if (place.distance <= 1) {

        score += 2;

    }

    else if (place.distance <= 2) {

        score += 1;

    }


    // Higher rating gets a small bonus
    if (place.rating >= 4.5) {

        score += 1;

    }


    return score;

}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const toRadians = degrees => degrees * Math.PI / 180;
    const latitudeDifference = toRadians(lat2 - lat1);
    const longitudeDifference = toRadians(lng2 - lng1);
    const startLatitude = toRadians(lat1);
    const endLatitude = toRadians(lat2);
    const haversine =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(startLatitude) * Math.cos(endLatitude) *
        Math.sin(longitudeDifference / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(1 - haversine)
    );
}

function updatePlaceDistances() {
    if (!userLocation) return;

    places.forEach(place => {
        const coordinates = placeCoordinates[place.id];
        place.distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            coordinates.lat,
            coordinates.lng
        );
    });
}

function createDirectionsUrl(place, travelMode) {
    const coordinates = placeCoordinates[place.id];
    const parameters = new URLSearchParams({
        api: "1",
        destination: `${coordinates.lat},${coordinates.lng}`,
        travelmode: travelMode,
        dir_action: "navigate",
        utm_source: "JomExplore",
        utm_campaign: "place_directions"
    });

    if (userLocation) {
        parameters.set(
            "origin",
            `${userLocation.lat},${userLocation.lng}`
        );
    }

    return `https://www.google.com/maps/dir/?${parameters.toString()}`;
}

function updateFavoriteCount() {
    favoriteCount.textContent = getFavoriteIds().length;
}

function initializeResultsMap() {
    if (typeof L === "undefined") {
        document.querySelector(".map-panel").hidden = true;
        return;
    }

    resultsMap = L.map("resultsMap", {
        scrollWheelZoom: false
    }).setView([3.1478, 101.6953], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap contributors</a>"
    }).addTo(resultsMap);

    placeMarkerLayer = L.layerGroup().addTo(resultsMap);
}

function createMarkerPopup(place) {
    const popup = document.createElement("div");
    const title = document.createElement("strong");
    const details = document.createElement("p");

    title.textContent = place.name;
    details.textContent = userLocation
        ? `${place.area} · ${place.distance.toFixed(1)} km away`
        : place.area;
    popup.append(title, details);

    return popup;
}

function updateResultsMap(placesToDisplay) {
    if (!resultsMap) return;

    placeMarkerLayer.clearLayers();
    markersByPlaceId.clear();
    mapCount.textContent =
        `${placesToDisplay.length} ${placesToDisplay.length === 1 ? "place" : "places"} on map`;

    const bounds = [];

    placesToDisplay.forEach(place => {
        const coordinates = placeCoordinates[place.id];
        const marker = L.marker([coordinates.lat, coordinates.lng])
            .bindPopup(createMarkerPopup(place))
            .addTo(placeMarkerLayer);

        markersByPlaceId.set(place.id, marker);
        bounds.push([coordinates.lat, coordinates.lng]);
    });

    if (userLocation) {
        if (userLocationMarker) {
            userLocationMarker.remove();
        }

        userLocationMarker = L.circleMarker(
            [userLocation.lat, userLocation.lng],
            {
                radius: 8,
                color: "#0f766e",
                fillColor: "#14b8a6",
                fillOpacity: 0.9,
                weight: 3
            }
        ).bindPopup("Your current location").addTo(resultsMap);
        bounds.push([userLocation.lat, userLocation.lng]);
    }

    if (bounds.length) {
        resultsMap.fitBounds(bounds, {
            padding: [32, 32],
            maxZoom: 15
        });
    }
}

function focusPlaceOnMap(place) {
    if (!resultsMap) return;

    const coordinates = placeCoordinates[place.id];
    const marker = markersByPlaceId.get(place.id);

    resultsMap.flyTo([coordinates.lat, coordinates.lng], 16, {
        duration: 0.6
    });
    marker?.openPopup();
    document.getElementById("resultsMap").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function findMatchingPlaces() {

    const matchingPlaces = places.filter(place => {

        // Location must match
        const locationMatch =
            place.location === preferences.location;

        if (!locationMatch) {
            return false;
        }

        // Check whether any interest tag or category matches
        const interestMatch =
            preferences.interests.some(
                interest => place.tags.includes(interest) || place.category === interest
            );

        const budgetMatch = checkBudget(place.price, preferences.budget);
        const timeMatch = checkTime(place.visitTime, preferences.time);

        // Every preference group must match. Within the interests group,
        // matching any selected interest is enough.
        return interestMatch && budgetMatch && timeMatch;

    });


    // Sort most suitable places first
    matchingPlaces.sort((a, b) => {

        if (userLocation) {
            return a.distance - b.distance;
        }

        const scoreA =
            calculateScore(a);

        const scoreB =
            calculateScore(b);

        return scoreB - scoreA;

    });


    return matchingPlaces;

}


// =================================
// BUDGET CHECK
// =================================

function checkBudget(
    price,
    budget
) {


    if (budget === "Free") {

        return price === 0;

    }


    if (budget === "RM1-30") {

        return price >= 1 && price <= 30;

    }


    if (budget === "RM31-50") {

        return price >= 31 && price <= 50;

    }


    if (budget === "RM51-100") {

        return price >= 51 && price <= 100;

    }


    if (budget === "RM100+") {

        return price > 100;

    }


    return false;

}


// =================================
// TIME CHECK
// =================================

function checkTime(
    visitTime,
    availableTime
) {


    let hours;


    if (availableTime === "1 hour") {

        hours = 1;

    }

    else if (
        availableTime === "2 hours"
    ) {

        hours = 2;

    }

    else if (
        availableTime === "3 hours"
    ) {

        hours = 3;

    }

    else if (
        availableTime === "Half Day"
    ) {

        hours = 4;

    }

    else if (
        availableTime === "Full Day"
    ) {

        hours = 8;

    }


    return visitTime <= hours;

}

// =================================
// DISPLAY PLACES
// =================================

function displayPlaces(
    placesToDisplay
) {


    resultsContainer.innerHTML = "";
    updateResultsMap(placesToDisplay);

    resultCount.textContent =
        `${placesToDisplay.length} ${placesToDisplay.length === 1 ? "place" : "places"}`;


    if (
        placesToDisplay.length === 0
    ) {

        noResults.style.display =
            "block";

        return;

    }


    noResults.style.display =
        "none";


    placesToDisplay.forEach(
        place => {

            const image = placeImages[place.id];
            const distanceMarkup = userLocation
                ? `<span class="place-distance">🧭 ${place.distance.toFixed(1)} km away</span>`
                : "";
            const favoriteActive = isFavorite(place.id);
            const photoCredit = image?.source
                ? `<a class="photo-credit"
                       href="${image.source}"
                       target="_blank"
                       rel="noopener noreferrer">
                       Photo: ${image.creator}${image.license ? ` · ${image.license}` : ""}
                   </a>`
                : image
                    ? `<span class="photo-credit">${image.creator}</span>`
                    : "";

            const imageMarkup = image
                ? `
                    <div class="place-image">
                        <img src="${image.src}"
                             alt="${image.alt}"
                             loading="lazy"
                             decoding="async">
                        <span class="place-image-fallback" hidden>
                            ${place.emoji}
                        </span>
                        ${photoCredit}
                    </div>`
                : `
                    <div class="place-image place-image-placeholder">
                        <span>${place.emoji}</span>
                    </div>`;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "place-card";


            card.innerHTML = `

                ${imageMarkup}


                <div class="place-content">


                    <span class="place-category">

                        ${place.category}

                    </span>


                    <h3>

                        ${place.name}

                    </h3>


                    <p class="place-description">

                        ${place.description}

                    </p>

                    <div class="place-info">

                        ${distanceMarkup}

                        <span>
                            📍 ${place.area}
                        </span>

                        <span>
                            ⭐ ${place.rating}
                        </span>

                        <span>
                            💰 ${place.budgetLabel}
                        </span>

                        <span>
                            ⏱️ ${place.visitTime}h
                        </span>

                    </div>

                    <button class="favorite-button${favoriteActive ? " active" : ""}"
                            type="button"
                            aria-pressed="${favoriteActive}">
                        ${favoriteActive ? "♥ Saved to favourites" : "♡ Add to favourites"}
                    </button>


                    <a href="${place.sourceUrl}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="view-button">

                        View Details

                    </a>

                    <div class="travel-controls">
                        <label for="travel-${place.id}">Travel by</label>
                        <div class="travel-action-row">
                            <select id="travel-${place.id}"
                                    class="travel-mode"
                                    aria-label="Transportation method to ${place.name}">
                                <option value="transit">🚌 Public transport</option>
                                <option value="walking">🚶 Walking</option>
                                <option value="driving">🚗 Driving</option>
                                <option value="bicycling">🚲 Cycling</option>
                            </select>
                            <a class="directions-button"
                               href="${createDirectionsUrl(place, "transit")}"
                               target="_blank"
                               rel="noopener noreferrer">
                                Get directions
                            </a>
                        </div>
                    </div>

                    <button class="show-map-button"
                            type="button">
                        🗺️ Show on map
                    </button>


                </div>

            `;

            const photo = card.querySelector(".place-image img");

            if (photo) {
                photo.addEventListener("error", () => {
                    photo.hidden = true;
                    card.querySelector(".place-image-fallback").hidden = false;
                    const credit = card.querySelector(".photo-credit");
                    if (credit) {
                        credit.hidden = true;
                    }
                });
            }

            const travelMode = card.querySelector(".travel-mode");
            const directionsButton = card.querySelector(".directions-button");
            const favoriteButton = card.querySelector(".favorite-button");

            favoriteButton.addEventListener("click", () => {
                toggleFavorite(place.id);
                const active = isFavorite(place.id);
                favoriteButton.classList.toggle("active", active);
                favoriteButton.setAttribute("aria-pressed", active);
                favoriteButton.textContent = active
                    ? "♥ Saved to favourites"
                    : "♡ Add to favourites";
                updateFavoriteCount();
                if (active) trackEvent("favourite_added", { placeId: place.id });
            });

            travelMode.addEventListener("change", () => {
                directionsButton.href = createDirectionsUrl(
                    place,
                    travelMode.value
                );
            });

            card.querySelector(".show-map-button")
                .addEventListener("click", () => focusPlaceOnMap(place));


            resultsContainer.appendChild(
                card
            );

        }
    );

}


// =================================
// INITIAL RESULTS
// =================================

let matchingPlaces =
    findMatchingPlaces();

const locationPlaces = places.filter(
    place => place.location === preferences.location
);

function sortByCurrentDistance(placesToSort) {
    if (userLocation) {
        placesToSort.sort((a, b) => a.distance - b.distance);
    }

    return placesToSort;
}

initializeResultsMap();
updateFavoriteCount();

displayPlaces(
    matchingPlaces
);


// =================================
// CATEGORY FILTER
// =================================

const categoryIcons = {
    Food: "🍜",
    Culture: "🏛️",
    Nature: "🌿",
    Shopping: "🛍️",
    Entertainment: "🎢",
    Adventure: "🎯",
    Activities: "🎯"
};

let browsingAllCategories = false;

function placeMatchesFilter(place, filter) {
    return place.category === filter ||
        place.tags.includes(filter) ||
        (filter === "Adventure" && place.category === "Activities");
}

function createFilterButton(label, filter, active = false) {
    const button = document.createElement("button");

    button.className = `filter-button${active ? " active" : ""}`;
    button.type = "button";
    button.dataset.filter = filter;
    button.textContent = label;
    resultFilters.insertBefore(button, browseAllButton);
}

function renderFilters() {
    resultFilters.querySelectorAll(".filter-button")
        .forEach(button => button.remove());

    if (browsingAllCategories) {
        createFilterButton("All places", "all-places", true);

        [...new Set(locationPlaces.map(place => place.category))]
            .forEach(category => {
                createFilterButton(
                    `${categoryIcons[category] || "📍"} ${category}`,
                    category
                );
            });

        browseAllButton.textContent = "Back to recommendations";
        resultDescription.textContent =
            `Explore all places in ${preferences.location}.`;
    }
    else {
        createFilterButton("Recommended", "recommended", true);

        preferences.interests.forEach(interest => {
            createFilterButton(
                `${categoryIcons[interest] || "📍"} ${interest}`,
                interest
            );
        });

        browseAllButton.textContent = "Explore all categories";
        resultDescription.textContent = getPreferenceDescription();
    }
}

resultFilters.addEventListener("click", event => {
    const button = event.target.closest(".filter-button");

    if (!button) {
        return;
    }

    resultFilters.querySelectorAll(".filter-button")
        .forEach(filterButton => filterButton.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;
    const sourcePlaces = browsingAllCategories
        ? locationPlaces
        : matchingPlaces;

    if (filter === "recommended") {
        displayPlaces(matchingPlaces);
    }
    else if (filter === "all-places") {
        displayPlaces(sortByCurrentDistance([...locationPlaces]));
    }
    else {
        displayPlaces(
            sourcePlaces.filter(place => placeMatchesFilter(place, filter))
        );
    }
});

browseAllButton.addEventListener("click", () => {
    browsingAllCategories = !browsingAllCategories;
    renderFilters();
    displayPlaces(
        browsingAllCategories
            ? sortByCurrentDistance([...locationPlaces])
            : matchingPlaces
    );
});

useLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        locationStatus.textContent =
            "Location is not supported by this browser. Recommendations will use your selected preferences.";
        return;
    }

    useLocationButton.disabled = true;
    useLocationButton.textContent = "Finding your location…";
    locationStatus.textContent = "Waiting for location permission…";

    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            updatePlaceDistances();
            matchingPlaces = findMatchingPlaces();
            sortByCurrentDistance(locationPlaces);
            browsingAllCategories = false;
            renderFilters();
            displayPlaces(matchingPlaces);

            useLocationButton.disabled = false;
            useLocationButton.textContent = "✓ Using current location";
            locationStatus.textContent =
                `Recommendations are sorted nearest first. Location accuracy: about ${Math.round(position.coords.accuracy)} metres.`;
        },
        error => {
            const messages = {
                1: "Location permission was denied. Enable it in your browser settings or continue with your selected preferences.",
                2: "Your location could not be determined. Check your device location settings and try again.",
                3: "Finding your location took too long. Please try again."
            };

            useLocationButton.disabled = false;
            useLocationButton.textContent = "📍 Try current location again";
            locationStatus.textContent =
                messages[error.code] || "Your location could not be used. Please try again.";
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
});

renderFilters();
