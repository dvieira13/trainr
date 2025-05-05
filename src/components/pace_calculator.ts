import { toggle_class, isDistanceValid, isPaceValid, isValidTimeFormat, normalizeToHHMMSS, cleanUpTimeString } from "./tools";

const calculator_options = document.querySelectorAll<HTMLElement>(".menu-option");
const calculate_buttons = document.querySelectorAll<HTMLElement>(".form-cta");
const event_dropdowns = document.querySelectorAll<HTMLElement>(".event-selector");
const distance_inputs = document.querySelectorAll<HTMLElement>(".custom-distance");

//Pace inputs
const pace_distance = document.querySelector("#pace_distance") as HTMLInputElement;
const pace_time = document.querySelector("#pace_time") as HTMLInputElement;
const pace_event = document.querySelector("#pace_event") as HTMLSelectElement;
//Pace results
const pace_result_miles = document.querySelector("#pace_result_miles") as HTMLElement;
const pace_result_kilometers = document.querySelector("#pace_result_kilometers") as HTMLElement;

//Time inputs
const time_distance = document.querySelector("#time_distance") as HTMLInputElement;
const time_pace = document.querySelector("#time_pace") as HTMLInputElement;
const time_event = document.querySelector("#time_event") as HTMLSelectElement;
//Time results
const time_result = document.querySelector("#time_result") as HTMLElement;

//Distance inputs
const distance_pace = document.querySelector("#distance_pace") as HTMLInputElement;
const distance_time = document.querySelector("#distance_time") as HTMLInputElement;
//Distance results
const distance_result_miles = document.querySelector("#distance_result_miles") as HTMLElement;
const distance_result_kilometers = document.querySelector("#distance_result_kilometers") as HTMLElement;

calculator_initialize();

/**
 * initializes nav logic
 */
function calculator_initialize(): void {
    calculator_options.forEach((el) => {
        el.addEventListener("click", (event) => {
            const curr_option = document.querySelector(".active-menu-option") as HTMLElement;
            const curr_type = curr_option.id.replace("calculate_", "") as string;
            const curr_calc = document.querySelector("#" + curr_type + "_calculator") as HTMLElement;
            toggle_class(curr_calc, "active-calculator");
            toggle_class(curr_option, "active-menu-option");

            const target = event.currentTarget as HTMLElement;
            const new_type = target.id.replace("calculate_", "") as string;
            const new_calc = document.querySelector("#" + new_type + "_calculator") as HTMLElement;
            toggle_class(new_calc, "active-calculator");
            toggle_class(target, "active-menu-option");
        });
    });

    calculate_buttons.forEach((el) => {
        el.addEventListener("click", (event) => {
            const target = event.currentTarget as HTMLElement;
            if (target.id.split("_").includes("pace")) {
                const calc_type: string = "pace";
                if (validateForm(calc_type) == true) {
                    calculatorSubmit(calc_type);
                    document.querySelector(getCalculatorId(calc_type) + " .result-list")?.classList.add("show-results");
                }
                else {
                    clearCalculatorResults(calc_type);
                    document.querySelector(getCalculatorId(calc_type) + " .result-list")?.classList.remove("show-results");
                }
            }
            else if (target.id.split("_").includes("time")) {
                const calc_type: string = "time";
                if (validateForm(calc_type) == true) {
                    calculatorSubmit(calc_type);
                    document.querySelector(getCalculatorId(calc_type) + " .result-list")?.classList.add("show-results");
                }
                else {
                    clearCalculatorResults(calc_type);
                    document.querySelector(getCalculatorId(calc_type) + " .result-list")?.classList.remove("show-results");
                }
            }
            else if (target.id.split("_").includes("distance")) {
                const calc_type: string = "distance";
                if (validateForm(calc_type) == true) {
                    calculatorSubmit(calc_type);
                    document.querySelector(getCalculatorId(calc_type) + " .result-list")?.classList.add("show-results");
                }
                else {
                    clearCalculatorResults(calc_type);
                    document.querySelector(getCalculatorId(calc_type) + " .result-list")?.classList.remove("show-results");
                }
            }
        });
    });

    //clear custom distance input when event dropdown is used
    event_dropdowns.forEach((el) => {
        el.addEventListener("change", (event) => {
            const target = event.target as HTMLSelectElement;
            if (target.id === "pace_event") {
                pace_distance.value = "";
            }
            else if (target.id === "time_event") {
                time_distance.value = "";
            }
        });
    });

    //clear distance(event) dropdown when value is entered into custom distance input
    distance_inputs.forEach((el) => {
        el.addEventListener("input", (event) => {
            const target = event.target as HTMLSelectElement;
            if (target.id === "pace_distance") {
                pace_event.value = "";
            }
            else if (target.id === "time_distance") {
                time_event.value = "";
            }
        });
    });
}

/**
 * 
 * @param input string | pace, time, or distance
 */
function clearCalculatorResults(input: string): void {
    const results = document.querySelectorAll<HTMLInputElement>(getCalculatorId(input) + " .result .body-copy");
    results.forEach((el) => {
        el.innerHTML = "";
    });
}

/**
 * 
 * @param input string | pace, time, or distance
 * @returns id selector for individual calculator's parent div
 */
function getCalculatorId(input: string): string {
    const calc_id = "#" + input + "_calculator";
    return calc_id;
}

