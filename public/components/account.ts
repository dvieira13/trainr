import { generateGUID, redirectToMyAccount, redirectToMySchedule, updateEventUserId, replaceUserEvent, removeSessionItem, doesEventExistForUser, getEventNameByUserId, getEventNameById, toggle_class } from "./tools";

let CURRENT_USER_ID: string;

const form = document.querySelector(".account-form") as HTMLElement;
const submit_button = document.querySelector(".account-form-cta") as HTMLElement;

const sign_in_form_id: string = "sign_in_form";
const create_account_form_id: string = "create_account_form";

//Sign In & Create Account inputs
const username = document.querySelector("#username") as HTMLInputElement;
const password = document.querySelector("#password") as HTMLInputElement;
//Create Account inputs
// - will set values if user is on Create Account page
let first_name: HTMLInputElement;
let last_name: HTMLInputElement;
let confirm_password: HTMLInputElement;

//Duplicate Event Popup
const duplicate_event_popup = document.querySelector("#duplicate_event_popup") as HTMLElement;
const associator_replace_event_button = document.querySelector("#associator_replace_event_button") as HTMLElement;
const associator_force_submit_button = document.querySelector("#associator_force_submit_button") as HTMLElement;
const popup_event_name = document.querySelector("#popup_event_name") as HTMLElement;
const popup_new_event_name = document.querySelector("#popup_new_event_name") as HTMLElement;
const close_popup = document.querySelector(".close-popup") as HTMLElement;

//Associate Message
const associate_message = document.querySelector(".associate-message") as HTMLElement;
const associate_message_name = document.querySelector("#associate_message_name") as HTMLElement;

//user interface
export interface TrainrUser {
    user_id: string;             // GUID, required
    user_first_name: string;      // required
    user_last_name: string;       // required
    user_username: string;             // required
    user_password: string;             // required
    user_total_miles: number;    // required, default 0
    user_total_time: string;     // required, default "0:00"
    user_total_workouts: number; // required, default 0
}

account_form_initialize();

/**
 * initializes account form logic
 */
function account_form_initialize(): void {
    const session_event_id = sessionStorage.getItem("event_id_to_associate");
    if (session_event_id) {
        associate_message.classList.remove("hide-associate-message");
        const temp_name = getEventNameById(session_event_id);
        if (temp_name) {
            associate_message_name.innerHTML = temp_name;
        }
    }

    //set inputs unique to Create Account if applicable
    if (form && form.id == create_account_form_id) {
        first_name = document.querySelector("#first_name") as HTMLInputElement;
        last_name = document.querySelector("#last_name") as HTMLInputElement;
        confirm_password = document.querySelector("#confirm_password") as HTMLInputElement;
    }

    submit_button?.addEventListener("click", function () {
        //checks if user created event(workout plan) before signing in/creating account
        if (session_event_id) {
            if (form && form.id == sign_in_form_id && validateAccountForm(sign_in_form_id) == true) {
                if (doesEventExistForUser(CURRENT_USER_ID) == true) {
                    const temp_name = getEventNameByUserId(CURRENT_USER_ID);
                    if (temp_name) {
                        popup_event_name.innerHTML = temp_name;
                    }
                    const temp_new_name = getEventNameById(session_event_id);
                    if (temp_new_name) {
                        popup_new_event_name.innerHTML = temp_new_name;
                    }
                    toggle_class(duplicate_event_popup, "trainr-popup-active");
                }
                else {
                    saveUserIdToSession(CURRENT_USER_ID);
                    removeSessionItem("event_id_to_associate");
                    //if user came from plan generation send them straight to schedule
                    if (window.location.href.includes("associate-event")) {
                        redirectToMySchedule();
                    }
                    else {
                        redirectToMyAccount();
                    }
                }
            }
            else if (form && form.id == create_account_form_id && validateAccountForm(create_account_form_id) == true) {
                createUser(first_name.value, last_name.value, username.value, password.value);
                updateEventUserId(session_event_id, CURRENT_USER_ID);
                saveUserIdToSession(CURRENT_USER_ID);
                removeSessionItem("event_id_to_associate");
                //if user came from plan generation send them straight to schedule
                if (window.location.href.includes("associate-event")) {
                    redirectToMySchedule();
                }
                else {
                    redirectToMyAccount();
                }
            }
        }
        else {
            if (form && form.id == sign_in_form_id && validateAccountForm(sign_in_form_id) == true) {
                saveUserIdToSession(CURRENT_USER_ID);
                redirectToMyAccount();
            }
            else if (form && form.id == create_account_form_id && validateAccountForm(create_account_form_id) == true) {
                createUser(first_name.value, last_name.value, username.value, password.value);
                saveUserIdToSession(CURRENT_USER_ID);
                redirectToMyAccount();
            }
        }
    });

    //close popup on close button click
    close_popup.addEventListener("click", function () {
        const this_popup = this.closest(".trainr-popup-container") as HTMLElement;
        if (this_popup) {
            this_popup.classList.remove("trainr-popup-active");
        }
    });

    associator_replace_event_button.addEventListener("click", function () {
        if (session_event_id) {
            replaceUserEvent(session_event_id, CURRENT_USER_ID);
            saveUserIdToSession(CURRENT_USER_ID);
            removeSessionItem("event_id_to_associate");
            //if user came from plan generation send them straight to schedule
            if (window.location.href.includes("associate-event")) {
                redirectToMySchedule();
            }
            else {
                redirectToMyAccount();
            }
        }
    });

    associator_force_submit_button.addEventListener("click", function () {
        if (session_event_id) {
            saveUserIdToSession(CURRENT_USER_ID);
            removeSessionItem("event_id_to_associate");
            //if user came from plan generation send them straight to schedule
            if (window.location.href.includes("associate-event")) {
                redirectToMySchedule();
            }
            else {
                redirectToMyAccount();
            }
        }
    });
}

