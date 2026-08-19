const preferenceForm =
    document.getElementById("preferenceForm");


preferenceForm.addEventListener("submit", function(event) {

    event.preventDefault();


    // Get location
    const location =
        document.querySelector(
            'input[name="location"]:checked'
        ).value;


    // Get interests
    const selectedInterests =
        document.querySelectorAll(
            'input[name="interest"]:checked'
        );


    const interests =
        Array.from(selectedInterests)
            .map(input => input.value);


    // Check at least one interest
    if (interests.length === 0) {

        alert(
            "Please select at least one interest."
        );

        return;

    }


    // Get budget
    const budget =
        document.querySelector(
            'input[name="budget"]:checked'
        ).value;


    // Get available time
    const time =
        document.querySelector(
            'input[name="time"]:checked'
        ).value;


    // Create user preference object
    const preferences = {

        location: location,

        interests: interests,

        budget: budget,

        time: time

    };


    // Save preferences
    localStorage.setItem(
        "jomExplorePreferences",
        JSON.stringify(preferences)
    );


    // Go to results page
    window.location.href =
        "results.html";

});