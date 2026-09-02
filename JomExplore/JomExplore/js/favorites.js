const favoritePlaces = document.getElementById("favoritePlaces");
const favoriteEmpty = document.getElementById("favoriteEmpty");
const plannerFavoriteCount = document.getElementById("plannerFavoriteCount");
const plannerForm = document.getElementById("plannerForm");
const plannerMessage = document.getElementById("plannerMessage");
const itinerarySection = document.getElementById("itinerarySection");
const itineraryTitle = document.getElementById("itineraryTitle");
const itinerarySummary = document.getElementById("itinerarySummary");
const itineraryTimeline = document.getElementById("itineraryTimeline");
const unscheduledPlaces = document.getElementById("unscheduledPlaces");
const saveItineraryButton = document.getElementById("saveItinerary");
const assistantPrompt = document.getElementById("assistantPrompt");
const applyAssistantButton = document.getElementById("applyAssistant");
const assistantInterpretation = document.getElementById("assistantInterpretation");
const copyItineraryButton = document.getElementById("copyItinerary");
const printItineraryButton = document.getElementById("printItinerary");
const aiProviderStatus = document.getElementById("aiProviderStatus");
const aiExplanationPanel = document.getElementById("aiExplanationPanel");
const aiItineraryExplanation = document.getElementById("aiItineraryExplanation");
const refreshAIExplanationButton = document.getElementById("refreshAIExplanation");
const saveItineraryDialog = document.getElementById("saveItineraryDialog");
const saveItineraryForm = document.getElementById("saveItineraryForm");
const saveDialogTitle = document.getElementById("saveDialogTitle");
const itineraryNameInput = document.getElementById("itineraryName");
const confirmSaveItineraryButton = document.getElementById("confirmSaveItinerary");
const closeSaveDialogButton = document.getElementById("closeSaveDialog");
const cancelSaveItineraryButton = document.getElementById("cancelSaveItinerary");
const continueToSettingsButton = document.getElementById("continueToSettings");
const backToFavouritesButton = document.getElementById("backToFavourites");
const plannerSteps = [...document.querySelectorAll(".planner-steps li")];
const itinerarySurvey = document.getElementById("itinerarySurvey");
const surveyButtons = document.getElementById("surveyButtons");
const surveyThanks = document.getElementById("surveyThanks");

let generatedItinerary = null;
let itineraryMap = null;
let itineraryMapLayer = null;
let plannerStep = 1;
let assistantState = {
    preferredCategories: [],
    pace: "standard"
};

const transportSettings = {
    transit: { label: "Public transport + walking", speed: 18, buffer: 8, icon: "🚌" },
    walking: { label: "Walking", speed: 4.5, buffer: 0, icon: "🚶" },
    driving: { label: "Driving", speed: 25, buffer: 5, icon: "🚗" },
    bicycling: { label: "Cycling", speed: 12, buffer: 2, icon: "🚲" }
};

function getTransportSuggestion(distance, availableModes = ["walking", "transit"]) {
    const modes = availableModes.filter(mode => transportSettings[mode]);
    const usableModes = modes.length ? modes : ["walking"];
    const scores = usableModes.map(mode => {
        let score = estimateTravelMinutes(distance, mode);

        if (mode === "walking" && distance > 2) score += (distance - 2) * 18;
        if (mode === "bicycling" && distance > 8) score += (distance - 8) * 4;
        if (mode === "transit" && distance < 1.2) score += 12;
        if (mode === "driving" && distance < 3) score += 15;

        return { mode, score };
    }).sort((a, b) => a.score - b.score);

    const mode = scores[0].mode;
    const reasons = {
        walking: "Suggested because this is a short journey.",
        transit: "Suggested to reduce walking on this journey.",
        bicycling: "Suggested as a practical option for this distance.",
        driving: "Suggested because it is the quickest available option for this longer journey."
    };

    return { mode, reason: reasons[mode] };
}

function resolveTransport(distance, selectedMode, availableModes) {
    if (selectedMode === "auto") {
        return getTransportSuggestion(distance, availableModes);
    }

    return {
        mode: selectedMode,
        reason: `Uses your selected primary method: ${transportSettings[selectedMode].label}.`
    };
}