function validateAccountForm(form_id: string): boolean {
    let is_valid = true;

    //check if inputs are empty
    const inputs = document.querySelectorAll<HTMLInputElement>(".account-form input");
    inputs.forEach((el) => {
        if (el.value == null || el.value == "") {
            el.closest(".account-form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else if (el.closest(".account-form-item")?.classList.contains("form-item-error")) {
            el.closest(".account-form-item")?.classList.remove("form-item-error");
        }
    });

    if (form_id === sign_in_form_id) {
        //check if account exists
        if (username.value && password.value) {
            const fetched_user_id = getUserIdIfCredentialsMatch(username.value, password.value);
            if (fetched_user_id == null) {
                document.querySelector("#error_no_account_exists")?.classList.add("error-active");
                is_valid = false;
            }
            else {
                CURRENT_USER_ID = fetched_user_id;
            }
        }
    }
    else if (form_id === create_account_form_id) {
        //check if password & confirmed password match
        if (password.value != confirm_password.value) {
            document.querySelector("#error_password_match")?.classList.add("error-active");
            password.closest(".account-form-item")?.classList.add("form-item-error");
            confirm_password.closest(".account-form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else if (password.value && password.value === confirm_password.value) {
            document.querySelector("#error_password_match")?.classList.remove("error-active");
            password.closest(".account-form-item")?.classList.remove("form-item-error");
            confirm_password.closest(".account-form-item")?.classList.remove("form-item-error");
        }

        //check if username already exists
        if (username.value && doesUserNameExist(username.value) == true) {
            document.querySelector("#error_account_exists")?.classList.add("error-active");
            username.closest(".account-form-item")?.classList.add("form-item-error");
            is_valid = false;
        }
        else if (username.value && doesUserNameExist(username.value) == false) {
            document.querySelector("#error_account_exists")?.classList.remove("error-active");
            username.closest(".account-form-item")?.classList.remove("form-item-error");
        }
    }

    return is_valid;
}

function createUser(first_name: string, last_name: string, username: string, password: string): void {
    const temp_guid = generateGUID() as string;
    CURRENT_USER_ID = temp_guid;

    const newUser: TrainrUser = {
        user_id: temp_guid,
        user_first_name: first_name,
        user_last_name: last_name,
        user_username: username,
        user_password: password,
        user_total_miles: 0,
        user_total_time: "0:00",
        user_total_workouts: 0,
    };

    addUserToLocalStorage(newUser);
}

function addUserToLocalStorage(newUser: TrainrUser): void {
    const existing = localStorage.getItem("trainr_users");
    const users: TrainrUser[] = existing ? JSON.parse(existing) : [];

    users.push(newUser);

    localStorage.setItem("trainr_users", JSON.stringify(users));
}

export function saveUserIdToSession(userId: string): void {
    sessionStorage.setItem("user_id", userId);
}

function doesUserNameExist(username: string): boolean {
    const existing = localStorage.getItem("trainr_users");
    if (!existing) return false;

    const users: TrainrUser[] = JSON.parse(existing);

    return users.some(user => user.user_username === username);
}

function getUserIdIfCredentialsMatch(username: string, password: string): string | null {
    const existing = localStorage.getItem("trainr_users");
    if (!existing) return null;

    const users: TrainrUser[] = JSON.parse(existing);

    const user = users.find(
        (u) => u.user_username === username && u.user_password === password
    );

    return user ? user.user_id : null;
}
