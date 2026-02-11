import { requireEnv } from "../../../../utils/envValidator.js";

/**
 * Generate new ticket email HTML (for admins)
 * @param {Object} data - Ticket data
 * @returns {string} HTML content
 */
export const generateNewTicketEmailHTML = (data) => {
  const frontendUrl = requireEnv("FRONTEND_URL", "http://localhost:5173");
  const {
    ticketNumber,
    ticketId,
    clientName,
    companyName,
    category,
    priority,
    subject,
    description,
    creatorName,
    contractNumber,
  } = data;

  const priorityColors = {
    low: { bg: "#f9fafb", border: "#d1d5db", text: "#6b7280" },
    medium: { bg: "#f0fdf4", border: "#16a34a", text: "#16a34a" },
    high: { bg: "#fff7ed", border: "#ea580c", text: "#ea580c" },
    urgent: { bg: "#fef2f2", border: "#dc2626", text: "#dc2626" },
  };

  const categoryLabels = {
    technical: "Technical Issue",
    billing: "Billing",
    service_request: "Service Request",
    complaint: "Complaint",
    other: "Other",
  };

  const config = priorityColors[priority] || priorityColors.low;

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
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #f9fafb;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
    }
    .logo-section {
      background: #0a1f0f;
      padding: 32px 32px 28px 32px;
      text-align: center;
      border-bottom: 2px solid #16a34a;
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
      color: #16a34a;
    }
    .logo-tagline {
      color: #16a34a;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin: 0;
    }
    .header {
      background: #ffffff;
      padding: 28px 32px 24px 32px;
      border-bottom: 1px solid #e5e7eb;
    }
    .status-badge {
      display: inline-block;
      background: #15803d;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      background: #ffffff;
      padding: 24px 32px 32px 32px;
    }
    .priority-banner {
      background: ${config.bg};
      border: 1px solid ${config.border};
      border-radius: 8px;
      padding: 14px 20px;
      margin: 20px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .priority-label {
      color: ${config.text};
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .data-grid {
      width: 100%;
      margin: 20px 0;
      background: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .data-row td {
      padding: 14px 20px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .data-row:last-child td {
      border-bottom: none;
    }
    .label {
      color: #6b7280;
      width: 110px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .value {
      color: #1f2937;
      font-weight: 500;
    }
    .description-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 18px 20px;
      margin-top: 20px;
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
    .btn {
      display: inline-block;
      background: #16a34a;
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin: 24px 0 20px 0;
      letter-spacing: 0.025em;
      transition: background 0.2s ease;
    }
    .footer {
      text-align: center;
      padding: 24px 32px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 12px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .header h1 { font-size: 22px !important; }
      .data-row td { padding: 12px 14px !important; font-size: 13px !important; }
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
            <span class="status-badge">New Ticket</span>
            <h1>Support Ticket Created</h1>
            <p class="subtitle">A new ticket has been submitted and requires attention</p>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="priority-banner">
              <span class="priority-label">${priority.toUpperCase()} Priority</span>
            </div>

            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Ticket #</td>
                <td class="value">${ticketNumber}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Client</td>
                <td class="value">${clientName}${companyName ? ` (${companyName})` : ""}</td>
              </tr>
              ${contractNumber ? `<tr class="data-row"><td class="label">Contract</td><td class="value">${contractNumber}</td></tr>` : ""}
              <tr class="data-row">
                <td class="label">Category</td>
                <td class="value">${categoryLabels[category] || category}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Created By</td>
                <td class="value">${creatorName}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Subject</td>
                <td class="value">${subject}</td>
              </tr>
            </table>

            ${
              description
                ? `
            <div class="description-box">
              <span class="description-label">Description</span>
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
            </div>
            `
                : ""
            }

            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/tickets" class="btn">View Ticket →</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Automated Ticket Notification System</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
};
