/*
 * In-app demo booking flow.
 *
 * This intentionally creates a local prototype reservation only. It does not
 * charge a card, contact a hotel, or represent a confirmed real-world stay.
 * A production booking provider can replace confirmDemoBooking() with its
 * authenticated reservation callback later.
 */

const demoBookingDialog = document.createElement("dialog");
demoBookingDialog.id = "demoBookingDialog";
demoBookingDialog.className = "demo-booking-dialog";
demoBookingDialog.setAttribute("aria-labelledby", "demoBookingTitle");
demoBookingDialog.innerHTML = `
    <form id="demoBookingForm" method="dialog">
        <header class="demo-booking-heading">
            <div class="demo-booking-heading-copy">
                <div class="demo-booking-kicker">
                    <p class="section-label">JOMEXPLORE BOOKING</p>
                </div>
                <h2 id="demoBookingTitle">Complete your reservation</h2>
                <p class="demo-booking-intro">Choose your room, add guest details, then review the stay before confirming.</p>
            </div>
            <button id="closeDemoBooking" type="button" class="dialog-close" aria-label="Close booking dialog">×</button>
        </header>

        <ol class="demo-booking-steps" aria-label="Booking progress">
            <li class="is-active" data-booking-step="1" aria-current="step">
                <span>1</span><strong>Room & stay</strong>
            </li>
            <li data-booking-step="2">
                <span>2</span><strong>Guest details</strong>
            </li>
            <li data-booking-step="3">
                <span>3</span><strong>Review & confirm</strong>
            </li>
        </ol>

        <div class="demo-booking-layout">
            <div class="demo-booking-main">
                <section class="demo-booking-step-panel" data-booking-panel="1">
                    <div class="demo-booking-section-heading">
                        <p class="section-label">STEP 1</p>
                        <h3>Choose your room</h3>
                        <p>Select the room that fits your stay. Availability is simulated for this prototype.</p>
                    </div>

                    <div class="demo-booking-hotel">
                        <div class="demo-booking-hotel-heading">
                            <img id="demoBookingHotelImage" src="" alt="" loading="lazy">
                            <div>
                                <strong id="demoBookingHotelName"></strong>
                                <span id="demoBookingHotelMeta"></span>
                            </div>
                        </div>
                        <p id="demoBookingHotelDescription"></p>
                        <div id="demoBookingHotelAmenities" class="demo-booking-amenities"></div>
                    </div>

                    <div id="demoBookingRooms" class="demo-booking-room-options" aria-label="Available room types"></div>
                    <p id="demoBookingRoomMeta" class="demo-booking-room-meta" aria-live="polite"></p>

                    <div class="demo-booking-stay-fields">
                        <label>
                            <span>Check-in</span>
                            <input id="demoBookingCheckIn" name="checkIn" type="date" autocomplete="off" required>
                        </label>
                        <label>
                            <span>Check-out</span>
                            <input id="demoBookingCheckOut" name="checkOut" type="date" autocomplete="off" required>
                        </label>
                        <label>
                            <span>Guests</span>
                            <input id="demoBookingGuests" name="guests" type="number" min="1" max="8" value="2" required>
                        </label>
                    </div>
                </section>

                <section class="demo-booking-step-panel" data-booking-panel="2" hidden>
                    <div class="demo-booking-section-heading">
                        <p class="section-label">STEP 2</p>
                        <h3>Who is staying?</h3>
                        <p>We will use these details for your local confirmation record.</p>
                    </div>

                    <div class="demo-booking-field-grid">
                        <label>
                            <span>Full name</span>
                            <input id="demoBookingGuestName" name="guestName" type="text" autocomplete="name" required placeholder="Your name">
                        </label>
                        <label>
                            <span>Email address</span>
                            <input id="demoBookingGuestEmail" name="guestEmail" type="email" autocomplete="email" required placeholder="you@example.com">
                        </label>
                        <label>
                            <span>Phone number <em>Optional</em></span>
                            <input id="demoBookingGuestPhone" name="guestPhone" type="tel" autocomplete="tel" placeholder="+60 12 345 6789">
                        </label>
                        <label>
                            <span>Special request <em>Optional</em></span>
                            <input id="demoBookingSpecialRequest" name="specialRequests" type="text" placeholder="Quiet room, high floor, and so on">
                        </label>
                    </div>
                    <p class="demo-booking-note">Your details stay in this browser for the prototype. A real booking would send confirmation through the hotel or booking partner.</p>
                </section>

                <section class="demo-booking-step-panel" data-booking-panel="3" hidden>
                    <div class="demo-booking-section-heading">
                        <p class="section-label">STEP 3</p>
                        <h3>Review before you confirm</h3>
                        <p>Check the stay details and total. Nothing will be charged in this local demo.</p>
                    </div>

                    <dl class="demo-booking-review-list">
                        <div><dt>Property</dt><dd id="demoBookingReviewHotel"></dd></div>
                        <div><dt>Room</dt><dd id="demoBookingReviewRoom"></dd></div>
                        <div><dt>Dates</dt><dd id="demoBookingReviewDates"></dd></div>
                        <div><dt>Guests</dt><dd id="demoBookingReviewGuests"></dd></div>
                        <div><dt>Primary guest</dt><dd id="demoBookingReviewGuest"></dd></div>
                        <div><dt>Confirmation email</dt><dd id="demoBookingReviewEmail"></dd></div>
                    </dl>

                    <div class="demo-booking-policy-grid">
                        <div class="demo-booking-policy-card">
                            <strong>Cancellation</strong>
                            <span>Flexible demo policy. Review the hotel’s actual terms before travelling.</span>
                        </div>
                        <div class="demo-booking-payment-card">
                            <strong>Payment</strong>
                            <span>JomExplore demo wallet</span>
                            <small>No real charge will be made.</small>
                        </div>
                    </div>
                </section>
            </div>

            <aside class="demo-booking-summary" aria-labelledby="demoBookingSummaryTitle">
                <div class="demo-booking-summary-card">
                    <p id="demoBookingSummaryTitle" class="section-label">STAY SUMMARY</p>
                    <div class="demo-booking-summary-hotel">
                        <img id="demoBookingSummaryImage" src="" alt="" loading="lazy">
                        <div>
                            <strong id="demoBookingSummaryHotel"></strong>
                            <span id="demoBookingSummaryArea"></span>
                        </div>
                    </div>
                    <dl class="demo-booking-summary-details">
                        <div><dt>Room</dt><dd id="demoBookingSummaryRoom">Choose a room</dd></div>
                        <div><dt>Dates</dt><dd id="demoBookingSummaryDates">Choose your dates</dd></div>
                        <div><dt>Guests</dt><dd id="demoBookingSummaryGuests">2 guests</dd></div>
                    </dl>
                    <div class="demo-booking-price-breakdown">
                        <div><span>Room subtotal</span><strong id="demoBookingRoomSubtotal">RM0.00</strong></div>
                        <div><span>Service fee <small>10%</small></span><strong id="demoBookingServiceFee">RM0.00</strong></div>
                        <div><span>Local tourism tax <small>demo</small></span><strong id="demoBookingTourismTax">RM0.00</strong></div>
                        <div class="demo-booking-total-row"><span>Total</span><strong id="demoBookingTotal">RM0.00</strong></div>
                    </div>
                    <p class="demo-booking-currency-note">Prices are shown in Malaysian Ringgit (MYR). This prototype does not process payment.</p>
                </div>
                <div class="demo-booking-trust-note">
                    <span aria-hidden="true">✓</span>
                    <p><strong>Safe to explore</strong><br>Nothing is charged and no hotel is contacted.</p>
                </div>
            </aside>
        </div>

        <p id="demoBookingError" class="demo-booking-error" role="alert" hidden></p>
        <footer class="demo-booking-actions">
            <button id="cancelDemoBooking" type="button" class="secondary-button">Cancel</button>
            <button id="backDemoBooking" type="button" class="secondary-button" hidden>Back</button>
            <span class="demo-booking-actions-spacer"></span>
            <button id="nextDemoBooking" type="button" class="primary-button">Continue to guest details</button>
            <button id="confirmDemoBooking" type="submit" class="primary-button" hidden>Confirm booking</button>
        </footer>
    </form>

    <section id="demoBookingSuccess" class="demo-booking-success" hidden>
        <div class="demo-booking-success-mark" aria-hidden="true">✓</div>
        <p class="section-label">BOOKING CONFIRMATION</p>
        <h2>Reservation saved</h2>
        <p id="demoBookingSuccessText"></p>
        <dl class="demo-booking-confirmation-card">
            <div><dt>Property</dt><dd id="demoBookingSuccessHotel"></dd></div>
            <div><dt>Confirmation code</dt><dd id="demoBookingSuccessCode"></dd></div>
            <div><dt>Total saved</dt><dd id="demoBookingSuccessTotal"></dd></div>
        </dl>
        <p class="demo-booking-note">This is a local prototype reservation. It does not charge a card or contact the hotel.</p>
        <div class="demo-booking-actions demo-booking-success-actions">
            <button id="closeDemoBookingSuccess" type="button" class="secondary-button">Done</button>
            <a href="bookings.html" class="primary-button">View my booking</a>
            <a href="favorites.html" class="secondary-button">View itinerary</a>
        </div>
    </section>`;
