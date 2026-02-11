import { requireEnv } from "../../../../utils/envValidator.js";

/**
 * Generate proposal response email HTML
 * @param {Object} data - Notification data
 * @returns {string} HTML content
 */
export const generateProposalResponseEmailHTML = (data) => {
  const frontendUrl = requireEnv("FRONTEND_URL", "http://localhost:5173");
  const { clientName, proposalNumber, action, companyName, clientEmail } =
    data;
  const isAccepted = action === "accepted";

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
    .status-badge {
      display: inline-block;
      background: ${isAccepted ? "#15803d" : "#991b1b"};
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
      color: ${isAccepted ? "#22c55e" : "#ef4444"};
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px 32px 32px;
    }
    .data-grid {
      width: 100%;
      margin: 20px 0;
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #262626;
    }
    .data-row td {
      padding: 14px 20px;
      border-bottom: 1px solid #262626;
      font-size: 14px;
    }
    .data-row:last-child td {
      border-bottom: none;
    }
    .label {
      color: #737373;
      width: 110px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .value {
      color: #f5f5f5;
      font-weight: 500;
    }
    .highlight-box {
      background: ${isAccepted ? "#0f2618" : "#2d1212"};
      border: 1px solid ${isAccepted ? "#15803d" : "#991b1b"};
      border-radius: 8px;
      padding: 18px 20px;
      margin-top: 20px;
    }
    .btn {
      display: inline-block;
      background: ${isAccepted ? "#16a34a" : "#dc2626"};
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
    .next-steps {
      background: #1a1a1a;
      border-left: 3px solid ${isAccepted ? "#16a34a" : "#dc2626"};
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 20px;
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
      .header, .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      .header h1 { font-size: 22px !important; }
      .data-row td { padding: 12px 14px !important; font-size: 13px !important; }
      .btn { padding: 12px 28px !important; font-size: 13px !important; }
      .next-steps { padding: 14px 16px !important; font-size: 13px !important; }
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
            <span class="status-badge">${isAccepted ? "Action Required" : "Follow-Up Needed"}</span>
            <h1>Proposal ${isAccepted ? "Accepted" : "Declined"}</h1>
            <p class="subtitle">Client has responded to your proposal</p>
          </div>

          <!-- Content -->
          <div class="content">
            <table class="data-grid" cellpadding="0" cellspacing="0">
              <tr class="data-row">
                <td class="label">Proposal</td>
                <td class="value">${proposalNumber}</td>
              </tr>
              <tr class="data-row">
                <td class="label">Client</td>
                <td class="value">${clientName}</td>
              </tr>
              ${companyName ? `<tr class="data-row"><td class="label">Company</td><td class="value">${companyName}</td></tr>` : ""}
              <tr class="data-row">
                <td class="label">Email</td>
                <td class="value"><a href="mailto:${clientEmail}" style="color: #22c55e; text-decoration: none;">${clientEmail}</a></td>
              </tr>
              <tr class="data-row">
                <td class="label">Status</td>
                <td class="value" style="color: ${isAccepted ? "#22c55e" : "#ef4444"}; font-weight: 700;">${isAccepted ? "ACCEPTED" : "DECLINED"}</td>
              </tr>
            </table>

            <div class="highlight-box">
              <p style="font-size: 14px; color: #e5e5e5; margin: 0; line-height: 1.6;">
                ${
                  isAccepted
                    ? `<strong style="color: #22c55e;">Great news!</strong> The client has accepted your proposal.`
                    : `<strong style="color: #ef4444;">The client has declined this proposal.</strong> Consider reaching out to understand their concerns and see if you can provide an alternative solution.`
                }
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${frontendUrl}/admin/proposals" class="btn">View in CRM →</a>
            </div>

            <div class="next-steps">
              <p style="font-size: 13px; color: #e5e5e5; margin: 0; line-height: 1.5;">
                <strong style="color: ${isAccepted ? "#22c55e" : "#ef4444"};">${isAccepted ? "Next Steps:" : "Suggested Actions:"}</strong><br>
                ${
                  isAccepted
                    ? `• Contract has been auto-created (status: pending_request)<br>• Request contract generation from admin<br>• Once approved, send contract to client`
                    : `• Reach out to understand concerns<br>• Offer alternative solutions or pricing<br>• Schedule a follow-up meeting`
                }
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600;">WastePH CRM</p>
            <p style="margin: 0; font-size: 12px; color: #525252;">Automated Proposal Notification System</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
};
