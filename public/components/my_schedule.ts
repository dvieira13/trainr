import { TrainrEvent, TrainrWorkout } from "./generate_plan";
import { getEventByUserId, getEventById, doesEventExistForUser, getWorkoutById, toggle_class, normalizeToHHMMSS, isValidTimeFormat, cleanUpTimeString } from "./tools";
import * as XLSX from "xlsx";

let CURRENT_USER_ID: string;
let CURRENT_WORKOUT_ID: string;
let CURRENT_EVENT: TrainrEvent | null;


//Workout Popup
const workout_popup = document.querySelector("#workout_popup") as HTMLElement;
const close_popup = document.querySelector(".close-popup") as HTMLElement;
const form_checkbox = document.querySelector(".form-checkbox") as HTMLElement;
const workout_popup_save_button = document.querySelector("#workout_popup_save_button") as HTMLElement;
// - popup values
const popup_distance = document.querySelector("#popup_distance") as HTMLElement;
const popup_icon = document.querySelector("#popup_icon") as HTMLImageElement;
const popup_type = document.querySelector("#popup_type") as HTMLAnchorElement;
const popup_type_text = document.querySelector("#popup_type h5") as HTMLElement;
const popup_pace = document.querySelectorAll<HTMLElement>(".popup_pace");
// - popup inputs
const popup_time = document.querySelector("#popup_time") as HTMLInputElement;
const popup_difficulty = document.querySelector("#popup_difficulty") as HTMLInputElement;
const popup_notes = document.querySelector("#popup_notes") as HTMLInputElement;

const generate_plan_comp = document.querySelector(".generate-plan-comp") as HTMLElement;
const schedule_comp = document.querySelector(".schedule-comp") as HTMLElement;
const table_body = document.querySelector(".schedule-body") as HTMLElement;
const table_title = document.querySelector(".schedule-title h2") as HTMLElement;
const export_schedule_button = document.querySelector("#export_schedule_button") as HTMLElement;

my_schedule_initialize();

/**
 * initializes my schedule page 
 */
function my_schedule_initialize(): void {
    const user_id = sessionStorage.getItem("user_id");
    const session_event_id = sessionStorage.getItem("event_id_to_associate");
    if (user_id) {
        CURRENT_USER_ID = user_id;

        if (doesEventExistForUser(CURRENT_USER_ID) == true) {
            CURRENT_EVENT = getEventByUserId(CURRENT_USER_ID);
            if (CURRENT_EVENT) {
                if (table_body && CURRENT_EVENT.workout_plan) {
                    setTableTitle(CURRENT_EVENT, table_title);
                    renderWorkoutPlanTableRows(CURRENT_EVENT.workout_plan, table_body);
                    schedule_comp.classList.remove("hide-schedule-comp");
                }
            }
        }
        else {
            generate_plan_comp.classList.remove("hide-schedule-comp");
        }
    }
    else if (!user_id && session_event_id) {
        CURRENT_EVENT = getEventById(session_event_id);
        if (CURRENT_EVENT) {
            if (table_body && CURRENT_EVENT.workout_plan) {
                setTableTitle(CURRENT_EVENT, table_title);
                renderWorkoutPlanTableRows(CURRENT_EVENT.workout_plan, table_body);
                schedule_comp.classList.remove("hide-schedule-comp");
            }
        }
    }
    else {
        generate_plan_comp.classList.remove("hide-schedule-comp");
    }

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;

        //click event for checkbox
        if (target.classList.contains("checkbox")) {
            const cell = target.closest(".workout-cell");
            if (cell) {
                if (cell.classList.contains("cell-completed") && CURRENT_EVENT) {
                    updateWorkoutFieldInLocalStorage(CURRENT_EVENT.event_id, cell.id.replace("workout-", ""), "workout_complete", false);
                }
                else if (!cell.classList.contains("cell-completed") && CURRENT_EVENT) {
                    updateWorkoutFieldInLocalStorage(CURRENT_EVENT.event_id, cell.id.replace("workout-", ""), "workout_complete", true);
                }
                cell.classList.toggle("cell-completed");
            }
        }

        //click event for workout cell
        if (target.classList.contains("workout-cell") && !target.classList.contains("checkbox") && !target.classList.contains("rest-cell")) {
            if (CURRENT_EVENT) {
                CURRENT_WORKOUT_ID = target.id.replace("workout-", "");
                populateWorkoutPopup(getWorkoutById(CURRENT_EVENT.event_id, CURRENT_WORKOUT_ID));
                toggle_class(workout_popup, "trainr-popup-active");
            }
        }
    });

    //close popup on close button click
    close_popup.addEventListener("click", function () {
        workout_popup.classList.remove("trainr-popup-active");
    });

    //form checkbox click event
    form_checkbox.addEventListener("click", function () {
        form_checkbox.classList.toggle("checkbox-selected");
    });

    //save workout button click event
    workout_popup_save_button.addEventListener("click", function () {
        if (validateWorkoutPopupForm() == true && CURRENT_EVENT) {
            const temp_difficulty = popup_difficulty.value as "Easy" | "Medium" | "Difficult";
            const is_workout_complete = isPopupCheckboxSelected(form_checkbox);
            updateWorkoutInLocalStorage(CURRENT_EVENT.event_id, CURRENT_WORKOUT_ID, normalizeToHHMMSS(popup_time.value), temp_difficulty, popup_notes.value, is_workout_complete);
            updateCellCheckedStatus(is_workout_complete, CURRENT_WORKOUT_ID);
            workout_popup.classList.remove("trainr-popup-active");
        }
    });

    //export schedule click event
    export_schedule_button.addEventListener("click", function () {
        exportScheduleTableAsExcel(".schedule");
    });
}