document.body.appendChild(demoBookingDialog);

const demoBookingForm = document.getElementById("demoBookingForm");
const demoBookingSuccess = document.getElementById("demoBookingSuccess");
const demoBookingError = document.getElementById("demoBookingError");
const demoBookingHotelImage = document.getElementById("demoBookingHotelImage");
const demoBookingHotelName = document.getElementById("demoBookingHotelName");
const demoBookingHotelMeta = document.getElementById("demoBookingHotelMeta");
const demoBookingHotelDescription = document.getElementById("demoBookingHotelDescription");
const demoBookingHotelAmenities = document.getElementById("demoBookingHotelAmenities");
const demoBookingRooms = document.getElementById("demoBookingRooms");
const demoBookingRoomMeta = document.getElementById("demoBookingRoomMeta");
const demoBookingGuestName = document.getElementById("demoBookingGuestName");
const demoBookingGuestEmail = document.getElementById("demoBookingGuestEmail");
const demoBookingGuestPhone = document.getElementById("demoBookingGuestPhone");
const demoBookingSpecialRequest = document.getElementById("demoBookingSpecialRequest");
const demoBookingCheckIn = document.getElementById("demoBookingCheckIn");
const demoBookingCheckOut = document.getElementById("demoBookingCheckOut");
const demoBookingGuests = document.getElementById("demoBookingGuests");
const demoBookingSummaryImage = document.getElementById("demoBookingSummaryImage");
const demoBookingSummaryHotel = document.getElementById("demoBookingSummaryHotel");
const demoBookingSummaryArea = document.getElementById("demoBookingSummaryArea");
const demoBookingSummaryRoom = document.getElementById("demoBookingSummaryRoom");
const demoBookingSummaryDates = document.getElementById("demoBookingSummaryDates");
const demoBookingSummaryGuests = document.getElementById("demoBookingSummaryGuests");
const demoBookingRoomSubtotal = document.getElementById("demoBookingRoomSubtotal");
const demoBookingServiceFee = document.getElementById("demoBookingServiceFee");
const demoBookingTourismTax = document.getElementById("demoBookingTourismTax");
const demoBookingTotal = document.getElementById("demoBookingTotal");
const demoBookingReviewHotel = document.getElementById("demoBookingReviewHotel");
const demoBookingReviewRoom = document.getElementById("demoBookingReviewRoom");
const demoBookingReviewDates = document.getElementById("demoBookingReviewDates");
const demoBookingReviewGuests = document.getElementById("demoBookingReviewGuests");
const demoBookingReviewGuest = document.getElementById("demoBookingReviewGuest");
const demoBookingReviewEmail = document.getElementById("demoBookingReviewEmail");
const demoBookingSuccessText = document.getElementById("demoBookingSuccessText");
const demoBookingSuccessHotel = document.getElementById("demoBookingSuccessHotel");
const demoBookingSuccessCode = document.getElementById("demoBookingSuccessCode");
const demoBookingSuccessTotal = document.getElementById("demoBookingSuccessTotal");
const backDemoBookingButton = document.getElementById("backDemoBooking");
const nextDemoBookingButton = document.getElementById("nextDemoBooking");
const confirmDemoBookingButton = document.getElementById("confirmDemoBooking");
const bookingStepItems = [...document.querySelectorAll("[data-booking-step]")];
const bookingStepPanels = [...document.querySelectorAll("[data-booking-panel]")];