// Replacement boundary: a future AI API or Ollama adapter only needs to
// return this same structured shape. The itinerary engine remains unchanged.
function parsePlannerRequest(request) {
    const text = request.toLowerCase();
    const result = {
        updates: {},
        preferredCategories: [],
        pace: "standard",
        summaries: []
    };

    const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)/);
    const budgetMatch = text.match(/(?:under|below|maximum|max|budget(?:\s+of)?)\s*(?:rm)?\s*(\d+)/);

    if (hoursMatch) {
        const requestedHours = Number(hoursMatch[1]);
        const allowedHours = [3, 5, 8, 10];
        result.updates.availableHours = allowedHours.reduce((closest, value) =>
            Math.abs(value - requestedHours) < Math.abs(closest - requestedHours)
                ? value
                : closest
        );
        result.summaries.push(`${result.updates.availableHours}-hour plan`);
    }
    else if (text.includes("half day") || text.includes("half-day")) {
        result.updates.availableHours = 5;
        result.summaries.push("half-day plan");
    }
    else if (text.includes("full day") || text.includes("full-day")) {
        result.updates.availableHours = 8;
        result.summaries.push("full-day plan");
    }

    if (budgetMatch) {
        const requestedBudget = Number(budgetMatch[1]);
        const allowedBudgets = [50, 100, 200, 300];
        const supportedBudget = allowedBudgets.filter(value => value <= requestedBudget).pop();
        if (supportedBudget) {
            result.updates.maximumBudget = supportedBudget;
            result.summaries.push(`budget up to RM${supportedBudget}`);
        }
        else {
            result.summaries.push("budget below RM50 needs manual adjustment");
        }
    }
    else if (/cheap|cheaper|budget-friendly|save money/.test(text)) {
        result.updates.maximumBudget = 100;
        result.summaries.push("budget up to RM100");
    }

    if (/auto|automatic|recommend.*transport|best transport|mix.*transport/.test(text)) {
        result.updates.transport = "auto";
        result.summaries.push("automatic transport suggestions");
    }
    else if (/less walking|public transport|transit|bus|train|lrt|mrt/.test(text)) {
        result.updates.transport = "transit";
        result.summaries.push("public transport");
    }
    else if (/walk|walking|on foot/.test(text)) {
        result.updates.transport = "walking";
        result.summaries.push("walking");
    }
    else if (/drive|driving|car/.test(text)) {
        result.updates.transport = "driving";
        result.summaries.push("driving");
    }
    else if (/cycle|cycling|bicycle|bike/.test(text)) {
        result.updates.transport = "bicycling";
        result.summaries.push("cycling");
    }

    if (/morning|early/.test(text)) {
        result.updates.startTime = "09:00";
        result.summaries.push("morning start");
    }
    else if (/afternoon/.test(text)) {
        result.updates.startTime = "13:00";
        result.summaries.push("afternoon start");
    }
    else if (/evening|night/.test(text)) {
        result.updates.startTime = "17:00";
        result.summaries.push("evening start");
    }

    const categories = {
        Food: ["food", "dining", "restaurant", "meal"],
        Culture: ["culture", "cultural", "museum", "heritage"],
        Nature: ["nature", "natural", "park", "garden"],
        Shopping: ["shopping", "shop", "mall"],
        Entertainment: ["entertainment", "show", "nightlife"],
        Adventure: ["adventure", "adventurous"],
        Activities: ["activity", "activities"]
    };
    Object.entries(categories).forEach(([category, keywords]) => {
        if (keywords.some(keyword => text.includes(keyword))) {
            result.preferredCategories.push(category);
        }
    });
    if (result.preferredCategories.length) {
        result.summaries.push(`prioritise ${result.preferredCategories.join(" and ")}`);
    }

    if (/relaxed|relaxing|slow|not rushed|easy pace/.test(text)) {
        result.pace = "relaxed";
        result.summaries.push("relaxed pace");
    }
    else if (/packed|fit more|as much as possible|busy/.test(text)) {
        result.pace = "packed";
        result.summaries.push("packed pace");
    }

    return result;
}

function escapePlannerText(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
    })[character]);
}

async function requestAIInterpretation(request) {
    const response = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request })
    });
    if (!response.ok) throw new Error("Local AI is unavailable.");
    return response.json();
}

function applyInterpretationToForm(interpretation, providerLabel) {
    const fields = {
        availableHours: document.getElementById("availableHours"),
        maximumBudget: document.getElementById("maximumBudget"),
        transport: document.getElementById("plannerTransport"),
        startTime: document.getElementById("startTime")
    };
    Object.entries(interpretation.updates || {}).forEach(([key, value]) => {
        if (fields[key]) fields[key].value = String(value);
    });
    assistantState = {
        preferredCategories: interpretation.preferredCategories || [],
        pace: interpretation.pace || "standard"
    };
    const summaries = (interpretation.summaries || [])
        .map(item => `<span>${escapePlannerText(item)}</span>`)
        .join("");
    assistantInterpretation.innerHTML = summaries
        ? `<strong>${escapePlannerText(providerLabel)}:</strong> ${summaries}`
        : "I could not identify a supported preference. Try mentioning budget, duration, transport, pace, start time, or categories.";
}