function setTableTitle(user_event: TrainrEvent, tableTitleElement: HTMLElement): void {
    tableTitleElement.innerHTML = user_event.event_name;
}

function renderWorkoutPlanTableRows(
    workout_plan: TrainrWorkout[][],
    tableBodyElement: HTMLElement
): void {
    tableBodyElement.innerHTML = ""; // Clear previous rows

    const maxWorkouts = Math.max(...workout_plan.map(week => week.length));

    workout_plan.forEach((weekWorkouts, weekIndex) => {
        const tr = document.createElement("tr");

        // Week label
        const weekLabelTd = document.createElement("td");
        weekLabelTd.className = "week-label";
        weekLabelTd.innerHTML = `<h5 class="bold-text">${weekIndex + 1}</h5>`;
        tr.appendChild(weekLabelTd);

        weekWorkouts.forEach((workout) => {
            const td = document.createElement("td");
            td.id = "workout-" + workout.workout_id; // ✅ Set id attribute
            let distance_label = "miles";
            if (workout.workout_distance <= 1) {
                distance_label = "mile";
            }

            if (workout.workout_type === "rest day") {
                td.className = "workout-cell rest-cell";
                td.innerHTML = `<p class="body-copy bold-text">rest</p>`;
            } else {
                td.className = `workout-cell ${workout.workout_complete ? "cell-completed" : ""}`;
                td.innerHTML = `
            <div class="checkbox"></div>
            <p class="body-copy bold-text">${workout.workout_distance} ${distance_label}</p>
            <p class="caption-copy bold-text">${workout.workout_type}</p>
            <img class="expand-icon" src="./src/assets/icons/expand.svg" />
          `;
            }

            tr.appendChild(td);
        });

        // Padding if this week has fewer workouts
        for (let i = weekWorkouts.length; i < maxWorkouts; i++) {
            const emptyTd = document.createElement("td");
            emptyTd.className = "workout-cell empty";
            tr.appendChild(emptyTd);
        }

        tableBodyElement.appendChild(tr);
    });
}

function populateWorkoutPopup(workout: TrainrWorkout | null): void {
    if (workout) {
        if (workout.workout_distance <= 1) {
            popup_distance.innerHTML = workout.workout_distance + " mile";
        }
        else {
            popup_distance.innerHTML = workout.workout_distance + " miles";
        }
        popup_pace.forEach((element) => {
            if(workout.workout_target_pace){
                element.innerHTML = cleanUpTimeString(workout.workout_target_pace.toString()) + " target pace";
            }
        });
        popup_icon.src = getPopupIconSrc(workout.workout_type);
        popup_type_text.innerHTML = workout.workout_type;
        popup_type.href = getPopupTypeLink(workout.workout_type);

        if (workout.workout_complete == true) {
            form_checkbox.classList.add("checkbox-selected");
        }
        else if (workout.workout_complete == false) {
            form_checkbox.classList.remove("checkbox-selected");
        }

        if (workout.workout_difficulty) {
            popup_difficulty.value = workout.workout_difficulty;
        }
        else {
            popup_difficulty.value = "";
        }

        if (workout.workout_time) {
            popup_time.value = workout.workout_time;
        }
        else {
            popup_time.value = "";
        }

        if (workout.workout_notes) {
            popup_notes.value = workout.workout_notes;
        }
        else {
            popup_notes.value = "";
        }
    }
}

