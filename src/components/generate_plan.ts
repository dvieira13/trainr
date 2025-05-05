import { toggle_class, isValidTimeFormat, normalizeToHHMMSS, doesEventExistForUser, generateGUID, redirectToMySchedule, getEventNameByUserId } from "./tools";
import { v4 as uuidv4 } from "uuid";

const generator_submit_button = document.querySelector("#generator_submit_button") as HTMLElement;
const CURRENT_USER_ID = sessionStorage.getItem("user_id");

//Duplicate Event Popup
const duplicate_event_popup = document.querySelector("#duplicate_event_popup") as HTMLElement;
const generator_submit_confirm_button = document.querySelector("#generator_submit_confirm_button") as HTMLElement;
const popup_event_name = document.querySelector("#popup_event_name") as HTMLElement;
const close_popup_buttons = document.querySelectorAll<HTMLElement>(".close-popup");

//Account Event Popup
const account_event_popup = document.querySelector("#account_event_popup") as HTMLElement;
const generator_sign_in_button = document.querySelector("#generator_sign_in_button") as HTMLElement;
const generator_create_account_button = document.querySelector("#generator_create_account_button") as HTMLElement;
const generator_force_submit_button = document.querySelector("#generator_force_submit_button") as HTMLElement;

//Generator Form inputs
const event_name = document.querySelector("#event_name") as HTMLInputElement;
const event_distance = document.querySelector("#event_distance") as HTMLSelectElement;
const event_date = document.querySelector("#event_date") as HTMLInputElement;
const event_goal_time = document.querySelector("#event_goal_time") as HTMLInputElement;
const event_goal_pace = document.querySelector("#event_goal_pace") as HTMLInputElement;
const athlete_weeks_to_train = document.querySelector("#athlete_weeks_to_train") as HTMLInputElement;
const athlete_experience = document.querySelector("#athlete_experience") as HTMLSelectElement;
const days_to_train = document.querySelectorAll<HTMLElement>(".day");

//event interface
export interface TrainrEvent {
    event_id: string;               // GUID, required
    user_id?: string;                // GUID, optional
    event_name: string;             // required
    event_date: string;             // required
    event_distance: string;         // required
    event_goal_time: string;        // required
    athlete_weeks_to_train: number; // required
    athlete_experience: string;     // required
    days_to_train: Array<string>;   // required
    workout_plan: TrainrWorkout[][]; //required
}

//workout interface
export interface TrainrWorkout {
    workout_id: string;                         // GUID, required
    event_id: string;                           // GUID, required (associated TrainrEvent)
    workout_distance: number;                   // required
    workout_type: "easy run" | "tempo run" | "long run" | "rest day"; // required
    workout_day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"; // required
    workout_time?: string;                      // optional
    workout_target_pace?: string;               // optional
    workout_difficulty?: "Easy" | "Medium" | "Difficult"; // optional
    workout_notes?: string;                     // optional
    workout_complete: boolean;                  // required
}

generate_form_initialize();

/**
 * initializes account form logic
 */