async function applyAssistantRequest() {
    const request = assistantPrompt.value.trim();
    if (!request) {
        assistantInterpretation.textContent = "Describe the kind of itinerary you want first.";
        return;
    }

    applyAssistantButton.disabled = true;
    applyAssistantButton.textContent = "Asking local AI…";
    assistantInterpretation.textContent = "Interpreting your request…";

    try {
        const result = await requestAIInterpretation(request);
        applyInterpretationToForm(
            result.interpretation,
            `AI understood (${result.model})`
        );
    }
    catch {
        applyInterpretationToForm(
            parsePlannerRequest(request),
            "Prototype fallback understood"
        );
    }
    finally {
        applyAssistantButton.disabled = false;
        applyAssistantButton.textContent = "Apply request";
    }
}

function calculateDistance(start, end) {
    const radius = 6371;
    const radians = degrees => degrees * Math.PI / 180;
    const latitude = radians(end.lat - start.lat);
    const longitude = radians(end.lng - start.lng);
    const value = Math.sin(latitude / 2) ** 2 +
        Math.cos(radians(start.lat)) * Math.cos(radians(end.lat)) *
        Math.sin(longitude / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function getSavedPlaces() {
    const favoriteIds = getFavoriteIds();
    return favoriteIds
        .map(id => places.find(place => place.id === id))
        .filter(Boolean);
}

function renderFavorites() {
    const savedPlaces = getSavedPlaces();
    favoritePlaces.innerHTML = "";
    plannerFavoriteCount.textContent =
        `${savedPlaces.length} ${savedPlaces.length === 1 ? "place" : "places"}`;
    favoriteEmpty.hidden = savedPlaces.length > 0;
    plannerForm.hidden = savedPlaces.length === 0 || plannerStep !== 2;
    continueToSettingsButton.hidden = savedPlaces.length === 0 || plannerStep !== 1;

    savedPlaces.forEach(place => {
        const image = placeImages[place.id];
        const item = document.createElement("article");
        item.className = "favorite-place-row";
        item.innerHTML = `
            <img src="${image.src}" alt="" loading="lazy">
            <div>
                <span>${place.category} · ${place.area}</span>
                <h3>${place.name}</h3>
                <p>${place.visitTime}h visit · ${place.budgetLabel}</p>
            </div>
            <button type="button" aria-label="Remove ${place.name} from favourites">Remove</button>`;
        item.querySelector("button").addEventListener("click", () => {
            toggleFavorite(place.id);
            localStorage.removeItem(ITINERARY_STORAGE_KEY);
            renderFavorites();
            itinerarySection.hidden = true;
        });
        favoritePlaces.appendChild(item);
    });
}

function setPlannerStep(step) {
    plannerStep = step;
    plannerSteps.forEach((item, index) => {
        item.classList.toggle("is-active", index + 1 === step);
        item.classList.toggle("is-complete", index + 1 < step);
    });
    renderFavorites();
    if (step === 2) {
        plannerForm.querySelector("#planDate")?.focus();
    }
}

continueToSettingsButton?.addEventListener("click", () => setPlannerStep(2));
backToFavouritesButton?.addEventListener("click", () => setPlannerStep(1));

function requestCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Location is not supported by this browser."));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }),
            () => reject(new Error("Your location could not be used. The plan will start from your first favourite.")),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    });
}

function orderByNearest(savedPlaces, startingPoint, preferredCategories = []) {
    const remaining = [...savedPlaces];
    const ordered = [];
    let currentPoint = startingPoint || placeCoordinates[remaining[0].id];

    while (remaining.length) {
        remaining.sort((a, b) => {
            const distanceA = calculateDistance(currentPoint, placeCoordinates[a.id]);
            const distanceB = calculateDistance(currentPoint, placeCoordinates[b.id]);
            const preferredA = preferredCategories.some(category =>
                a.category === category || a.tags.includes(category)
            );
            const preferredB = preferredCategories.some(category =>
                b.category === category || b.tags.includes(category)
            );
            return (distanceA - (preferredA ? 3 : 0)) -
                (distanceB - (preferredB ? 3 : 0));
        });
        const next = remaining.shift();
        ordered.push(next);
        currentPoint = placeCoordinates[next.id];
    }
    return ordered;
}

function formatTime(totalMinutes) {
    const normalized = totalMinutes % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return new Intl.DateTimeFormat("en-MY", {
        hour: "numeric",
        minute: "2-digit"
    }).format(new Date(2020, 0, 1, hours, minutes));
}

function directionsUrl(place, mode, origin) {
    const destination = placeCoordinates[place.id];
    const parameters = new URLSearchParams({
        api: "1",
        destination: `${destination.lat},${destination.lng}`,
        travelmode: mode,
        dir_action: "navigate"
    });
    if (origin) parameters.set("origin", `${origin.lat},${origin.lng}`);
    return `https://www.google.com/maps/dir/?${parameters}`;
}

