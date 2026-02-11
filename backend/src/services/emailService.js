/**
 * Proxy module for backward compatibility.
 * The actual EmailService has been modularized into ./email/
 *
 * Structure:
 *   email/
 *   ├── emailService.js              — Core service (SMTP config + send methods)
 *   ├── index.js                     — Re-export
 *   └── templates/
 *       ├── client/                  — Client-facing emails (light theme)
 *       │   ├── proposalSimple.js
 *       │   ├── proposalFull.js
 *       │   ├── contract.js
 *       │   ├── notification.js
 *       │   └── autoScheduleClient.js
 *       ├── internal/                — Staff notifications (dark theme)
 *       │   ├── newLead.js
 *       │   ├── proposalResponse.js
 *       │   ├── contractSigned.js
 *       │   ├── newTicket.js
 *       │   └── ticketUpdate.js
 *       └── events/                  — Calendar event emails
 *           ├── eventAssigned.js
 *           ├── eventReminder.js
 *           └── autoScheduleSales.js
 */
export { default } from "./email/index.js";
