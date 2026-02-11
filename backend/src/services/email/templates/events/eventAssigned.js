import { requireEnv } from "../../../../utils/envValidator.js";

/**
 * Generate event assigned email HTML
 * @param {Object} data - Event data
 * @returns {string} HTML content
 */
export const generateEventAssignedEmailHTML = (data) => {
    const frontendUrl = requireEnv("FRONTEND_URL", "http://localhost:5173");
    const {
      title,
      description,
      eventType,
      scheduledDate,
      startTime,
      endTime,
      creatorName,
      clientName,
      companyName,
    } = data;

    const eventDate = new Date(scheduledDate);
    const dateStr = eventDate.toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const eventTypeLabels = {
      site_visit: "Site Visit",
      call: "Phone Call",
      meeting: "Meeting",
      follow_up: "Follow-up",
      client_checkup: "Client Check-in",
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #ffffff;
      background-color: #0a0a0a;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #111111;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #1f1f1f;
    }
    .logo-section {
      background: linear-gradient(135deg, #0f2618 0%, #0a1f0f 100%);
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 1px solid #15803d;
    }
    .logo-text {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: -0.05em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1;
    }
    .logo-waste {
      color: #ffffff;
    }
    .logo-bullet {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #16a34a;
      border-radius: 50%;
      margin: 0 5px;
      vertical-align: middle;
    }
    .logo-ph {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .logo-tagline {
      color: #15803d;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      padding: 28px 32px 24px 32px;
      border-bottom: 1px solid #1f1f1f;
    }
    .event-card {
      background: #1a1a1a;
      border-left: 4px solid #16a34a;
      border-radius: 8px;
      padding: 20px 24px;
      margin: 24px 32px;
    }
    .event-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
      letter-spacing: -0.025em;
    }
    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }
    .meta-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: #16a34a;
    }
    .meta-label {
      color: #9ca3af;
      font-weight: 500;
    }
    .meta-value {
      color: #f5f5f5;
      font-weight: 500;
    }
    .description-box {
      background: #111111;
      border: 1px solid #262626;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 32px;
    }
    .description-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #9ca3af;
      margin-bottom: 10px;
      display: block;
      font-weight: 700;
    }
    .content {
      padding: 24px 32px 32px 32px;
    }
    .btn {
      display: inline-block;
      background: #16a34a;
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin: 0;
      letter-spacing: 0.025em;
      transition: background 0.2s ease;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #0a0a0a;
      border-top: 1px solid #1f1f1f;
    }
    .footer p {
      color: #737373;
      font-size: 12px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .event-card, .description-box { margin: 20px 16px !important; padding: 16px !important; }
      .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .event-title { font-size: 18px !important; }
      .btn { padding: 12px 28px !important; font-size: 13px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <div class="container">
          <!-- Logo -->
          <div class="logo-section">
            <h1 class="logo-text">
              <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
            </h1>
            <p class="logo-tagline">Private Waste Management</p>
          </div>

          <!-- Header -->
          <div class="header">
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">New Event Assigned</p>
            <h1 style="font-size: 16px; font-weight: 500; color: #9ca3af; margin: 0;">${creatorName} invited you to</h1>
          </div>

          <!-- Event Card (Google Calendar style) -->
          <div class="event-card">
            <h2 class="event-title">${title}</h2>
            
            <div class="event-meta">
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span class="meta-value">${dateStr}</span>
              </div>
              
              ${startTime ? `
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span class="meta-value">${startTime}${endTime ? ` – ${endTime}` : ""}</span>
              </div>
              ` : ""}
              
              ${eventType ? `
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span class="meta-value">${eventTypeLabels[eventType] || eventType}</span>
              </div>
              ` : ""}
              
              ${clientName ? `
              <div class="meta-row">
                <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span class="meta-value">${clientName}${companyName ? ` (${companyName})` : ""}</span>
              </div>
              ` : ""}
            </div>
          </div>

          ${description ? `
          <div class="description-box">
            <span class="description-label">Description</span>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
          </div>
          ` : ""}

          <!-- Action -->
          <div class="content">
            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/calendar" class="btn">View Calendar</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Calendar Notification System</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
};
