import Handlebars from "handlebars";

/**
 * Register all custom Handlebars helpers in one place.
 * Call once at application startup — Handlebars helpers are global,
 * so re-registering on every render is unnecessary.
 */
export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("currency", function (value) {
    return `₱${Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  });

  Handlebars.registerHelper("formatDate", function (date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("ifGreaterThan", function (arg1, arg2, options) {
    return arg1 > arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("multiply", function (a, b) {
    return Number(a) * Number(b);
  });

  Handlebars.registerHelper("add", function (a, b) {
    return Number(a) + Number(b);
  });

  Handlebars.registerHelper("subtract", function (a, b) {
    return Number(a) - Number(b);
  });
}