const DEMO_SERVICE_FEE_RATE = 0.1;
const DEMO_TOURISM_TAX_PER_NIGHT = 10;

let activeAccommodation = null;
let activeRoomId = null;
let bookingStep = 1;

function escapeDemoBookingText(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatDemoMoney(value) {
    return `RM${Number(value || 0).toLocaleString("en-MY", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function getDemoRoomOptions(accommodation) {
    if (Array.isArray(accommodation.rooms) && accommodation.rooms.length) {
        return accommodation.rooms;
    }

    const baseRate = Number(accommodation.nightlyRate) || 0;
    return [
        {
            id: "standard",
            name: "Standard room",
            details: "1 queen bed · up to 2 guests",
            nightlyRate: baseRate,
            available: 3
        },
        {
            id: "deluxe",
            name: "Deluxe room",
            details: "1 king bed · breakfast included",
            nightlyRate: baseRate + 45,
            available: 2
        },
        {
            id: "family",
            name: "Family room",
            details: "2 beds · up to 4 guests",
            nightlyRate: baseRate + 85,
            available: 1
        }
    ];
}

function demoBookingDateLabel(value, includeYear = true) {
    if (!value) return "Date to be confirmed";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-MY", {
        day: "numeric",
        month: "short",
        ...(includeYear ? { year: "numeric" } : {})
    }).format(date);
}

function demoBookingDateRange(checkIn, checkOut) {
    if (!checkIn || !checkOut) return "Choose your dates";
    return `${demoBookingDateLabel(checkIn, false)} – ${demoBookingDateLabel(checkOut, false)}`;
}

function demoBookingNightCount(checkIn, checkOut) {
    const start = new Date(`${checkIn}T12:00:00`);
    const end = new Date(`${checkOut}T12:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.round((end - start) / 86_400_000);
}

function getSelectedDemoRoom() {
    return activeAccommodation?.rooms?.find(room => room.id === activeRoomId) || null;
}

function getDemoBookingPrice(room = getSelectedDemoRoom()) {
    const nights = demoBookingNightCount(
        demoBookingCheckIn.value,
        demoBookingCheckOut.value
    );
    const roomSubtotal = room && nights > 0
        ? Number(room.nightlyRate || 0) * nights
        : 0;
    const serviceFee = roomSubtotal * DEMO_SERVICE_FEE_RATE;
    const tourismTax = nights > 0 ? DEMO_TOURISM_TAX_PER_NIGHT * nights : 0;
    return {
        nights,
        roomSubtotal,
        serviceFee,
        tourismTax,
        total: roomSubtotal + serviceFee + tourismTax
    };
}

function setBookingImage(imageElement, accommodation) {
    if (!imageElement) return;
    imageElement.hidden = !accommodation?.image;
    imageElement.alt = accommodation?.imageAlt || "";
    if (accommodation?.image) imageElement.src = accommodation.image;
}

function renderDemoRoomOptions() {
    const rooms = activeAccommodation?.rooms || [];
    const firstAvailable = rooms.find(room => Number(room.available) > 0);
    if (!rooms.length) {
        demoBookingRooms.innerHTML = "<p class=\"demo-booking-room-empty\">No room options are available for this stay.</p>";
        activeRoomId = null;
        updateDemoBookingSummary();
        return;
    }

    const savedRoom = rooms.find(room =>
        room.name === activeAccommodation?.roomType && Number(room.available) > 0
    );
    const activeRoom = rooms.find(room => room.id === activeRoomId);
    if (!activeRoom || Number(activeRoom.available) < 1) {
        activeRoomId = savedRoom?.id || firstAvailable?.id || rooms[0].id;
    }

    demoBookingRooms.innerHTML = rooms.map(room => {
        const available = Number(room.available) > 0;
        const selected = room.id === activeRoomId;
        const availability = available
            ? `${room.available} ${Number(room.available) === 1 ? "room" : "rooms"} available`
            : "Sold out";
        return `
            <label class="demo-booking-room-option${selected ? " is-selected" : ""}${available ? "" : " is-unavailable"}">
                <input type="radio"
                       name="roomId"
                       value="${escapeDemoBookingText(room.id)}"
                       ${selected && available ? "checked" : ""}
                       ${available ? "" : "disabled"}>
                <span class="demo-booking-room-option-content">
                    <span class="demo-booking-room-option-topline">
                        <strong>${escapeDemoBookingText(room.name)}</strong>
                        <b>${formatDemoMoney(room.nightlyRate)}<small>/night</small></b>
                    </span>
                    <span class="demo-booking-room-details">${escapeDemoBookingText(room.details || "Comfortable room for your stay")}</span>
                    <span class="demo-booking-room-availability">${availability}</span>
                </span>
            </label>`;
    }).join("");

    demoBookingRooms.querySelectorAll("input[name=roomId]").forEach(input => {
        input.addEventListener("change", () => {
            activeRoomId = input.value;
            demoBookingRooms.querySelectorAll(".demo-booking-room-option").forEach(option => {
                option.classList.toggle("is-selected", option.querySelector("input")?.checked);
            });
            updateDemoBookingSummary();
        });
    });
    updateDemoBookingSummary();
}

function updateDemoBookingSummary() {
    demoBookingCheckOut.min = demoBookingCheckIn.value || "";
    const room = getSelectedDemoRoom();
    const pricing = getDemoBookingPrice(room);
    const guests = Number(demoBookingGuests.value) || 0;
    const dateRange = demoBookingDateRange(
        demoBookingCheckIn.value,
        demoBookingCheckOut.value
    );

    demoBookingRoomMeta.textContent = room
        ? `${room.details || "Comfortable room for your stay"} · ${Number(room.available) === 1 ? "1 room" : `${room.available} rooms`} available`
        : "Choose an available room to continue.";
    demoBookingSummaryRoom.textContent = room?.name || "Choose a room";
    demoBookingSummaryDates.textContent = dateRange;
    demoBookingSummaryGuests.textContent = `${guests} ${guests === 1 ? "guest" : "guests"}`;
    demoBookingRoomSubtotal.textContent = formatDemoMoney(pricing.roomSubtotal);
    demoBookingServiceFee.textContent = formatDemoMoney(pricing.serviceFee);
    demoBookingTourismTax.textContent = formatDemoMoney(pricing.tourismTax);
    demoBookingTotal.textContent = formatDemoMoney(pricing.total);

    demoBookingReviewHotel.textContent = activeAccommodation?.name || "Not selected";
    demoBookingReviewRoom.textContent = room?.name || "Not selected";
    demoBookingReviewDates.textContent = pricing.nights > 0
        ? `${dateRange} · ${pricing.nights} ${pricing.nights === 1 ? "night" : "nights"}`
        : dateRange;
    demoBookingReviewGuests.textContent = `${guests} ${guests === 1 ? "guest" : "guests"}`;
    demoBookingReviewGuest.textContent = demoBookingGuestName.value.trim() || "Add guest name";
    demoBookingReviewEmail.textContent = demoBookingGuestEmail.value.trim() || "Add email address";

    if (demoBookingRooms.querySelector("input[name=roomId]:checked")) {
        demoBookingRooms.querySelectorAll(".demo-booking-room-option").forEach(option => {
            option.classList.toggle("is-selected", option.querySelector("input")?.checked);
        });
    }
}

function showDemoBookingError(message, target) {
    demoBookingError.textContent = message;
    demoBookingError.hidden = false;
    target?.focus();
}

function clearDemoBookingError() {
    demoBookingError.hidden = true;
    demoBookingError.textContent = "";
}

function validateDemoStayDetails() {
    const room = getSelectedDemoRoom();
    if (!room || Number(room.available) < 1) {
        showDemoBookingError("Choose an available room before continuing.", demoBookingRooms.querySelector("input:not([disabled])"));
        return false;
    }
    if (!demoBookingCheckIn.value) {
        showDemoBookingError("Choose a check-in date.", demoBookingCheckIn);
        return false;
    }
    if (!demoBookingCheckOut.value) {
        showDemoBookingError("Choose a check-out date.", demoBookingCheckOut);
        return false;
    }
    if (demoBookingNightCount(demoBookingCheckIn.value, demoBookingCheckOut.value) < 1) {
        showDemoBookingError("Choose a check-out date after check-in.", demoBookingCheckOut);
        return false;
    }

    const guests = Number(demoBookingGuests.value);
    if (!Number.isInteger(guests) || guests < 1 || guests > 8) {
        showDemoBookingError("Enter a guest count between 1 and 8.", demoBookingGuests);
        return false;
    }
    return true;
}

function validateDemoGuestDetails() {
    if (!demoBookingGuestName.value.trim()) {
        showDemoBookingError("Enter the primary guest’s full name.", demoBookingGuestName);
        return false;
    }
    if (!demoBookingGuestEmail.value.trim() || !demoBookingGuestEmail.checkValidity()) {
        showDemoBookingError("Enter a valid email address for the confirmation.", demoBookingGuestEmail);
        return false;
    }
    return true;
}

function setBookingStep(step) {
    bookingStep = Math.max(1, Math.min(3, step));
    bookingStepItems.forEach(item => {
        const itemStep = Number(item.dataset.bookingStep);
        item.classList.toggle("is-active", itemStep === bookingStep);
        item.classList.toggle("is-complete", itemStep < bookingStep);
        if (itemStep === bookingStep) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
    });
    bookingStepPanels.forEach(panel => {
        panel.hidden = Number(panel.dataset.bookingPanel) !== bookingStep;
    });
    backDemoBookingButton.hidden = bookingStep === 1;
    nextDemoBookingButton.hidden = bookingStep === 3;
    confirmDemoBookingButton.hidden = bookingStep !== 3;
    nextDemoBookingButton.textContent = bookingStep === 1
        ? "Continue to guest details"
        : "Review booking";
    clearDemoBookingError();
    updateDemoBookingSummary();
}

function updateSavedItineraryAccommodation(accommodation) {
    let currentItinerary = null;
    try {
        currentItinerary = JSON.parse(
            localStorage.getItem("jomExploreSavedItinerary") || "null"
        );
    }
    catch {
        currentItinerary = null;
    }

    if (currentItinerary?.accommodation?.id === accommodation.id) {
        localStorage.setItem(
            "jomExploreSavedItinerary",
            JSON.stringify({ ...currentItinerary, accommodation })
        );
    }

    if (typeof getSavedItineraries !== "function" || typeof writeSavedItineraries !== "function") {
        return;
    }

    const savedItineraries = getSavedItineraries();
    const updated = savedItineraries.map(record => {
        if (record.itinerary?.accommodation?.id !== accommodation.id) return record;
        return {
            ...record,
            updatedAt: new Date().toISOString(),
            itinerary: { ...record.itinerary, accommodation }
        };
    });
    if (JSON.stringify(updated) !== JSON.stringify(savedItineraries)) {
        writeSavedItineraries(updated);
    }
}

function confirmDemoBooking(formData) {
    const room = getSelectedDemoRoom();
    const checkIn = formData.get("checkIn");
    const checkOut = formData.get("checkOut");
    const nights = demoBookingNightCount(checkIn, checkOut);
    if (!room || Number(room.available) < 1) {
        showDemoBookingError("Choose an available room before confirming.", demoBookingRooms.querySelector("input:not([disabled])"));
        return null;
    }
    if (nights < 1) {
        showDemoBookingError("Choose a check-out date after check-in.", demoBookingCheckOut);
        return null;
    }

    const pricing = getDemoBookingPrice(room);
    const confirmationCode = `JX-${Date.now().toString(36).toUpperCase()}`;
    const confirmed = {
        ...activeAccommodation,
        checkIn,
        checkOut,
        guests: formData.get("guests") || "2",
        guestName: String(formData.get("guestName") || "").trim(),
        guestEmail: String(formData.get("guestEmail") || "").trim(),
        guestPhone: String(formData.get("guestPhone") || "").trim(),
        specialRequests: String(formData.get("specialRequests") || "").trim(),
        roomId: room.id,
        roomType: room.name,
        roomDetails: room.details,
        roomAvailability: room.available,
        rooms: activeAccommodation.rooms,
        bookingStatus: "confirmed",
        bookingProvider: "JomExplore",
        confirmationCode,
        nightCount: nights,
        roomSubtotal: pricing.roomSubtotal,
        serviceFee: pricing.serviceFee,
        tourismTax: pricing.tourismTax,
        totalAmount: pricing.total,
        bookedAt: new Date().toISOString()
    };

    saveAccommodationRecord(confirmed);
    if (typeof saveBookingRecord === "function") {
        saveBookingRecord(confirmed);
    }
    updateSavedItineraryAccommodation(confirmed);
    trackEvent("demo_booking_confirmed", {
        hotelId: confirmed.id,
        bookingStatus: confirmed.bookingStatus,
        confirmationCode
    });
    return confirmed;
}

function showDemoBookingSuccess(accommodation) {
    demoBookingForm.hidden = true;
    demoBookingSuccess.hidden = false;
    const guests = Number(accommodation.guests) || 1;
    const guestLabel = `${guests} ${guests === 1 ? "guest" : "guests"}`;
    const dateRange = demoBookingDateRange(accommodation.checkIn, accommodation.checkOut);
    demoBookingSuccessHotel.textContent = accommodation.name;
    demoBookingSuccessCode.textContent = accommodation.confirmationCode || "Saved locally";
    demoBookingSuccessTotal.textContent = formatDemoMoney(accommodation.totalAmount);
    demoBookingSuccessText.textContent =
        `${dateRange} · ${guestLabel} · ${formatDemoMoney(accommodation.totalAmount)} total. Your stay is ready in My Bookings.`;
}

function resetDemoBookingDialog() {
    demoBookingForm.hidden = false;
    demoBookingSuccess.hidden = true;
    demoBookingForm.reset();
    activeRoomId = null;
    setBookingStep(1);
    clearDemoBookingError();
}

function openDemoBooking(accommodation) {
    if (!accommodation) return;
    activeAccommodation = { ...accommodation };
    activeAccommodation.rooms = getDemoRoomOptions(accommodation);
    resetDemoBookingDialog();
    demoBookingHotelName.textContent = `🏨 ${accommodation.name}`;
    demoBookingHotelMeta.textContent = `${accommodation.area || "Kuala Lumpur"} · ${formatDemoMoney(accommodation.nightlyRate)} per night`;
    demoBookingHotelDescription.textContent = accommodation.description || "Comfortable accommodation for your trip.";
    demoBookingHotelAmenities.innerHTML = (accommodation.amenities || [])
        .map(amenity => `<span>${escapeDemoBookingText(amenity)}</span>`)
        .join("");
    setBookingImage(demoBookingHotelImage, accommodation);
    setBookingImage(demoBookingSummaryImage, accommodation);
    demoBookingSummaryHotel.textContent = accommodation.name;
    demoBookingSummaryArea.textContent = accommodation.area || "Kuala Lumpur";
    demoBookingCheckIn.value = accommodation.checkIn || "";
    demoBookingCheckOut.value = accommodation.checkOut || "";
    demoBookingGuests.value = accommodation.guests || "2";
    activeRoomId = accommodation.roomId || null;
    renderDemoRoomOptions();

    if (["confirmed", "booked"].includes(String(accommodation.bookingStatus || "").toLowerCase())) {
        showDemoBookingSuccess(accommodation);
    }

    demoBookingDialog.showModal();
}

document.getElementById("closeDemoBooking").addEventListener("click", () => demoBookingDialog.close());
document.getElementById("cancelDemoBooking").addEventListener("click", () => demoBookingDialog.close());
document.getElementById("closeDemoBookingSuccess").addEventListener("click", () => demoBookingDialog.close());
demoBookingDialog.addEventListener("click", event => {
    if (event.target === demoBookingDialog) demoBookingDialog.close();
});
backDemoBookingButton.addEventListener("click", () => setBookingStep(bookingStep - 1));
nextDemoBookingButton.addEventListener("click", () => {
    const valid = bookingStep === 1
        ? validateDemoStayDetails()
        : validateDemoGuestDetails();
    if (valid) setBookingStep(bookingStep + 1);
});
demoBookingForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateDemoStayDetails() || !validateDemoGuestDetails()) return;
    const confirmed = confirmDemoBooking(new FormData(demoBookingForm));
    if (confirmed) showDemoBookingSuccess(confirmed);
});
[demoBookingCheckIn, demoBookingCheckOut, demoBookingGuests,
    demoBookingGuestName, demoBookingGuestEmail].forEach(input => {
    input.addEventListener("input", () => {
        clearDemoBookingError();
        updateDemoBookingSummary();
    });
});

window.openDemoBooking = openDemoBooking;