function validateForm(input: string): boolean {
    let is_valid = true;
    const calc_selector = document.querySelector(getCalculatorId(input) + " .event-selector") as HTMLSelectElement;

    if (input === "pace") {
        //check if distance is valid
        if (isDistanceValid(pace_distance.value) === false && calc_selector.value == "") {
            pace_distance.closest(".form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else {
            pace_distance.closest(".form-item")?.classList.remove("form-item-error");
        }

        //check if time is valid
        if (isValidTimeFormat(pace_time.value) === false) {
            pace_time.closest(".form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else {
            pace_time.closest(".form-item")?.classList.remove("form-item-error");
        }
    }
    else if (input === "time") {
        //check if distance is valid
        if (isDistanceValid(time_distance.value) === false && calc_selector.value == "") {
            time_distance.closest(".form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else {
            time_distance.closest(".form-item")?.classList.remove("form-item-error");
        }

        //check if pace is valid
        if (isPaceValid(time_pace.value) === false) {
            time_pace.closest(".form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else {
            time_pace.closest(".form-item")?.classList.remove("form-item-error");
        }
    }
    else if (input === "distance") {
        //check if pace is valid
        if (isPaceValid(distance_pace.value) === false) {
            distance_pace.closest(".form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else {
            distance_pace.closest(".form-item")?.classList.remove("form-item-error");
        }

        //check if time is valid
        if (isValidTimeFormat(distance_time.value) === false) {
            distance_time.closest(".form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else {
            distance_time.closest(".form-item")?.classList.remove("form-item-error");
        }
    }

    //check if inputs are empty
    const inputs = document.querySelectorAll<HTMLInputElement>(getCalculatorId(input) + " input");

    inputs.forEach((el) => {
        if (el.value == null || el.value == "") {
            if (el.id.includes("_distance") && calc_selector.value) {
                //skip distance when event selected
            }
            else {
                el.closest(".form-item")?.classList.add("form-item-error");
                is_valid = false;
            }
        }
    });

    return is_valid;
}

function calculatorSubmit(input: string): void {
    if (input === "pace") {
        const dist = pace_distance.value;
        let pace_result;

        if (dist != null && dist != "") {
            pace_result = calculatePacePerMile(pace_distance.value, pace_time.value);
        }
        else {
            pace_result = calculatePacePerMile(pace_event.value, pace_time.value);
        }

        pace_result_miles.innerHTML = cleanUpTimeString(pace_result);
        pace_result_kilometers.innerHTML = cleanUpTimeString(convertMilePaceToKmPace(pace_result));
    }
    else if (input === "time") {
        const dist = time_distance.value;
        let time_result_temp;

        if (dist != null && dist != "") {
            time_result_temp = calculateTotalTime(time_distance.value, time_pace.value);
        }
        else {
            time_result_temp = calculateTotalTime(time_event.value, time_pace.value);
        }

        time_result.innerHTML = cleanUpTimeString(time_result_temp);
    }

    else if (input === "distance") {
        const distance_result = calculateDistanceInMiles(distance_pace.value, distance_time.value);

        distance_result_miles.innerHTML = distance_result;
        distance_result_kilometers.innerHTML = milesToKilometers(distance_result);
    }
}

function calculatePacePerMile(distance: string, time: string): string {
    const miles = parseFloat(distance);
    const [hours, minutes, seconds] = normalizeToHHMMSS(time).split(":").map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (isNaN(miles) || miles <= 0 || isNaN(totalSeconds)) {
        return "Invalid input";
    }

    const paceSeconds = totalSeconds / miles;
    const paceMinutes = Math.floor(paceSeconds / 60);
    const paceRemainderSeconds = Math.round(paceSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(paceMinutes)}:${pad(paceRemainderSeconds)}`;
}

function calculateTotalTime(distance: string, pace: string): string {
    const miles = parseFloat(distance);
    const [min, sec] = pace.split(":").map(Number);
    const paceSeconds = min * 60 + sec;

    if (isNaN(miles) || miles <= 0 || isNaN(paceSeconds)) {
        return "Invalid input";
    }

    const totalSeconds = Math.round(miles * paceSeconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function calculateDistanceInMiles(pace: string, time: string): string {
    const [paceMin, paceSec] = pace.split(":").map(Number);
    const [hours, minutes, seconds] = normalizeToHHMMSS(time).split(":").map(Number);

    const totalPaceSeconds = paceMin * 60 + paceSec;
    const totalTimeSeconds = hours * 3600 + minutes * 60 + seconds;

    if (isNaN(totalPaceSeconds) || totalPaceSeconds <= 0 || isNaN(totalTimeSeconds) || totalTimeSeconds <= 0) {
        return "Invalid input";
    }

    const distance = totalTimeSeconds / totalPaceSeconds;
    return distance.toFixed(2); // returns distance rounded to 2 decimal places
}

function convertMilePaceToKmPace(milePace: string): string {
    const [min, sec] = milePace.split(":").map(Number);
    const totalSeconds = min * 60 + sec;

    if (isNaN(totalSeconds) || totalSeconds <= 0) {
        return "Invalid input";
    }

    const kmSeconds = totalSeconds / 1.60934; // 1 mile = 1.60934 km
    const kmMinutes = Math.floor(kmSeconds / 60);
    const kmRemainderSeconds = Math.round(kmSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(kmMinutes)}:${pad(kmRemainderSeconds)}`;
}

function milesToKilometers(miles: string): string {
    const milesNumber = parseFloat(miles);

    if (isNaN(milesNumber) || milesNumber < 0) {
        return "Invalid input";
    }

    const kilometers = milesNumber * 1.60934;
    return kilometers.toFixed(2); // format to 2 decimal places
}