function estimateTravelMinutes(distance, mode) {
    if (distance === 0) return 0;
    const transport = transportSettings[mode];
    return Math.max(
        5,
        Math.round(distance / transport.speed * 60 + transport.buffer)
    );
}

function getScheduleGuidance(place, arrival) {
    const guidance = place.bestVisit || "Check the venue before visiting";
    const text = guidance.toLowerCase();
    const hour = Math.floor((arrival % (24 * 60)) / 60);
    let warning = false;

    if (text.includes("morning") && !text.includes("evening") && hour >= 12) warning = true;
    if (text.includes("evening") && !text.includes("morning") && hour < 16) warning = true;
    if (text.includes("night") && hour < 18) warning = true;
    if (text.includes("daytime") && (hour < 8 || hour >= 18)) warning = true;

    return {
        text: `Best-visit guidance: ${guidance}. Verify current opening hours before travelling.`,
        warning
    };
}

function getBreakAfter(item, state, includeBreaks) {
    if (!includeBreaks) return null;

    const departureHour = (item.departure % (24 * 60)) / 60;
    if (!state.lunch && departureHour >= 11.5 && departureHour <= 14) {
        state.lunch = true;
        state.minutesSinceBreak = 0;
        return { type: "Lunch break", icon: "🍽️", minutes: 45 };
    }
    if (!state.dinner && departureHour >= 17.5 && departureHour <= 20) {
        state.dinner = true;
        state.minutesSinceBreak = 0;
        return { type: "Dinner break", icon: "🍜", minutes: 45 };
    }
    if (state.minutesSinceBreak >= 180) {
        state.minutesSinceBreak = 0;
        return { type: "Rest break", icon: "☕", minutes: 15 };
    }

    return null;
}

function recalculateRouteGeometry(itinerary) {
    let currentPoint = itinerary.startingPoint ||
        placeCoordinates[itinerary.scheduled[0]?.place.id];

    itinerary.scheduled.forEach((item, index) => {
        const destination = placeCoordinates[item.place.id];
        item.origin = currentPoint;
        item.distance = index === 0 && !itinerary.startingPoint
            ? 0
            : calculateDistance(currentPoint, destination);

        if (item.isAutoSuggested) {
            const suggestion = getTransportSuggestion(
                item.distance,
                itinerary.settings.availableModes
            );
            item.transportMode = suggestion.mode;
            item.suggestionReason = suggestion.reason;
        }

        currentPoint = destination;
    });
}

function recalculateItineraryTiming(itinerary) {
    const startParts = itinerary.settings.startTime.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    let elapsed = 0;
    const breakState = { lunch: false, dinner: false, minutesSinceBreak: 0 };

    itinerary.scheduled.forEach(item => {
        const resolved = resolveTransport(
            item.distance,
            item.transportMode || itinerary.settings.transport,
            itinerary.settings.availableModes
        );
        item.transportMode = resolved.mode;
        item.suggestionReason = item.suggestionReason || resolved.reason;
        item.visitMinutes = item.visitMinutes || (item.departure - item.arrival);
        item.travelMinutes = estimateTravelMinutes(item.distance, item.transportMode);
        item.arrival = startMinutes + elapsed + item.travelMinutes;
        item.departure = item.arrival + item.visitMinutes;
        breakState.minutesSinceBreak += item.travelMinutes + item.visitMinutes;
        item.breakAfter = getBreakAfter(
            item,
            breakState,
            itinerary.settings.includeBreaks
        );
        elapsed += item.travelMinutes + item.visitMinutes +
            (item.breakAfter?.minutes || 0);
        item.scheduleGuidance = getScheduleGuidance(item.place, item.arrival);
    });

    itinerary.elapsed = elapsed;
}

