import { requireEnv } from "../../../../utils/envValidator.js";

/**
 * Generate contract email HTML
 * @param {string} clientName - Client name
 * @returns {string} HTML content
 */
export const generateContractEmailHTML = (
  clientName,
  contractId,
  responseToken,
  contractNumber = null,
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
      padding: 24px 32px 32px 32px;
      background: #ffffff;
    }
    .content p {
      margin: 14px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.6;
    }
    .highlight-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .highlight-box p {
      margin: 8px 0;
      color: #166534;
      font-size: 14px;
      line-height: 1.5;
    }
    .highlight-box p:first-child {
      margin-top: 0;
    }
    .highlight-box p:last-child {
      margin-bottom: 0;
    }
    .action-section {
      text-align: center;
      margin: 24px 0;
    }
    .btn-upload {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.025em;
      transition: all 0.2s ease;
    }
    .upload-icon {
      margin-right: 8px;
      display: inline-flex;
    }
    .note-text {
      font-size: 13px;
      color: #6b7280;
      margin-top: 16px;
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
      .header, .content { padding: 20px 16px !important; }
      .footer { padding: 20px 16px !important; }
      h1 { font-size: 22px !important; }
      .btn-upload { padding: 12px 24px !important; font-size: 13px !important; }
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
            <span class="badge">Contract Ready</span>
            <h1>Your Contract is Ready!</h1>
            <p class="subtitle">Please review and sign your service agreement</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p>Dear <strong>${clientName}</strong>,</p>

            <p>Thank you for your continued interest in our services. We are pleased to provide you with your finalized contract.</p>

            <div class="highlight-box">
              ${contractNumber ? `<p style="font-weight: 600;"><strong style="color: #15803d;">Contract No:</strong> ${contractNumber}</p>` : ""}
              <p><strong style="color: #15803d;">Your contract is attached to this email as a PDF document.</strong></p>
              <p>Please review the contract carefully and contact us if you have any questions.</p>
            </div>

            <p>Once you have reviewed and signed the contract, please upload your signed copy using the button below:</p>

            <div class="action-section">
              <a href="${frontendUrl}/contract-response/${contractId}?token=${responseToken}" class="btn-upload">
                <span class="upload-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </span>
                Upload Signed Contract →
              </a>
            </div>

            <p class="note-text">You will be taken to a secure page where you can upload your signed contract document.</p>

            <p>We look forward to serving you and providing excellent waste management solutions for your needs.</p>

            <p style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong style="color: #166534;">Best regards,</strong><br>
              <span style="color: #6b7280;">The WastePH Team</span>
            </p>
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
