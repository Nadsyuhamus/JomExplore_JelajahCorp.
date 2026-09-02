// Shared, lightweight analytics helper used across every page.
// No external tools -- just POSTs small events to our own /api/event
// endpoint (see server.mjs), tagged with a per-browser session id so
// you can tell one test participant's actions apart from another's.

const JOMEXPLORE_SESSION_KEY = "jomExploreSessionId";

function createJomExploreId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreateSessionId() {
    let sessionId = localStorage.getItem(JOMEXPLORE_SESSION_KEY);
    if (!sessionId) {
        sessionId = createJomExploreId();
        localStorage.setItem(JOMEXPLORE_SESSION_KEY, sessionId);
    }
    return sessionId;
}

// meta is any small extra JSON-safe object, e.g. { placeCount: 4 }.
function trackEvent(event, meta = {}) {
    const payload = JSON.stringify({
        event,
        sessionId: getOrCreateSessionId(),
        ...meta
    });

    // sendBeacon survives page navigation/unload, which matters for clicks
    // on links (like "Start Exploring") that immediately leave the page.
    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: "application/json" });
            const sent = navigator.sendBeacon("/api/event", blob);
            if (sent) return;
        }
    }
    catch {
        // Fall through to fetch below.
    }

    fetch("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
    }).catch(() => {
        // Best-effort only -- never block the user's action on this.
    });
}

// Anything with data-track-event="some_name" is tracked automatically on
// click, anywhere in the app -- no extra wiring needed per page.
document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-track-event]");
    if (!trigger) return;
    trackEvent(trigger.dataset.trackEvent);
});

window.trackEvent = trackEvent;
window.getOrCreateSessionId = getOrCreateSessionId;
