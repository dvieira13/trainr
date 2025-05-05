import { TrainrEvent, TrainrWorkout } from "./generate_plan";

/**
 * 
 * @param element is HTMLElement
 * @param className is class to toggle
 */
export function toggle_class(element: HTMLElement, className: string): void {
    if (element.classList.contains(className)) {
        element.classList.remove(className);
    } else {
        element.classList.add(className);
    }
}

export function isDistanceValid(value: string): boolean {
    return /^[0-9]*\.?[0-9]*$/.test(value) && value.trim() !== "";
}

export function isTimeValid(value: string): boolean {
    const regex = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
    return regex.test(value);
}

export function isValidTimeFormat(time: string): boolean {
    const patterns = [
        /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/, // h:mm:ss or hh:mm:ss
        /^([0-9]{1,2}):([0-5][0-9])$/,              // m:ss or mm:ss
    ];

    return patterns.some((regex) => regex.test(time));
}

export function isPaceValid(value: string): boolean {
    const regex = /^(\d{1,2}):([0-5]\d)$/;
    return regex.test(value);
}

export function doesEventExistForUser(userId: string): boolean {
    const existing = localStorage.getItem("trainr_events");
    if (!existing) return false;

    const events: TrainrEvent[] = JSON.parse(existing);

    return events.some((event) => event.user_id === userId);
}

export function calculatePacePerMileFromTotalTime(totalTime: string, distance: string | number): string {
    const [h, m, s] = totalTime.split(":").map(Number);
    const totalSeconds = (h * 3600) + (m * 60) + s;
    const miles = typeof distance === "string" ? parseFloat(distance) : distance;

    if (isNaN(totalSeconds) || isNaN(miles) || miles <= 0) {
        return "Invalid input";
    }

    const paceSeconds = totalSeconds / miles;
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = Math.round(paceSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${pad(paceMin)}:${pad(paceSec)}`;
}

export function cleanUpTimeString(time: string): string {
    const parts = time.split(":").map(part => Number(part));

    if (parts.some(isNaN) || parts.length < 2 || parts.length > 3) {
        return "Invalid time format";
    }

    let h = 0, m = 0, s = 0;

    if (parts.length === 3) {
        [h, m, s] = parts;
    } else {
        [m, s] = parts;
    }

    const padSeconds = (n: number) => n.toString().padStart(2, "0");

    return h > 0
        ? `${h}:${m}:${padSeconds(s)}`
        : `${m}:${padSeconds(s)}`;
}

export function normalizeToHHMMSS(time: string): string {
    const parts = time.split(":").map(part => part.padStart(2, "0"));

    let h = "00", m = "00", s = "00";

    if (parts.length === 3) {
        [h, m, s] = parts;
    } else if (parts.length === 2) {
        [m, s] = parts;
    } else {
        return "00:00:00"; // invalid input
    }

    return `${h}:${m}:${s}`;
}

/**
* 
* @returns a GUID
*/
export function generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const rand = Math.random() * 16 | 0;
        const value = char === 'x' ? rand : (rand & 0x3 | 0x8);
        return value.toString(16);
    });
}

export function redirectToSignIn(): void {
    window.location.href = "/sign-in";
}

export function redirectToCreateAccount(): void {
    window.location.href = "/create-account";
}

export function redirectToMyAccount(): void {
    window.location.href = "/my-account";
}

export function redirectToMySchedule(): void {
    window.location.href = "/my-schedule";
}

export function getEventByUserId(userId: string): TrainrEvent | null {
    const existing = localStorage.getItem("trainr_events");
    if (!existing) return null;

    const events: TrainrEvent[] = JSON.parse(existing);
    return events.find((event) => event.user_id === userId) ?? null;
}

export function getEventNameByUserId(userId: string): string | null {
    const existing = localStorage.getItem("trainr_events");
    if (!existing) return null;

    const events: TrainrEvent[] = JSON.parse(existing);

    const event = events.find((e) => e.user_id === userId);

    return event ? event.event_name : null;
}

export function getEventNameById(event_id: string): string | null {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return null;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const event = events.find(e => e.event_id === event_id);
    return event?.event_name ?? null;
}

export function getEventById(event_id: string): TrainrEvent | null {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return null;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    return events.find(event => event.event_id === event_id) ?? null;
}

export function updateEventUserId(event_id: string, new_user_id: string): void {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const index = events.findIndex(e => e.event_id === event_id);
    if (index === -1) return;

    events[index].user_id = new_user_id;

    localStorage.setItem("trainr_events", JSON.stringify(events));
}

export function replaceUserEvent(event_id: string, user_id: string): void {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return;

    let events: TrainrEvent[] = JSON.parse(eventsJSON);

    // Remove other events for this user, excluding the one being assigned
    events = events.filter(e => !(e.user_id === user_id && e.event_id !== event_id));

    // Update user_id for the target event (in case it needs assignment)
    const target = events.find(e => e.event_id === event_id);
    if (target) {
        target.user_id = user_id;
    }

    localStorage.setItem("trainr_events", JSON.stringify(events));
}

export function removeSessionItem(key: string): void {
    sessionStorage.removeItem(key);
}

export function getWorkoutById(
    event_id: string,
    workout_id: string
): TrainrWorkout | null {
    const eventsJSON = localStorage.getItem("trainr_events");
    if (!eventsJSON) return null;

    const events: TrainrEvent[] = JSON.parse(eventsJSON);
    const event = events.find((e) => e.event_id === event_id);
    if (!event || !event.workout_plan) return null;

    for (const week of event.workout_plan) {
        const workout = week.find((w) => w.workout_id === workout_id);
        if (workout) return workout;
    }

    return null;
}