function buildItinerary(savedPlaces, settings, startingPoint) {
    const ordered = orderByNearest(
        savedPlaces,
        startingPoint,
        settings.preferredCategories
    );
    const maximumMinutes = settings.availableHours * 60;
    const startParts = settings.startTime.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const scheduled = [];
    const skipped = [];
    let elapsed = 0;
    let spent = 0;
    let currentPoint = startingPoint || placeCoordinates[ordered[0].id];
    const breakState = { lunch: false, dinner: false, minutesSinceBreak: 0 };

    ordered.forEach((place, index) => {
        const destination = placeCoordinates[place.id];
        const distance = index === 0 && !startingPoint
            ? 0
            : calculateDistance(currentPoint, destination);
        const transportSuggestion = resolveTransport(
            distance,
            settings.transport,
            settings.availableModes
        );
        const transportMode = transportSuggestion.mode;
        const travelMinutes = estimateTravelMinutes(distance, transportMode);
        const paceBuffer = settings.pace === "relaxed" ? 15 : 0;
        const visitMinutes = Math.round(place.visitTime * 60) + paceBuffer;
        const arrival = startMinutes + elapsed + travelMinutes;
        const draftItem = {
            arrival,
            departure: arrival + visitMinutes
        };
        const nextBreakState = {
            ...breakState,
            minutesSinceBreak:
                breakState.minutesSinceBreak + travelMinutes + visitMinutes
        };
        const breakAfter = getBreakAfter(
            draftItem,
            nextBreakState,
            settings.includeBreaks
        );
        const requiredMinutes = travelMinutes + visitMinutes +
            (breakAfter?.minutes || 0);
        if (
            elapsed + requiredMinutes > maximumMinutes ||
            (settings.maximumBudget > 0 && spent + place.price > settings.maximumBudget)
        ) {
            skipped.push(place);
            return;
        }

        scheduled.push({
            place,
            distance,
            travelMinutes,
            arrival,
            departure: arrival + visitMinutes,
            origin: currentPoint,
            visitMinutes,
            transportMode,
            isAutoSuggested: settings.transport === "auto",
            suggestionReason: transportSuggestion.reason,
            breakAfter
        });
        Object.assign(breakState, nextBreakState);
        elapsed += requiredMinutes;
        spent += place.price;
        currentPoint = destination;
    });

    return { settings, scheduled, skipped, elapsed, startingPoint };
}

function initializeItineraryMap() {
    if (itineraryMap || typeof L === "undefined") return;

    itineraryMap = L.map("itineraryMap", { scrollWheelZoom: false })
        .setView([3.1478, 101.6953], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap contributors</a>"
    }).addTo(itineraryMap);
    itineraryMapLayer = L.layerGroup().addTo(itineraryMap);
}

