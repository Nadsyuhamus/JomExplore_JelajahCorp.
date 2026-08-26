const savedItineraryGrid = document.getElementById("savedItineraryGrid");
const savedToolbar = document.getElementById("savedToolbar");
const savedSearch = document.getElementById("savedSearch");
const savedSort = document.getElementById("savedSort");
const savedResultCount = document.getElementById("savedResultCount");
const savedEmpty = document.getElementById("savedEmpty");
const savedSearchEmpty = document.getElementById("savedSearchEmpty");
const resetSavedSearch = document.getElementById("resetSavedSearch");
const createItinerary = document.getElementById("createItinerary");
const savedPlanDialog = document.getElementById("savedPlanDialog");
const savedPlanTitle = document.getElementById("savedPlanTitle");
const savedPlanMeta = document.getElementById("savedPlanMeta");
const savedPlanSummary = document.getElementById("savedPlanSummary");
const savedPlanExplanation = document.getElementById("savedPlanExplanation");
const savedPlanTimeline = document.getElementById("savedPlanTimeline");
const closeSavedPlan = document.getElementById("closeSavedPlan");
const dialogCopyPlan = document.getElementById("dialogCopyPlan");
const dialogPrintPlan = document.getElementById("dialogPrintPlan");
const dialogEditPlan = document.getElementById("dialogEditPlan");
const savedToast = document.getElementById("savedToast");

let activeRecordId = null;
let toastTimeout = null;

const savedTransportSettings = {
    transit: { label: "Public transport + walking", icon: "🚌" },
    walking: { label: "Walking", icon: "🚶" },
    driving: { label: "Driving", icon: "🚗" },
    bicycling: { label: "Cycling", icon: "🚲" }
};

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatPlanDate(value, options = { dateStyle: "long" }) {
    if (!value) return "Date not set";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-MY", options).format(date);
}

function formatSavedAt(value) {
    if (!value) return "Saved previously";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Saved previously";
    return `Saved ${new Intl.DateTimeFormat("en-MY", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date)}`;
}

function formatClock(totalMinutes) {
    const normalized = totalMinutes % (24 * 60);
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return new Intl.DateTimeFormat("en-MY", {
        hour: "numeric",
        minute: "2-digit"
    }).format(new Date(2020, 0, 1, hours, minutes));
}

function getRecordStats(record) {
    const itinerary = record.itinerary;
    const scheduled = itinerary?.scheduled || [];
    return {
        places: scheduled.length,
        hours: Number(itinerary?.elapsed || 0) / 60,
        distance: scheduled.reduce((sum, item) => sum + Number(item.distance || 0), 0),
        cost: scheduled.reduce((sum, item) => sum + Number(item.place?.price || 0), 0)
    };
}

function showToast(message) {
    savedToast.textContent = message;
    savedToast.hidden = false;
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
        savedToast.hidden = true;
    }, 2200);
}

function createItineraryText(record) {
    const itinerary = record.itinerary;
    const lines = [
        record.name,
        `Date: ${formatPlanDate(itinerary.settings?.date)}`,
        `Start: ${itinerary.settings?.startTime || "Not set"}`,
        ""
    ];
    (itinerary.scheduled || []).forEach((item, index) => {
        const transport = savedTransportSettings[item.transportMode] || {
            label: item.transportMode || "Transport",
            icon: "↗"
        };
        lines.push(
            `${index + 1}. ${formatClock(item.arrival)} | ${item.place.name}`,
            `   ${transport.label} · ${item.travelMinutes || 0} min travel`,
            `   Visit until ${formatClock(item.departure)}`
        );
        if (item.breakAfter) {
            lines.push(`   ${item.breakAfter.type}: ${item.breakAfter.minutes} min`);
        }
    });
    lines.push("", "Travel times are estimates. Verify live routes and venue information before travelling.");
    return lines.join("\n");
}

async function copyRecord(record) {
    const text = createItineraryText(record);
    try {
        await navigator.clipboard.writeText(text);
    }
    catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
    }
    showToast("Itinerary summary copied");
}

function openRecordForEditing(record) {
    const placeIds = (record.itinerary.scheduled || [])
        .map(item => item.place?.id)
        .filter(Boolean);
    const favoriteIds = getFavoriteIds();
    localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify([...new Set([...favoriteIds, ...placeIds])])
    );
    localStorage.setItem(
        ITINERARY_STORAGE_KEY,
        JSON.stringify(record.itinerary)
    );
    localStorage.setItem(EDITING_ITINERARY_STORAGE_KEY, record.id);
    window.location.href = "favorites.html";
}

