/**
 * Generate notification email HTML
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 * @returns {string} HTML content
 */
export const generateNotificationEmailHTML = (subject, body) => {
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
    .footer {
      background: #f9fafb;
      padding: 20px 32px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #6b7280;
      font-size: 12px;
      margin: 4px 0;
    }
    .footer-link {
      color: #16a34a;
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Logo -->
      <div class="logo-section">
        <h1 class="logo-text">
          <span class="logo-waste">WASTE</span><span class="logo-bullet"></span><span class="logo-ph">PH</span>
        </h1>
        <p class="logo-tagline">Private Waste Management</p>
      </div>

      <!-- Content Header -->
      <div class="header">
        <span class="badge">Notification</span>
        <h1>${subject}</h1>
      </div>

      <!-- Main Content -->
      <div class="content">
        <p>${body}</p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text"><strong>WastePH</strong> - Private Waste Management Solutions</p>
        <p class="footer-text">
          Email: <a href="mailto:info@wasteph.com" class="footer-link">info@wasteph.com</a> |
          Phone: <a href="tel:+639562461503" class="footer-link">+639562461503</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
};