function generate_form_initialize(): void {
    generator_submit_button.addEventListener("click", function () {
        if (validateGeneratorForm("generator_form") == true && CURRENT_USER_ID) {
            if (doesEventExistForUser(CURRENT_USER_ID) == true) {
                const temp_name = getEventNameByUserId(CURRENT_USER_ID);
                if (temp_name) {
                    popup_event_name.innerHTML = temp_name;
                }
                toggle_class(duplicate_event_popup, "trainr-popup-active");
            }
            else {
                const guid: string = generateGUID();
                createEvent(guid, CURRENT_USER_ID, event_name.value, event_date.value, event_distance.value, getEventGoalTime(), athlete_weeks_to_train.value, athlete_experience.value, getDaysToTrain());
                redirectToMySchedule();
            }
        }
        else if (validateGeneratorForm("generator_form") == true && !CURRENT_USER_ID) {
            toggle_class(account_event_popup, "trainr-popup-active");
        }
    });

    //replace event with user_id when confirm button is clicked on popup
    generator_submit_confirm_button.addEventListener("click", function () {
        if (CURRENT_USER_ID) {
            const guid: string = generateGUID();
            createEvent(guid, CURRENT_USER_ID, event_name.value, event_date.value, event_distance.value, getEventGoalTime(), athlete_weeks_to_train.value, athlete_experience.value, getDaysToTrain());
            redirectToMySchedule();
        }
    });

    //close popup on close button click
    close_popup_buttons.forEach((el) => {
        el.addEventListener("click", (event) => {
            const target = event.currentTarget as HTMLElement;
            const this_popup = target.closest(".trainr-popup-container") as HTMLElement;
            if (this_popup) {
                this_popup.classList.remove("trainr-popup-active");
            }
        });
    });

    //clear goal time input when goal pace is used
    event_goal_pace.addEventListener("input", function () {
        event_goal_time.value = "";
    });

    //clear goal pace input when goal time is used
    event_goal_time.addEventListener("input", function () {
        event_goal_pace.value = "";
    });

    days_to_train.forEach((el) => {
        el.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            toggle_class(target, "day-selected");
        });
    });

    //click event for popup sign in button
    generator_sign_in_button.addEventListener("click", function () {
        const guid: string = generateGUID();
        createEvent(guid, "", event_name.value, event_date.value, event_distance.value, getEventGoalTime(), athlete_weeks_to_train.value, athlete_experience.value, getDaysToTrain());
        sessionStorage.setItem("event_id_to_associate", guid);
        window.location.href = "/sign-in?associate-event";
    });

    //click event for popup create account button
    generator_create_account_button.addEventListener("click", function () {
        const guid: string = generateGUID();
        createEvent(guid, "", event_name.value, event_date.value, event_distance.value, getEventGoalTime(), athlete_weeks_to_train.value, athlete_experience.value, getDaysToTrain());
        sessionStorage.setItem("event_id_to_associate", guid);
        window.location.href = "/create-account?associate-event";
    });

    //click event for popup force submit button
    generator_force_submit_button.addEventListener("click", function () {
        const guid: string = generateGUID();
        createEvent(guid, "", event_name.value, event_date.value, event_distance.value, getEventGoalTime(), athlete_weeks_to_train.value, athlete_experience.value, getDaysToTrain());
        sessionStorage.setItem("event_id_to_associate", guid);
        redirectToMySchedule();
    });
}

