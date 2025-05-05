import { toggle_class } from "./tools";
import $ from "jquery";

$(".workout-icon-container").click(function () {
    const icon = $(this).find(".workout-toggle-icon");
    const icon_el = this.querySelector(".workout-toggle-icon") as HTMLElement;
    if ($(icon).hasClass("workout-open")) {
        $(icon).attr("src", "./src/assets/icons/open.svg");
        $(this).closest(".workout-inner").children(".caption-copy").hide();
    }
    else {
        $(icon).attr("src", "./src/assets/icons/close.svg");
        $(this).closest(".workout-inner").children().show();
    }

    toggle_class(icon_el, "workout-open");
});