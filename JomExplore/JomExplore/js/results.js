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


// =================================
// SHOW USER PREFERENCES
// =================================

resultDescription.innerHTML = `

    Showing places in
    <strong>${preferences.location}</strong>
    that match your interests:
    <strong>
        ${preferences.interests.join(", ")}
    </strong>

`;


// =================================
// FILTER PLACES
// =================================


function calculateScore(place) {

    let score = 0;


    // Interest match
    if (
        preferences.interests.includes(
            place.category
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

function findMatchingPlaces() {

    const matchingPlaces = places.filter(place => {

        // Location must match
        const locationMatch =
            place.location === preferences.location;

        if (!locationMatch) {
            return false;
        }

        // Check whether category matches
        const interestMatch =
            preferences.interests.includes(place.category);

        // Check budget
        const budgetMatch =
            checkBudget(
                place.price,
                preferences.budget
            );

        // Check time
        const timeMatch =
            checkTime(
                place.visitTime,
                preferences.time
            );

        /*
         * We don't require EVERYTHING to match.
         * Location is required.
         *
         * Interest, budget and time are used
         * to calculate a recommendation score.
         */

        let score = 0;

        if (interestMatch) {
            score += 3;
        }

        if (budgetMatch) {
            score += 2;
        }

        if (timeMatch) {
            score += 2;
        }

        // Keep places with at least
        // one relevant preference
        return score >= 3;

    });


    // Sort most suitable places first
    matchingPlaces.sort((a, b) => {

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

        return price <= 30;

    }


    if (budget === "RM31-50") {

        return price <= 50;

    }


    if (budget === "RM51-100") {

        return price <= 100;

    }


    if (budget === "RM100+") {

        return true;

    }


    return true;

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


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "place-card";


            card.innerHTML = `

                <div class="place-image">

                    ${place.emoji}

                </div>


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

                        <span>
                            📍 ${place.distance} km
                        </span>

                        <span>
                            ⭐ ${place.rating}
                        </span>

                        <span>
                            💰 RM${place.price}
                        </span>

                        <span>
                            ⏱️ ${place.visitTime}h
                        </span>

                    </div>


                    <a href="#"
                       class="view-button">

                        View Details

                    </a>


                </div>

            `;


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


displayPlaces(
    matchingPlaces
);


// =================================
// CATEGORY FILTER
// =================================

const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );


filterButtons.forEach(
    button => {


        button.addEventListener(
            "click",
            function() {


                // Remove active
                filterButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                // Add active
                this.classList.add(
                    "active"
                );


                const filter =
                    this.dataset.filter;


                if (filter === "all") {

                    displayPlaces(
                        matchingPlaces
                    );

                }

                else {

                    const filteredPlaces =
                        matchingPlaces.filter(
                            place =>
                                place.category ===
                                filter
                        );


                    displayPlaces(
                        filteredPlaces
                    );

                }

            }
        );

    }
);