function validateGeneratorForm(form_id: string): boolean {
    let is_valid = true;

    clearFormErrors(form_id);

    //check if time is valid
    if (!event_goal_time.value && !event_goal_pace.value || event_goal_time.value && isValidTimeFormat(event_goal_time.value) === false && !event_goal_pace.value) {
        event_goal_time.closest(".form-item")?.classList.add("form-item-error");
        is_valid = false;
    }
    else {
        event_goal_time.closest(".form-item")?.classList.remove("form-item-error");
    }

    //check if pace is valid
    if (event_goal_pace.value && isValidTimeFormat(event_goal_pace.value) === false && !event_goal_time.value) {
        event_goal_pace.closest(".form-item")?.classList.add("form-item-error");
        is_valid = false;
    }
    else {
        event_goal_pace.closest(".form-item")?.classList.remove("form-item-error");
    }

    //check if inputs are empty
    const inputs = document.querySelectorAll<HTMLInputElement>("#" + form_id + " input");

    inputs.forEach((el) => {
        if (el.value == null || el.value == "") {
            if (el.id.includes("event_goal_pace") || el.id.includes("event_goal_time")) {
                //skip goal pace & time
            }
            else {
                el.closest(".form-item")?.classList.add("form-item-error");
                is_valid = false;
            }
        }
    });

    //check if selects are empty
    const selects = document.querySelectorAll<HTMLInputElement>("#" + form_id + " select");

    selects.forEach((el) => {
        if (el.value == null || el.value == "") {
            el.closest(".form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
    });

    return is_valid;
}

function clearFormErrors(form_id: string): void {
    //check if inputs are empty
    const inputs = document.querySelectorAll<HTMLInputElement>("#" + form_id + " input");

    inputs.forEach((el) => {
        el.closest(".form-item")?.classList.remove("form-item-error");
    });

    //check if selects are empty
    const selects = document.querySelectorAll<HTMLInputElement>("#" + form_id + " select");

    selects.forEach((el) => {
        el.closest(".form-item")?.classList.remove("form-item-error");
    });
}

function createEvent(event_id: string, user_id: string, event_name: string, event_date: string, event_distance: string, event_goal_time: string, athlete_weeks_to_train: string, athlete_experience: string, days_to_train: TrainrWorkout["workout_day"][]): void {
    const plan = generateWorkoutPlan({
        event_id: event_id,
        event_distance: event_distance,
        event_goal_time: normalizeToHHMMSS(event_goal_time),
        athlete_weeks_to_train: Number(athlete_weeks_to_train),
        athlete_experience: athlete_experience as "Beginner" | "Intermediate" | "Experienced",
        athlete_days_to_train: days_to_train,

    });
    console.log(plan);

    const newEvent: TrainrEvent = {
        event_id: event_id,
        user_id: user_id,
        event_name: event_name,
        event_date: event_date,
        event_distance: event_distance,
        event_goal_time: normalizeToHHMMSS(event_goal_time),
        athlete_weeks_to_train: Number(athlete_weeks_to_train),
        athlete_experience: athlete_experience,
        days_to_train: days_to_train,
        workout_plan: plan,
    };

    addEventToLocalStorage(newEvent);
}

function addEventToLocalStorage(newEvent: TrainrEvent): void {
    const existing = localStorage.getItem("trainr_events");
    let events: TrainrEvent[] = existing ? JSON.parse(existing) : [];

    const index = events.findIndex((e) => e.user_id === newEvent.user_id);

    if (index !== -1) {
        // Replace existing event if an event with the newEvent's user_id already exists
        events[index] = newEvent;
    } else {
        // Add new event
        events.push(newEvent);
    }

    localStorage.setItem("trainr_events", JSON.stringify(events));
}

function getEventGoalTime(): string {
    let goal_time: string = "";
    if (event_goal_pace.value) {
        goal_time = calculateTotalTimeFromPace(event_goal_pace.value, event_distance.value);
    }
    else {
        goal_time = event_goal_time.value;
    }

    return goal_time;
}

function calculateTotalTimeFromPace(pace: string, distance: string): string {
    const [min, sec] = pace.split(":").map(Number);
    const miles = parseFloat(distance);

    if (isNaN(min) || isNaN(sec) || isNaN(miles) || miles <= 0) {
        return "Invalid input";
    }

    const paceInSeconds = (min * 60) + sec;
    const totalSeconds = Math.round(paceInSeconds * miles);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function getDaysToTrain(): TrainrWorkout["workout_day"][] {
    let result: string[] = [];

    days_to_train.forEach((el) => {
        if (el.classList.contains("day-selected")) {
            const day = el.querySelector<HTMLElement>(".caption-copy")?.innerHTML;
            if (day) {
                result.push(day);
            }
        }
    });

    if (result.length == 0) {
        result = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    }

    return toAthleteDays(result);
}

function toAthleteDays(days: string[]): TrainrWorkout["workout_day"][] {
    const validDays: TrainrWorkout["workout_day"][] = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];

    return days.filter((day): day is TrainrWorkout["workout_day"] =>
        validDays.includes(day as TrainrWorkout["workout_day"])
    );
}

//* PLAN GENERATION SCRIPT */

const allWeekDays: TrainrWorkout["workout_day"][] = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

function parseTimeToSeconds(time: string): number {
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
}

function formatSecondsToPace(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function selectTrainingDaysWithoutConsecutiveRest(
    preferredDays: TrainrWorkout["workout_day"][],
    maxTrainingDays: number = 5
): TrainrWorkout["workout_day"][] {
    const ordered = allWeekDays.filter((d) => preferredDays.includes(d));
    const combinations: TrainrWorkout["workout_day"][][] = [];

    const generateCombos = (
        current: TrainrWorkout["workout_day"][],
        remaining: TrainrWorkout["workout_day"][]
    ) => {
        if (current.length === maxTrainingDays) {
            combinations.push(current);
            return;
        }
        for (let i = 0; i < remaining.length; i++) {
            generateCombos([...current, remaining[i]], remaining.slice(i + 1));
        }
    };

    generateCombos([], ordered);

    for (const combo of combinations) {
        const trainingSet = new Set(combo);
        let hasConsecRests = false;

        for (let i = 0; i < allWeekDays.length - 1; i++) {
            const isRestToday = !trainingSet.has(allWeekDays[i]);
            const isRestNext = !trainingSet.has(allWeekDays[i + 1]);
            if (isRestToday && isRestNext) {
                hasConsecRests = true;
                break;
            }
        }

        if (!hasConsecRests) {
            return combo.sort((a, b) => allWeekDays.indexOf(a) - allWeekDays.indexOf(b));
        }
    }

    // fallback: use first available
    return ordered.slice(0, maxTrainingDays);
}

export function generateWorkoutPlan(params: {
    event_id: string;
    event_distance: string;
    event_goal_time: string;
    athlete_weeks_to_train: number;
    athlete_experience: "Beginner" | "Intermediate" | "Experienced";
    athlete_days_to_train: TrainrWorkout["workout_day"][]; // preferred workout days
}): TrainrWorkout[][] {
    const {
        event_id,
        event_distance,
        event_goal_time,
        athlete_weeks_to_train,
        athlete_experience,
        athlete_days_to_train,
    } = params;

    const totalDistance = parseFloat(event_distance);
    const goalSeconds = parseTimeToSeconds(event_goal_time);
    const goalPaceSec = goalSeconds / totalDistance;

    const basePace: Record<TrainrWorkout["workout_type"], number> = {
        "easy run": goalPaceSec * 1.1,
        "tempo run": goalPaceSec * 0.95,
        "long run": goalPaceSec,
        "rest day": 0,
    };

    const intensityScale = {
        Beginner: 1,
        Intermediate: 1.2,
        Experienced: 1.5,
    }[athlete_experience];

    const baseDistancePerWorkout = totalDistance / (athlete_weeks_to_train * 5) * 10;
    const taperStart = Math.max(athlete_weeks_to_train - 2, 1);

    const allWeeks: TrainrWorkout[][] = [];

    for (let week = 0; week < athlete_weeks_to_train; week++) {
        const weekIntensityFactor =
            week < taperStart
                ? 0.8 + (week / athlete_weeks_to_train) * 1
                : 0.6 + (week / athlete_weeks_to_train) * 0.1;

        const trainingDays = selectTrainingDaysWithoutConsecutiveRest(athlete_days_to_train, 5);

        // Prefer long run on weekend
        const longRunDay =
            (["Sunday", "Saturday"] as TrainrWorkout["workout_day"][]).find((d) =>
                trainingDays.includes(d)
            ) ?? trainingDays[trainingDays.length - 1];

        // Tempo run should be at least 2 days from long run
        const longIdx = allWeekDays.indexOf(longRunDay);
        const tempoRunDay =
            trainingDays.find(
                (d) => Math.abs(allWeekDays.indexOf(d) - longIdx) > 1
            ) ?? trainingDays[0];

        const weekWorkouts: TrainrWorkout[] = [];

        for (const day of allWeekDays) {
            let workout_type: TrainrWorkout["workout_type"];

            if (!athlete_days_to_train.includes(day) || !trainingDays.includes(day)) {
                workout_type = "rest day";
            } else if (day === tempoRunDay) {
                workout_type = "tempo run";
            } else if (day === longRunDay) {
                workout_type = "long run";
            } else {
                workout_type = "easy run";
            }

            const distMultiplier = {
                "easy run": 1,
                "tempo run": 1.5,
                "long run": 2.5,
                "rest day": 0,
            }[workout_type];

            const eventMultiplier = {
                "3.1": 3,
                "6.2": 1.8,
                "13.1": 1.2,
                "26.2": 1,
            }[event_distance] ?? 1;

            const rawDistance =
                baseDistancePerWorkout * distMultiplier * weekIntensityFactor * intensityScale * eventMultiplier;

            const workout: TrainrWorkout = {
                workout_id: uuidv4(),
                event_id,
                workout_distance:
                    workout_type === "rest day" ? 0 : parseInt(rawDistance.toFixed(1)),
                workout_type,
                workout_difficulty: undefined,
                workout_day: day,
                workout_target_pace:
                    workout_type === "rest day"
                        ? undefined
                        : formatSecondsToPace(basePace[workout_type]),
                workout_complete: false,
                workout_time: undefined,
                workout_notes: undefined,
            };

            weekWorkouts.push(workout);
        }

        allWeeks.push(weekWorkouts);
    }

    return allWeeks;
}