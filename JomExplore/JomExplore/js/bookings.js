const bookingsStats = document.getElementById("bookingsStats");
const bookingsTotalCount = document.getElementById("bookingsTotalCount");
const bookingsUpcomingCount = document.getElementById("bookingsUpcomingCount");
const bookingsConfirmedCount = document.getElementById("bookingsConfirmedCount");
const bookingsContent = document.getElementById("bookingsContent");
const upcomingBookingsSection = document.getElementById("upcomingBookingsSection");
const upcomingBookings = document.getElementById("upcomingBookings");
const upcomingBookingsCount = document.getElementById("upcomingBookingsCount");
const pastBookingsSection = document.getElementById("pastBookingsSection");
const pastBookings = document.getElementById("pastBookings");
const pastBookingsCount = document.getElementById("pastBookingsCount");
const bookingsEmpty = document.getElementById("bookingsEmpty");

function escapeBookingHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function bookingDate(value) {
    if (!value) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatBookingDate(value, options = { dateStyle: "medium" }) {
    const date = bookingDate(value);
    return date
        ? new Intl.DateTimeFormat("en-MY", options).format(date)
        : "Date to be confirmed";
}

function formatBookingMoney(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
        ? `RM${amount.toFixed(2)}`
        : "Calculated at booking";
}

function todayAtMidday() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
}

function bookingDisplayState(booking) {
    const status = String(booking?.bookingStatus || "").toLowerCase();
    if (["cancelled", "canceled"].includes(status)) {
        return { key: "cancelled", label: "Booking cancelled", className: "is-cancelled" };
    }

    const checkOut = bookingDate(booking?.checkOut);
    if (status === "completed" || (checkOut && checkOut < todayAtMidday())) {
        return { key: "completed", label: "Stay completed", className: "is-completed" };
    }

    return { key: "confirmed", label: "Booking confirmed", className: "is-confirmed" };
}

function bookingDateRange(booking) {
    if (!booking?.checkIn || !booking?.checkOut) return "Dates to be confirmed";
    return `${formatBookingDate(booking.checkIn)} – ${formatBookingDate(booking.checkOut)}`;
}

function bookingCard(booking) {
    const state = bookingDisplayState(booking);
    const bookingKey = booking.confirmationCode || booking.id || "booking";
    const guests = Number(booking.guests) || booking.guests || 1;
    const guestLabel = `${guests} ${Number(guests) === 1 ? "guest" : "guests"}`;
    const image = booking.image
        ? `<img src="${escapeBookingHtml(booking.image)}" alt="${escapeBookingHtml(booking.imageAlt || `${booking.name || "Hotel"} accommodation`)}" loading="lazy">`
        : `<div class="booking-record-image-placeholder" aria-hidden="true">🏨</div>`;
    const cancelAction = state.key === "confirmed"
        ? `<button type="button" class="secondary-button" data-booking-action="cancel">Cancel booking</button>`
        : "";
    const primaryAction = state.key === "cancelled"
        ? `<a href="results.html" class="primary-button">Book another stay</a>`
        : `<a href="favorites.html" class="primary-button">View itinerary</a>`;

    return `
        <article class="booking-record-card ${state.className}" data-booking-key="${escapeBookingHtml(bookingKey)}">
            <div class="booking-record-media">
                ${image}
                <span class="booking-record-status">${escapeBookingHtml(state.label)}</span>
            </div>
            <div class="booking-record-body">
                <header class="booking-record-heading">
                    <div>
                        <p class="section-label">HOTEL RESERVATION</p>
                        <h3>${escapeBookingHtml(booking.name || "Accommodation stay")}</h3>
                        <p class="booking-record-location">${escapeBookingHtml(booking.area || booking.location || "Kuala Lumpur")}</p>
                    </div>
                    <div class="booking-confirmation-code">
                        <span>Confirmation code</span>
                        <strong>${escapeBookingHtml(booking.confirmationCode || "Saved locally")}</strong>
                    </div>
                </header>

                <dl class="booking-record-details">
                    <div><dt>Check-in</dt><dd>${escapeBookingHtml(formatBookingDate(booking.checkIn))}</dd><small>From 3:00 PM</small></div>
                    <div><dt>Check-out</dt><dd>${escapeBookingHtml(formatBookingDate(booking.checkOut))}</dd><small>Before 12:00 PM</small></div>
                    <div><dt>Room</dt><dd>${escapeBookingHtml(booking.roomType || "Selected room")}</dd><small>${escapeBookingHtml(booking.roomDetails || "Accommodation room")}</small></div>
                    <div><dt>Guests</dt><dd>${escapeBookingHtml(guestLabel)}</dd><small>Primary guest: ${escapeBookingHtml(booking.guestName || "Not provided")}</small></div>
                </dl>

                <footer class="booking-record-footer">
                    <div class="booking-record-total">
                        <span>Total stay value</span>
                        <strong>${escapeBookingHtml(formatBookingMoney(booking.totalAmount))}</strong>
                        <small>${escapeBookingHtml(formatBookingMoney(booking.nightlyRate))} per night</small>
                    </div>
                    <div class="booking-record-actions">
                        ${primaryAction}
                        ${cancelAction}
                    </div>
                </footer>
            </div>
        </article>`;
}

function renderBookingsPage() {
    const records = typeof getBookingRecords === "function"
        ? getBookingRecords()
        : [];
    const grouped = records.reduce((result, booking) => {
        const state = bookingDisplayState(booking);
        if (state.key === "confirmed") result.upcoming.push(booking);
        else result.past.push(booking);
        return result;
    }, { upcoming: [], past: [] });
    const confirmedCount = records.filter(booking =>
        bookingDisplayState(booking).key === "confirmed"
    ).length;

    bookingsStats.hidden = records.length === 0;
    bookingsContent.hidden = records.length === 0;
    bookingsEmpty.hidden = records.length > 0;
    bookingsTotalCount.textContent = records.length;
    bookingsUpcomingCount.textContent = grouped.upcoming.length;
    bookingsConfirmedCount.textContent = confirmedCount;

    upcomingBookingsSection.hidden = grouped.upcoming.length === 0;
    upcomingBookingsCount.textContent = `${grouped.upcoming.length} ${grouped.upcoming.length === 1 ? "stay" : "stays"}`;
    upcomingBookings.innerHTML = grouped.upcoming.map(bookingCard).join("");

    pastBookingsSection.hidden = grouped.past.length === 0;
    pastBookingsCount.textContent = `${grouped.past.length} ${grouped.past.length === 1 ? "stay" : "stays"}`;
    pastBookings.innerHTML = grouped.past.map(bookingCard).join("");
}

document.addEventListener("click", event => {
    const cancelButton = event.target.closest("[data-booking-action=cancel]");
    if (!cancelButton) return;
    const card = cancelButton.closest("[data-booking-key]");
    const bookingKey = card?.dataset.bookingKey;
    if (!bookingKey || typeof updateBookingStatus !== "function") return;

    const booking = getBookingRecords().find(record =>
        (record.confirmationCode || record.id) === bookingKey
    );
    if (!booking) return;

    const shouldCancel = window.confirm(
        `Cancel the stay at ${booking.name || "this accommodation"}?`
    );
    if (!shouldCancel) return;
    updateBookingStatus(bookingKey, "cancelled");
    renderBookingsPage();
});

window.addEventListener("bookingschange", renderBookingsPage);
window.addEventListener("storage", event => {
    if (["jomExploreBookings", "jomExploreAccommodation"].includes(event.key)) {
        renderBookingsPage();
    }
});

renderBookingsPage();