function validateWorkoutPopupForm(): boolean {
    let is_valid = true;

    //check if time is valid
    if (popup_time.value && isValidTimeFormat(popup_time.value) === false) {
        popup_time.closest(".form-item")?.classList.add("form-item-error");
        is_valid = false;
    }
    else if (popup_time.value && isValidTimeFormat(popup_time.value) === true) {
        popup_time.closest(".form-item")?.classList.remove("form-item-error");
    }

    return is_valid;
}

function updateWorkoutInLocalStorage(event_id: string, workout_id: string, popup_time: string, popup_difficulty: "Easy" | "Medium" | "Difficult", popup_notes: string, is_workout_complete: boolean): void {
    updateWorkoutFieldInLocalStorage(event_id, workout_id, "workout_time", popup_time);
    updateWorkoutFieldInLocalStorage(event_id, workout_id, "workout_difficulty", popup_difficulty);
    updateWorkoutFieldInLocalStorage(event_id, workout_id, "workout_notes", popup_notes);
    updateWorkoutFieldInLocalStorage(event_id, workout_id, "workout_complete", is_workout_complete);
}

function updateWorkoutFieldInLocalStorage<T extends keyof TrainrWorkout>(
    event_id: string,
    workout_id: string,
    field: T,
    value: TrainrWorkout[T]
): void {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const eventIndex = events.findIndex((e) => e.event_id === event_id);
    if (eventIndex === -1) return;

    const event = events[eventIndex];
    if (!event.workout_plan) return;

    // Update the matching workout
    event.workout_plan = event.workout_plan.map((week) =>
        week.map((workout) =>
            workout.workout_id === workout_id
                ? { ...workout, [field]: value }
                : workout
        )
    );

    // Save the updated event back
    events[eventIndex] = event;
    localStorage.setItem("trainr_events", JSON.stringify(events));
}

function updateCellCheckedStatus(is_workout_complete: boolean, workout_id: string): void {
    const current_cell = document.querySelector("#workout-" + workout_id);
    if (is_workout_complete == true && current_cell) {
        current_cell.classList.add("cell-completed");
    }
    else if (is_workout_complete == false && current_cell) {
        current_cell.classList.remove("cell-completed");
    }
}

function getPopupIconSrc(workout_type: string): string {
    let icon_src: string;

    switch (workout_type) {
        case "easy run":
            icon_src = "./src/assets/icons/easy_run.svg";
            break;
        case "tempo run":
            icon_src = "./src/assets/icons/tempo_run.svg";
            break;
        case "long run":
            icon_src = "./src/assets/icons/long_run.svg";
            break;
        default:
            icon_src = "./src/assets/icons/easy_run.svg";
    }

    return icon_src;
}

function getPopupTypeLink(workout_type: string): string {
    let type_link: string;

    switch (workout_type) {
        case "easy run":
            type_link = "/workout-types#easy_run";
            break;
        case "tempo run":
            type_link = "/workout-types#tempo_run";
            break;
        case "long run":
            type_link = "/workout-types#long_run";
            break;
        default:
            type_link = "/workout-types#easy_run";
    }

    return type_link;
}

function isPopupCheckboxSelected(checkbox_element: HTMLElement): boolean {
    if (checkbox_element.classList.contains("checkbox-selected")) {
        return true;
    }
    else {
        return false;
    }
}

export function exportScheduleTableAsExcel(tableSelector: string, filename: string = "workout_schedule.xlsx"): void {
    const table = document.querySelector<HTMLTableElement>(tableSelector);
    if (!table) {
        console.error("Table not found:", tableSelector);
        return;
    }

    const worksheet = XLSX.utils.table_to_sheet(table);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");

    XLSX.writeFile(workbook, filename);
}