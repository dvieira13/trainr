import { toggle_class } from "./tools";

export function load_nav(containerId: string = "nav-placeholder"): void {
    const navHTML = `
      <div class="nav-desktop">
        <div class="nav-menu">
          <a class="nav-menu-option" href="/my-schedule" title="My Schedule">
            <p class="nav-menu-copy">My Schedule</p>
          </a>
          <a class="nav-menu-option" href="/generate-plan" title="Generate Plan">
            <p class="nav-menu-copy">Generate Plan</p>
          </a>
          <div class="nav-menu-option expandable-option">
            <div class="expandable-header">
              <p class="nav-menu-copy">More</p>
              <img class="nav-expand-icon" src="./assets/icons/show.svg" />
            </div>
            <div class="expandable-body">
              <a class="nav-menu-option" href="/pace-calculator" title="Pace Calculator">
                <p class="nav-menu-copy">Pace Calculator</p>
              </a>
              <a class="nav-menu-option" href="/workout-types" title="Workout Types">
                <p class="nav-menu-copy">Workout Types</p>
              </a>
            </div>
          </div>
        </div>
        <a class="nav-logo" href="/" title="trainr home">
          <img class="nav-logo-img" src="./assets/icons/trainr.svg" alt="trainr logo" />
        </a>
        <div class="nav-right-container">
          <a class="nav-cta active-nav-account-button" id="nav_sign_in_button" href="/sign-in">
            <p class="nav-cta-text">Sign In</p>
          </a>
          <a class="nav-cta" id="nav_my_account_button" href="/my-account">
            <p class="nav-cta-text">My Account</p>
          </a>
        </div>
      </div>
      <div class="nav-mobile">
        <a class="nav-logo" href="/" title="trainr home">
          <img class="nav-logo-img" src="./assets/icons/trainr.svg" alt="trainr logo" />
        </a>
        <div class="nav-mobile-button">
          <img class="nav-open-icon" src="./assets/icons/burger.svg" title="open nav">
        </div>
      </div>
    `;

    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = navHTML;

        const id = sessionStorage.getItem("user_id");
        if (id) {
            const account_buttons = container.querySelectorAll<HTMLAnchorElement>(".nav-cta");

            account_buttons.forEach((button) => {
                toggle_class(button, "active-nav-account-button");
            });
        }

        //add styling to nav option relative to current page
        const currentPath = window.location.pathname;
        const links = container.querySelectorAll<HTMLAnchorElement>("a");

        links.forEach((link) => {
            if (link.getAttribute("href") === currentPath) {
                link.classList.add("active-nav-option");
            }
        });
    }
    nav_initialize();
}

/**
 * initializes nav logic
 */
function nav_initialize(): void {
    const mobile_nav_burger = document.querySelector(".nav-mobile-button") as HTMLElement;
    const mobile_nav_expanded = document.querySelector(".nav-desktop") as HTMLElement;
    const expandable_header = document.querySelector(".expandable-header") as HTMLElement;
    const expandable_option = document.querySelector(".expandable-option") as HTMLElement;

    mobile_nav_burger?.addEventListener("click", function () {
        //close expandable options if whole mobile nav is closed
        if (mobile_nav_burger.classList.contains("nav-button-active") && expandable_option.classList.contains("nav-option-expanded")) {
            expandable_option.classList.remove("nav-option-expanded");
        }
        toggle_class(mobile_nav_burger, "nav-button-active");
        toggle_class(mobile_nav_expanded, "nav-mobile-active");
    });

    expandable_header?.addEventListener("click", function () {
        toggle_class(expandable_option, "nav-option-expanded");
    });
}
