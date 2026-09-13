const preferenceForm = document.getElementById("preferenceForm");
const accommodationToggle = document.getElementById("includeAccommodation");
const accommodationFields = document.getElementById("accommodationFields");
const checkInInput = document.getElementById("checkIn");
const checkOutInput = document.getElementById("checkOut");

function setAccommodationVisibility(isVisible) {
    accommodationFields.hidden = !isVisible;
    [checkInInput, checkOutInput].forEach(input => {
        input.required = isVisible;
    });
}

function setDateBounds() {
    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    checkInInput.min = todayString;
    checkOutInput.min = todayString;
}

function normalizeBudgetOption(value) {
    return {
        "RM1-30": "RM30",
        "RM31-50": "RM50",
        "RM51-100": "RM100"
    }[value] || value;
}

accommodationToggle.addEventListener("change", () => {
    setAccommodationVisibility(accommodationToggle.checked);
});

checkInInput.addEventListener("change", () => {
    checkOutInput.min = checkInInput.value || checkOutInput.min;
    if (checkOutInput.value && checkOutInput.value < checkInInput.value) {
        checkOutInput.value = "";
    }
});

try {
    const savedPreferences = JSON.parse(localStorage.getItem("jomExplorePreferences"));
    if (savedPreferences) {
        document.querySelector(`input[name="location"][value="${CSS.escape(savedPreferences.location)}"]`)?.click();
        document.querySelectorAll('input[name="interest"]').forEach(input => {
            input.checked = savedPreferences.interests?.includes(input.value) ?? false;
        });
        const savedBudget = normalizeBudgetOption(savedPreferences.budget);
        document.querySelector(`input[name="budget"][value="${CSS.escape(savedBudget)}"]`)?.click();
        document.querySelector(`input[name="time"][value="${CSS.escape(savedPreferences.time)}"]`)?.click();

        const accommodation = savedPreferences.accommodation;
        if (accommodation?.enabled) {
            accommodationToggle.checked = true;
            checkInInput.value = accommodation.checkIn || "";
            checkOutInput.value = accommodation.checkOut || "";
            document.getElementById("guests").value = accommodation.guests || "2";
            document.getElementById("hotelBudget").value = accommodation.hotelBudget || "0";
            document.getElementById("hotelArea").value = accommodation.hotelArea || "Any area";
        }
    }
}
catch {
    // Ignore malformed saved preferences and show the default form.
}

setDateBounds();
setAccommodationVisibility(accommodationToggle.checked);

preferenceForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const selectedLocation = document.querySelector('input[name="location"]:checked');
    const selectedBudget = document.querySelector('input[name="budget"]:checked');
    const selectedTime = document.querySelector('input[name="time"]:checked');
    const interests = Array.from(document.querySelectorAll('input[name="interest"]:checked'))
        .map(input => input.value);

    if (!selectedLocation || !selectedBudget || !selectedTime) {
        alert("Please complete your location, budget and available time preferences.");
        return;
    }

    if (interests.length === 0) {
        alert("Please select at least one interest.");
        return;
    }

    const accommodation = accommodationToggle.checked
        ? {
            enabled: true,
            checkIn: checkInInput.value,
            checkOut: checkOutInput.value,
            guests: document.getElementById("guests").value,
            hotelBudget: document.getElementById("hotelBudget").value,
            hotelArea: document.getElementById("hotelArea").value
        }
        : { enabled: false };

    if (accommodation.enabled && accommodation.checkOut <= accommodation.checkIn) {
        alert("Check-out must be after check-in.");
        return;
    }

    const preferences = {
        location: selectedLocation.value,
        interests,
        budget: selectedBudget.value,
        time: selectedTime.value,
        accommodation
    };

    localStorage.setItem("jomExplorePreferences", JSON.stringify(preferences));
    window.location.href = "results.html";
});