function renderItineraryMap(itinerary) {
    initializeItineraryMap();
    if (!itineraryMap) {
        document.querySelector(".itinerary-map-panel").hidden = true;
        return;
    }

    itineraryMapLayer.clearLayers();
    const points = itinerary.scheduled.map(item => {
        const coordinates = placeCoordinates[item.place.id];
        return [coordinates.lat, coordinates.lng];
    });

    points.forEach((point, index) => {
        const markerIcon = L.divIcon({
            className: "itinerary-numbered-marker",
            html: `<span>${index + 1}</span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        L.marker(point, { icon: markerIcon })
            .bindPopup(`<strong>${index + 1}. ${itinerary.scheduled[index].place.name}</strong>`)
            .addTo(itineraryMapLayer);
    });

    if (points.length > 1) {
        L.polyline(points, {
            color: "#0f766e",
            weight: 4,
            opacity: 0.72,
            dashArray: "8 7"
        }).addTo(itineraryMapLayer);
    }

    if (points.length) {
        itineraryMap.fitBounds(points, { padding: [34, 34], maxZoom: 15 });
        window.setTimeout(() => itineraryMap.invalidateSize(), 0);
    }
}

function moveItineraryStop(itinerary, fromIndex, direction) {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= itinerary.scheduled.length) return;

    const [movedItem] = itinerary.scheduled.splice(fromIndex, 1);
    itinerary.scheduled.splice(toIndex, 0, movedItem);
    recalculateRouteGeometry(itinerary);
    itinerary.aiExplanation = null;
    itinerary.aiExplanationModel = null;
    generatedItinerary = itinerary;
    saveItineraryButton.textContent = "Save itinerary";
    renderItinerary(itinerary, false);
    plannerMessage.textContent = itinerary.elapsed > itinerary.settings.availableHours * 60
        ? "Stop moved, but the new order exceeds your available time. Try another order or remove a place."
        : "Stop moved. Travel distances and arrival times have been recalculated.";
}

async function generateAIExplanation(itinerary) {
    aiExplanationPanel.hidden = false;
    aiItineraryExplanation.textContent = "Generating a grounded explanation from the completed plan…";
    refreshAIExplanationButton.disabled = true;

    try {
        const response = await fetch("/api/ai/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itinerary })
        });
        if (!response.ok) throw new Error("Local AI is unavailable.");
        const result = await response.json();
        itinerary.aiExplanation = result.explanation;
        itinerary.aiExplanationModel = result.model;
        aiItineraryExplanation.textContent = `${result.explanation} Generated locally with ${result.model}.`;
        saveItineraryButton.textContent = "Save itinerary";
    }
    catch {
        itinerary.aiExplanation = null;
        itinerary.aiExplanationModel = null;
        aiItineraryExplanation.textContent =
            "Local AI explanation is unavailable. The itinerary was still generated by the deterministic route engine.";
    }
    finally {
        refreshAIExplanationButton.disabled = false;
    }
}

function resetItinerarySurvey() {
    if (!itinerarySurvey) return;
    itinerarySurvey.hidden = false;
    surveyThanks.hidden = true;
    surveyButtons.hidden = false;
    surveyButtons.querySelectorAll("button").forEach(button => {
        button.classList.remove("survey-answer-selected");
        button.disabled = false;
    });
}

async function submitSurveyResponse(helpful, selectedButton) {
    surveyButtons.querySelectorAll("button").forEach(button => {
        button.disabled = true;
        button.classList.toggle("survey-answer-selected", button === selectedButton);
    });

    try {
        await fetch("/api/survey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                helpful,
                sessionId: getOrCreateSessionId(),
                placeCount: generatedItinerary?.scheduled?.length ?? null
            })
        });
    }
    catch {
        // Best-effort: even if the request fails, don't block the user —
        // they've already given their answer visually.
    }

    surveyThanks.hidden = false;
}

if (surveyButtons) {
    surveyButtons.addEventListener("click", event => {
        const button = event.target.closest("button[data-survey-answer]");
        if (!button) return;
        submitSurveyResponse(button.dataset.surveyAnswer === "yes", button);
    });
}

function renderItinerary(itinerary, scrollToPlan = true) {
    itinerary.settings.availableModes = itinerary.settings.availableModes || ["walking", "transit"];
    recalculateItineraryTiming(itinerary);
    itineraryTimeline.innerHTML = "";
    const totalCost = itinerary.scheduled.reduce((sum, item) => sum + item.place.price, 0);
    const totalDistance = itinerary.scheduled.reduce((sum, item) => sum + item.distance, 0);

    itineraryTitle.textContent = `Kuala Lumpur · ${itinerary.settings.date}`;
    itinerarySummary.innerHTML = `
        <div><strong>${itinerary.scheduled.length}</strong><span>places</span></div>
        <div><strong>${(itinerary.elapsed / 60).toFixed(1)}h</strong><span>planned</span></div>
        <div><strong>${totalDistance.toFixed(1)} km</strong><span>estimated travel</span></div>
        <div><strong>RM${totalCost}</strong><span>estimated spend</span></div>`;
    if (itinerary.aiExplanation) {
        aiExplanationPanel.hidden = false;
        aiItineraryExplanation.textContent = itinerary.aiExplanationModel
            ? `${itinerary.aiExplanation} Generated locally with ${itinerary.aiExplanationModel}.`
            : itinerary.aiExplanation;
    }
    else {
        aiExplanationPanel.hidden = true;
    }
    renderItineraryMap(itinerary);
    resetItinerarySurvey();

    itinerary.scheduled.forEach((item, index) => {
        const entry = document.createElement("li");
        const selectedTransport = transportSettings[item.transportMode];
        const travelText = item.travelMinutes
            ? `${selectedTransport.icon} ${selectedTransport.label} · ${item.travelMinutes} min · ${item.distance.toFixed(1)} km` +
                (item.isAutoSuggested ? ` <span class="suggested-badge">Suggested</span>` : "")
            : "Start here";
        const transportOptions = Object.entries(transportSettings)
            .filter(([value]) =>
                itinerary.settings.availableModes.includes(value) ||
                value === item.transportMode
            )
            .map(([value, option]) => `
                <option value="${value}"${value === item.transportMode ? " selected" : ""}>
                    ${option.icon} ${option.label}
                </option>`)
            .join("");
        const journeyControls = item.travelMinutes
            ? `<div class="itinerary-journey-controls">
                    <label for="journey-transport-${index}">Travel to this place</label>
                    <p class="transport-reason">${item.suggestionReason}</p>
                    <div>
                        <select id="journey-transport-${index}" class="journey-transport">
                            ${transportOptions}
                        </select>
                        <a href="${directionsUrl(item.place, item.transportMode, item.origin)}"
                           class="journey-directions"
                           target="_blank" rel="noopener noreferrer">Open route ↗</a>
                    </div>
                </div>`
            : "";
        const guidanceClass = item.scheduleGuidance.warning
            ? "schedule-guidance warning"
            : "schedule-guidance";
        const breakMarkup = item.breakAfter
            ? `<div class="timeline-break">
                    <span>${item.breakAfter.icon}</span>
                    <div><strong>${item.breakAfter.type}</strong><p>${item.breakAfter.minutes} minutes added automatically. Adjust the plan settings to remove breaks.</p></div>
                </div>`
            : "";
        entry.innerHTML = `
            <time>${formatTime(item.arrival)}</time>
            <div class="timeline-marker">${index + 1}</div>
            <article>
                <span class="journey-summary">${travelText}</span>
                <h3>${item.place.name}</h3>
                <p>${item.place.area} · Visit until ${formatTime(item.departure)}</p>
                <p class="${guidanceClass}">${item.scheduleGuidance.warning ? "⚠ " : "🕒 "}${item.scheduleGuidance.text}</p>
                <div class="stop-order-controls" aria-label="Change position of ${item.place.name}">
                    <button class="move-stop-up" type="button"${index === 0 ? " disabled" : ""}>↑ Earlier</button>
                    <button class="move-stop-down" type="button"${index === itinerary.scheduled.length - 1 ? " disabled" : ""}>↓ Later</button>
                </div>
                ${journeyControls}
                ${breakMarkup}
            </article>`;

        const journeySelect = entry.querySelector(".journey-transport");
        if (journeySelect) {
            journeySelect.addEventListener("change", () => {
                item.transportMode = journeySelect.value;
                item.isAutoSuggested = false;
                item.suggestionReason = `Changed by you to ${transportSettings[item.transportMode].label}.`;
                itinerary.aiExplanation = null;
                itinerary.aiExplanationModel = null;
                generatedItinerary = itinerary;
                saveItineraryButton.textContent = "Save itinerary";
                renderItinerary(itinerary, false);
                const exceedsAvailableTime =
                    itinerary.elapsed > itinerary.settings.availableHours * 60;
                plannerMessage.textContent = exceedsAvailableTime
                    ? "Journey updated. The new transport choices exceed your available time, so consider a faster option or remove a place."
                    : "Journey updated. Later arrival times have been recalculated.";
            });
        }
        entry.querySelector(".move-stop-up").addEventListener("click", () => {
            moveItineraryStop(itinerary, index, -1);
        });
        entry.querySelector(".move-stop-down").addEventListener("click", () => {
            moveItineraryStop(itinerary, index, 1);
        });
        itineraryTimeline.appendChild(entry);
    });

    const skippedForTime = itinerary.skipped.length
        ? `<p><strong>Not enough time or budget for:</strong> ${itinerary.skipped.map(place => place.name).join(", ")}.</p>`
        : "";
    unscheduledPlaces.hidden = !skippedForTime;
    unscheduledPlaces.innerHTML = skippedForTime;
    itinerarySection.hidden = false;
    if (scrollToPlan) {
        itinerarySection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

plannerForm.addEventListener("submit", async event => {
    event.preventDefault();
    const savedPlaces = getSavedPlaces();
    if (!savedPlaces.length) return;

    const formData = new FormData(plannerForm);
    const availableModes = formData.getAll("availableTransport");
    const selectedTransport = formData.get("transport");

    if (!availableModes.length) {
        plannerMessage.textContent = "Select at least one transport method available to you.";
        return;
    }
    if (selectedTransport !== "auto" && !availableModes.includes(selectedTransport)) {
        plannerMessage.textContent = "Your primary transport must also be selected as an available method.";
        return;
    }

    const settings = {
        date: formData.get("date"),
        startTime: formData.get("startTime"),
        availableHours: Number(formData.get("availableHours")),
        transport: selectedTransport,
        availableModes,
        includeBreaks: formData.get("includeBreaks") === "on",
        maximumBudget: Number(formData.get("maximumBudget")),
        preferredCategories: assistantState.preferredCategories,
        pace: assistantState.pace
    };
    let startingPoint = null;
    plannerMessage.textContent = "Building a practical route…";

    if (document.getElementById("startFromLocation").checked) {
        try {
            startingPoint = await requestCurrentLocation();
        }
        catch (error) {
            plannerMessage.textContent = error.message;
        }
    }

    generatedItinerary = buildItinerary(savedPlaces, settings, startingPoint);
    saveItineraryButton.textContent = "Save itinerary";
    renderItinerary(generatedItinerary);
    setPlannerStep(3);
    if (!plannerMessage.textContent.includes("could not")) {
        const exceedsAvailableTime =
            generatedItinerary.elapsed > settings.availableHours * 60;
        plannerMessage.textContent = exceedsAvailableTime
            ? "The generated route exceeds your available time after adding breaks. Remove a stop, disable breaks, or add more time."
            : settings.transport === "auto"
            ? "Route generated with automatic transport suggestions based on journey distance."
            : "Route generated using distance, visit time and your selected transport.";
    }
    if (generatedItinerary.scheduled.length) {
        await generateAIExplanation(generatedItinerary);
    }
});

function createItineraryText(itinerary) {
    const lines = [
        `JomExplore itinerary: ${itinerary.settings.date}`,
        `Start: ${itinerary.settings.startTime}`,
        ""
    ];

    itinerary.scheduled.forEach((item, index) => {
        lines.push(
            `${index + 1}. ${formatTime(item.arrival)} | ${item.place.name}`,
            `   ${transportSettings[item.transportMode].label}, ${item.travelMinutes} min travel`,
            `   Visit until ${formatTime(item.departure)}`
        );
        if (item.breakAfter) {
            lines.push(`   ${item.breakAfter.type}: ${item.breakAfter.minutes} min`);
        }
    });

    lines.push("", "Travel times and schedule guidance are estimates. Verify live routes and venue hours before travelling.");
    return lines.join("\n");
}

async function copyItinerarySummary() {
    if (!generatedItinerary) return;
    const summary = createItineraryText(generatedItinerary);

    try {
        await navigator.clipboard.writeText(summary);
        copyItineraryButton.textContent = "✓ Copied";
    }
    catch {
        const textarea = document.createElement("textarea");
        textarea.value = summary;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        copyItineraryButton.textContent = "✓ Copied";
    }

    window.setTimeout(() => {
        copyItineraryButton.textContent = "Copy summary";
    }, 1800);
}

function getEditingItineraryRecord() {
    const editingId = localStorage.getItem(EDITING_ITINERARY_STORAGE_KEY);
    return getSavedItineraries().find(record => record.id === editingId) || null;
}

function openSaveItineraryDialog() {
    if (!generatedItinerary) return;
    const editingRecord = getEditingItineraryRecord();
    const date = generatedItinerary.settings?.date || "Kuala Lumpur day";
    saveDialogTitle.textContent = editingRecord
        ? "Update saved itinerary"
        : "Name this itinerary";
    confirmSaveItineraryButton.textContent = editingRecord
        ? "Update itinerary"
        : "Save itinerary";
    itineraryNameInput.value = editingRecord?.name || `Kuala Lumpur · ${date}`;
    saveItineraryDialog.showModal();
    itineraryNameInput.focus();
    itineraryNameInput.select();
}

saveItineraryButton.addEventListener("click", openSaveItineraryDialog);
closeSaveDialogButton.addEventListener("click", () => saveItineraryDialog.close());
cancelSaveItineraryButton.addEventListener("click", () => saveItineraryDialog.close());
saveItineraryDialog.addEventListener("click", event => {
    if (event.target === saveItineraryDialog) saveItineraryDialog.close();
});
saveItineraryForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!generatedItinerary) return;
    const editingRecord = getEditingItineraryRecord();
    const record = saveItineraryRecord(
        generatedItinerary,
        itineraryNameInput.value,
        editingRecord?.id
    );
    localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(generatedItinerary));
    localStorage.setItem(EDITING_ITINERARY_STORAGE_KEY, record.id);
    trackEvent("itinerary_saved", { placeCount: generatedItinerary.scheduled.length });
    saveItineraryDialog.close();
    saveItineraryButton.textContent = "✓ Itinerary saved";
    plannerMessage.textContent = `Saved as “${record.name}”. `;
    const savedPlansLink = document.createElement("a");
    savedPlansLink.href = "saved-itineraries.html";
    savedPlansLink.textContent = "View Saved Itineraries";
    plannerMessage.append(savedPlansLink, ".");
});

copyItineraryButton.addEventListener("click", copyItinerarySummary);
printItineraryButton.addEventListener("click", () => window.print());
refreshAIExplanationButton.addEventListener("click", () => {
    if (generatedItinerary) generateAIExplanation(generatedItinerary);
});

async function checkAIProviderStatus() {
    try {
        const response = await fetch("/api/ai/status");
        if (!response.ok) throw new Error("AI status unavailable");
        const status = await response.json();
        if (status.available) {
            aiProviderStatus.textContent = `Local AI · ${status.model}`;
            aiProviderStatus.classList.add("available");
            return;
        }
    }
    catch {
        // Static hosting or a stopped Ollama service uses the parser fallback.
    }

    aiProviderStatus.textContent = "Prototype fallback";
    aiProviderStatus.classList.remove("available");
}

applyAssistantButton.addEventListener("click", applyAssistantRequest);
document.querySelectorAll(".assistant-examples button").forEach(button => {
    button.addEventListener("click", () => {
        assistantPrompt.value = button.textContent;
        applyAssistantRequest();
    });
});

const today = new Date();
const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
].join("-");
document.getElementById("planDate").min = localDate;
document.getElementById("planDate").value = localDate;
renderFavorites();
checkAIProviderStatus();

try {
    const savedItinerary = JSON.parse(
        localStorage.getItem(ITINERARY_STORAGE_KEY)
    );
    if (savedItinerary?.scheduled?.length && getSavedPlaces().length) {
        generatedItinerary = savedItinerary;
        plannerStep = 3;
        renderItinerary(savedItinerary, false);
        saveItineraryButton.textContent = "✓ Itinerary saved";
    }
}
catch {
    localStorage.removeItem(ITINERARY_STORAGE_KEY);
}
