import { TrainrUser } from "./account";
import { TrainrEvent } from "./generate_plan";
import { doesEventExistForUser, calculatePacePerMileFromTotalTime, cleanUpTimeString, getEventByUserId } from "./tools";

let CURRENT_USER_ID: string;
let CURRENT_USER: TrainrUser | null;

const user_name = document.querySelector("#user_name") as HTMLElement;
const user_miles = document.querySelector("#user_miles") as HTMLElement;
const user_time = document.querySelector("#user_time") as HTMLElement;
const user_workouts = document.querySelector("#user_workouts") as HTMLElement;

const no_event_comp = document.querySelector(".no_event_comp") as HTMLElement;
const has_event_comp = document.querySelectorAll<HTMLElement>(".has_event_comp");

my_account_initialize();

/**
 * initializes my account page 
 */
function my_account_initialize(): void {
    const id = sessionStorage.getItem("user_id");
    if (id) {
        CURRENT_USER_ID = id;
        CURRENT_USER = getUserById(CURRENT_USER_ID);

        if (CURRENT_USER != null) {
            if (doesEventExistForUser(CURRENT_USER_ID) == true) {
                let user_event = getEventByUserId(CURRENT_USER_ID);
                if (user_event) {
                    populateUserPanelWithEvent(CURRENT_USER, user_event)
                    populateDashboardContent(user_event);
                }

                has_event_comp.forEach((el) => {
                    el.classList.remove("hide-account-comp");
                });
            }
            else {
                populateUserPanel(CURRENT_USER);
                no_event_comp.classList.remove("hide-account-comp");
            }
        }
    }
}

function getUserById(userId: string): TrainrUser | null {
    const existing = localStorage.getItem("trainr_users");
    if (!existing) return null;

    const users: TrainrUser[] = JSON.parse(existing);

    const user = users.find((u) => u.user_id === userId);
    return user ?? null;
}

function populateUserPanel(user: TrainrUser): void {
    user_name.innerHTML = user.user_first_name + " " + user.user_last_name;
    user_miles.innerHTML = user.user_total_miles.toString();
    user_time.innerHTML = user.user_total_time;
    user_workouts.innerHTML = user.user_total_workouts.toString();
}

function populateUserPanelWithEvent(user: TrainrUser, event: TrainrEvent): void {
    user_name.innerHTML = user.user_first_name + " " + user.user_last_name;
    user_miles.innerHTML = getTotalCompletedMiles(event.event_id).toString();
    user_time.innerHTML = cleanUpTimeString(getTotalCompletedWorkoutTime(event.event_id));
    user_workouts.innerHTML = countCompletedWorkouts(event.event_id).toString();
}

function populateDashboardContent(event: TrainrEvent): void {
    setMyEventHeaderComp(event.event_name);
    setEventCountdownComp(getDaysUntil(event.event_date).toString(), countIncompleteWorkouts(event.event_id).toString());
    setEventGoalsComp(cleanUpTimeString(event.event_goal_time), cleanUpTimeString(calculatePacePerMileFromTotalTime(event.event_goal_time, event.event_distance)));
    setTrainingProgress(getWorkoutCompletionPercent(event.event_id).toString());
}

function setMyEventHeaderComp(eventName: string): void {
    const event_name = document.querySelector("#event_name") as HTMLElement;
    event_name.innerHTML = eventName;
}

function setEventCountdownComp(daysUntilRace: string, workoutsRemaining: string): void {
    const days_until_race = document.querySelector("#days_until_race") as HTMLElement;
    const workouts_remaining = document.querySelector("#workouts_remaining") as HTMLElement;
    days_until_race.innerHTML = daysUntilRace;
    workouts_remaining.innerHTML = workoutsRemaining;
}

function setTrainingProgress(trainingProgress: string): void {
    const training_progress = document.querySelector("#training_progress") as HTMLElement;
    const progress_bar_fill = document.querySelector(".progress-bar-fill") as HTMLElement;
    const progress_percentage = progress_bar_fill.querySelector(".progress-percentage") as HTMLElement;
    training_progress.innerHTML = trainingProgress + "%";
    progress_bar_fill.style.width = trainingProgress + "%";

    if (Number(trainingProgress) < 15) {
        progress_percentage.classList.remove("percentage-inside");
    }
}

function setEventGoalsComp(totalTimeGoal: string, avgPaceGoal: string): void {
    const total_time_goal = document.querySelector("#total_time_goal") as HTMLElement;
    const avg_pace_goal = document.querySelector("#avg_pace_goal") as HTMLElement;
    total_time_goal.innerHTML = totalTimeGoal;
    avg_pace_goal.innerHTML = avgPaceGoal;
}

function getDaysUntil(dateString: string): number {
    const targetDate = new Date(dateString);
    const today = new Date();

    // Clear the time portion for accurate full-day diff
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffInMs = targetDate.getTime() - today.getTime();
    return Math.ceil(diffInMs / msPerDay);
}

function countIncompleteWorkouts(event_id: string): number {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return 0;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const event = events.find((e) => e.event_id === event_id);
    if (!event || !event.workout_plan) return 0;

    let count = 0;

    for (const week of event.workout_plan) {
        for (const workout of week) {
            if (!workout.workout_complete && workout.workout_type !== "rest day") {
                count++;
            }
        }
    }

    return count;
}

function countCompletedWorkouts(event_id: string): number {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return 0;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const event = events.find((e) => e.event_id === event_id);
    if (!event || !event.workout_plan) return 0;

    let count = 0;

    for (const week of event.workout_plan) {
        for (const workout of week) {
            if (workout.workout_type !== "rest day" && workout.workout_complete) {
                count++;
            }
        }
    }

    return count;
}

function getWorkoutCompletionPercent(event_id: string): number {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return 0;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const event = events.find((e) => e.event_id === event_id);
    if (!event || !event.workout_plan) return 0;

    let totalWorkouts = 0;
    let completedWorkouts = 0;

    for (const week of event.workout_plan) {
        for (const workout of week) {
            if (workout.workout_type !== "rest day") {
                totalWorkouts++;
                if (workout.workout_complete) {
                    completedWorkouts++;
                }
            }
        }
    }

    if (totalWorkouts === 0) return 0;
    return Math.round((completedWorkouts / totalWorkouts) * 100);
}

function getTotalCompletedMiles(event_id: string): number {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return 0;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const event = events.find((e) => e.event_id === event_id);
    if (!event || !event.workout_plan) return 0;

    let total = 0;

    for (const week of event.workout_plan) {
        for (const workout of week) {
            if (workout.workout_complete && workout.workout_type !== "rest day") {
                total += workout.workout_distance;
            }
        }
    }

    return parseFloat(total.toFixed(1)); // round to 1 decimal place
}

function getTotalCompletedWorkoutTime(event_id: string): string {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return "00:00:00";

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const event = events.find((e) => e.event_id === event_id);
    if (!event || !event.workout_plan) return "00:00:00";

    let totalSeconds = 0;

    for (const week of event.workout_plan) {
        for (const workout of week) {
            if (
                workout.workout_complete &&
                workout.workout_type !== "rest day" &&
                workout.workout_time
            ) {
                const [h, m, s] = workout.workout_time.split(":").map(Number);
                totalSeconds += h * 3600 + m * 60 + s;
            }
        }
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}