function directionsUrl(item) {
    const destination = item.place?.coordinates;
    const parameters = new URLSearchParams({
        api: "1",
        destination: destination
            ? `${destination.lat},${destination.lng}`
            : item.place?.name || "Kuala Lumpur",
        travelmode: item.transportMode || "transit",
        dir_action: "navigate"
    });
    if (item.origin?.lat && item.origin?.lng) {
        parameters.set("origin", `${item.origin.lat},${item.origin.lng}`);
    }
    return `https://www.google.com/maps/dir/?${parameters}`;
}

function renderPlanDialog(record) {
    const itinerary = record.itinerary;
    const stats = getRecordStats(record);
    activeRecordId = record.id;
    savedPlanTitle.textContent = record.name;
    savedPlanMeta.textContent = `${formatPlanDate(itinerary.settings?.date)} · Start ${itinerary.settings?.startTime || "not set"}`;
    savedPlanSummary.innerHTML = `
        <div><strong>${stats.places}</strong><span>places</span></div>
        <div><strong>${stats.hours.toFixed(1)}h</strong><span>planned</span></div>
        <div><strong>${stats.distance.toFixed(1)} km</strong><span>estimated travel</span></div>
        <div><strong>RM${stats.cost}</strong><span>estimated spend</span></div>`;
    savedPlanExplanation.hidden = !itinerary.aiExplanation;
    savedPlanExplanation.textContent = itinerary.aiExplanation || "";
    savedPlanTimeline.innerHTML = "";

    (itinerary.scheduled || []).forEach((item, index) => {
        const transport = savedTransportSettings[item.transportMode] || {
            label: item.transportMode || "Transport",
            icon: "↗"
        };
        const entry = document.createElement("li");
        entry.innerHTML = `
            <time>${formatClock(item.arrival)}</time>
            <span class="saved-timeline-marker">${index + 1}</span>
            <div>
                <span>${transport.icon} ${escapeHtml(transport.label)} · ${Number(item.travelMinutes || 0)} min</span>
                <h3>${escapeHtml(item.place?.name || "Saved place")}</h3>
                <p>${escapeHtml(item.place?.area || "Kuala Lumpur")} · Visit until ${formatClock(item.departure)}</p>
                ${item.travelMinutes ? `<a href="${directionsUrl(item)}" target="_blank" rel="noopener noreferrer">Open route ↗</a>` : ""}
            </div>`;
        savedPlanTimeline.appendChild(entry);
    });
    savedPlanDialog.showModal();
}

function closeOpenMenus() {
    document.querySelectorAll(".saved-card-menu[open]")
        .forEach(menu => menu.removeAttribute("open"));
}

function itineraryCard(record) {
    const itinerary = record.itinerary;
    const stats = getRecordStats(record);
    const places = (itinerary.scheduled || []).map(item => item.place?.name).filter(Boolean);
    const placePills = places.slice(0, 3)
        .map(place => `<span>${escapeHtml(place)}</span>`)
        .join("");
    const morePlaces = places.length > 3
        ? `<span class="more">+${places.length - 3} more</span>`
        : "";

    return `
        <article class="saved-itinerary-card" data-record-id="${escapeHtml(record.id)}">
            <header>
                <div>
                    <p class="saved-card-date">▣ ${escapeHtml(formatPlanDate(itinerary.settings?.date, { dateStyle: "medium" }))}</p>
                    <h2>${escapeHtml(record.name)}</h2>
                </div>
                <details class="saved-card-menu">
                    <summary aria-label="More actions for ${escapeHtml(record.name)}">•••</summary>
                    <div>
                        <button type="button" data-action="rename">Rename</button>
                        <button type="button" data-action="duplicate">Duplicate</button>
                        <button type="button" data-action="copy">Copy summary</button>
                        <button type="button" data-action="print">Print</button>
                        <button type="button" data-action="delete" class="danger">Delete</button>
                    </div>
                </details>
            </header>
            <div class="saved-place-pills">${placePills}${morePlaces}</div>
            <dl class="saved-card-stats">
                <div><dt>Places</dt><dd>${stats.places}</dd></div>
                <div><dt>Planned</dt><dd>${stats.hours.toFixed(1)}h</dd></div>
                <div><dt>Distance</dt><dd>${stats.distance.toFixed(1)} km</dd></div>
                <div><dt>Est. cost</dt><dd>RM${stats.cost}</dd></div>
            </dl>
            <footer>
                <span>${escapeHtml(formatSavedAt(record.updatedAt || record.savedAt))}</span>
                <div>
                    <button type="button" class="secondary-button" data-action="edit">Continue editing</button>
                    <button type="button" class="primary-button" data-action="view">View plan</button>
                </div>
            </footer>
        </article>`;
}

