import { requireEnv } from "../../../../utils/envValidator.js";

/**
 * Generate simple proposal email HTML for new format (without total)
 * @param {string} clientName - Client name
 * @param {string} proposalId - Proposal UUID
 * @param {string} responseToken - Secure token for client response
 * @returns {string} HTML content
 */
export const generateSimpleProposalEmailHTML = (
  clientName,
  proposalId,
  responseToken,
  validUntilStr,
) => {
  const frontendUrl = requireEnv("FRONTEND_URL", "http://localhost:5173");
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
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
      padding: 28px 32px 24px 32px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
    }
    .badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
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
      color: #166534;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 24px 32px;
      background: #ffffff;
    }
    .content p {
      margin: 14px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.6;
    }
    .content ul {
      margin: 16px 0;
      padding-left: 24px;
      color: #374151;
    }
    .content li {
      margin: 8px 0;
      font-size: 14px;
    }
    .validity-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 0;
      text-align: center;
    }
    .validity-box p {
      margin: 0;
      color: #166534;
      font-size: 14px;
    }
    .validity-box strong {
      font-size: 16px;
      color: #15803d;
    }
    .action-section {
      padding: 24px 32px 32px 32px;
      background: #fafafa;
    }
    .action-text {
      text-align: center;
      margin-bottom: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .btn-table {
      width: 100%;
      border-collapse: collapse;
    }
    .btn-table a {
      display: block;
      width: 100%;
      padding: 14px 32px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      color: #ffffff !important;
      text-align: center;
      border-radius: 8px;
      letter-spacing: 0.025em;
      transition: all 0.2s ease;
    }
    .btn-approve {
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
    }
    .btn-reject {
      background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
    }
    .btn-table tr + tr td {
      padding-top: 12px;
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
      margin: 4px 0;
    }
    .footer strong {
      color: #166534;
    }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 10px !important; }
      .logo-section { padding: 24px 16px 20px 16px !important; }
      .logo-text { font-size: 32px !important; }
      .logo-bullet { width: 5px !important; height: 5px !important; margin: 0 4px !important; }
      .logo-tagline { font-size: 8px !important; letter-spacing: 0.25em !important; margin-top: 4px !important; }
      .header, .content, .action-section { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      h1 { font-size: 22px !important; }
      .btn-table a { padding: 12px 24px !important; font-size: 13px !important; }
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
            <span class="badge">Business Proposal</span>
            <h1>Waste Management Solutions</h1>
            <p class="subtitle">Professional services tailored for your needs</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Dear <strong>${clientName}</strong>,</p>

            <p>Thank you for your interest in our waste management services. We are pleased to submit our proposal for your review.</p>

            <p>Please find attached our detailed proposal outlining the services we can provide, pricing structure, and terms and conditions.</p>

            <p><strong style="color: #166534;">The attached PDF contains:</strong></p>
            <ul>
              <li>Service breakdown and specifications</li>
              <li>Detailed pricing structure</li>
              <li>Terms and conditions</li>
              <li>Payment terms</li>
            </ul>

            <p>Should you have any questions or require clarification on any aspect of this proposal, please do not hesitate to contact us.</p>

            <p>We look forward to the opportunity to serve you.</p>

            <div class="validity-box">
              <p>This proposal is valid until <strong>${validUntilStr}</strong></p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-section">
            <p class="action-text"><strong>Please review the attached proposal and let us know your decision:</strong></p>
            <table class="btn-table" role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${frontendUrl}/proposal-response/${proposalId}/approve?token=${responseToken}" class="btn-approve">Accept Proposal →</a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="${frontendUrl}/proposal-response/${proposalId}/reject?token=${responseToken}" class="btn-reject">Decline Proposal</a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>WastePH - Private Waste Management</strong></p>
            <p>Email: info@wasteph.com | Phone: +639562461503</p>
            <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
};
