// Client-facing email templates (light theme)
export {
  generateSimpleProposalEmailHTML,
  generateProposalEmailHTML,
  generateContractEmailHTML,
  generateNotificationEmailHTML,
  generateAutoScheduleClientEmailHTML,
} from "./client/index.js";

// Internal staff notification templates (dark theme)
export {
  generateNewLeadEmailHTML,
  generateProposalResponseEmailHTML,
  generateProposalApprovedEmailHTML,
  generateProposalDisapprovedEmailHTML,
  generateContractSignedEmailHTML,
  generateNewTicketEmailHTML,
  generateTicketUpdateEmailHTML,
} from "./internal/index.js";

// Calendar event email templates
export {
  generateEventAssignedEmailHTML,
  generateEventReminderEmailHTML,
  generateAutoScheduleSalesEmailHTML,
} from "./events/index.js";