function getFilteredRecords() {
    const query = savedSearch.value.trim().toLowerCase();
    const records = getSavedItineraries().filter(record => {
        const places = (record.itinerary?.scheduled || [])
            .map(item => item.place?.name || "")
            .join(" ");
        return `${record.name} ${places}`.toLowerCase().includes(query);
    });

    return records.sort((a, b) => {
        if (savedSort.value === "name") return a.name.localeCompare(b.name);
        if (savedSort.value === "date") {
            return String(a.itinerary?.settings?.date || "9999")
                .localeCompare(String(b.itinerary?.settings?.date || "9999"));
        }
        return new Date(b.updatedAt || b.savedAt || 0) -
            new Date(a.updatedAt || a.savedAt || 0);
    });
}

function renderSavedItineraries() {
    const allRecords = getSavedItineraries();
    const records = getFilteredRecords();
    savedItineraryGrid.innerHTML = records.map(itineraryCard).join("");
    savedToolbar.hidden = allRecords.length === 0;
    savedEmpty.hidden = allRecords.length > 0;
    savedSearchEmpty.hidden = allRecords.length === 0 || records.length > 0;
    savedItineraryGrid.hidden = records.length === 0;
    savedResultCount.hidden = allRecords.length === 0;
    savedResultCount.textContent = `${records.length} ${records.length === 1 ? "saved itinerary" : "saved itineraries"}`;
}

savedItineraryGrid.addEventListener("click", async event => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const card = actionButton.closest("[data-record-id]");
    const record = getSavedItineraries().find(item => item.id === card?.dataset.recordId);
    if (!record) return;
    const action = actionButton.dataset.action;

    if (action === "view") renderPlanDialog(record);
    if (action === "edit") openRecordForEditing(record);
    if (action === "copy") await copyRecord(record);
    if (action === "rename") {
        const nextName = window.prompt("Rename itinerary", record.name);
        if (nextName?.trim()) {
            renameItineraryRecord(record.id, nextName);
            renderSavedItineraries();
            showToast("Itinerary renamed");
        }
    }
    if (action === "duplicate") {
        duplicateItineraryRecord(record.id);
        renderSavedItineraries();
        showToast("Itinerary duplicated");
    }
    if (action === "delete") {
        const shouldDelete = window.confirm(`Delete “${record.name}”? This cannot be undone.`);
        if (shouldDelete) {
            deleteItineraryRecord(record.id);
            renderSavedItineraries();
            showToast("Itinerary deleted");
        }
    }
    if (action === "print") {
        renderPlanDialog(record);
        document.body.classList.add("printing-saved-plan");
        window.print();
    }
    closeOpenMenus();
});

savedSearch.addEventListener("input", renderSavedItineraries);
savedSort.addEventListener("change", renderSavedItineraries);
resetSavedSearch.addEventListener("click", () => {
    savedSearch.value = "";
    renderSavedItineraries();
    savedSearch.focus();
});
createItinerary.addEventListener("click", () => {
    localStorage.removeItem(ITINERARY_STORAGE_KEY);
    localStorage.removeItem(EDITING_ITINERARY_STORAGE_KEY);
});
closeSavedPlan.addEventListener("click", () => savedPlanDialog.close());
savedPlanDialog.addEventListener("click", event => {
    if (event.target === savedPlanDialog) savedPlanDialog.close();
});
dialogEditPlan.addEventListener("click", () => {
    const record = getSavedItineraries().find(item => item.id === activeRecordId);
    if (record) openRecordForEditing(record);
});
dialogCopyPlan.addEventListener("click", () => {
    const record = getSavedItineraries().find(item => item.id === activeRecordId);
    if (record) copyRecord(record);
});
dialogPrintPlan.addEventListener("click", () => {
    document.body.classList.add("printing-saved-plan");
    window.print();
});
window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing-saved-plan");
});
window.addEventListener("storage", renderSavedItineraries);
window.addEventListener("saveditinerarieschange", renderSavedItineraries);
document.addEventListener("click", event => {
    if (!event.target.closest(".saved-card-menu")) closeOpenMenus();
});

renderSavedItineraries();
