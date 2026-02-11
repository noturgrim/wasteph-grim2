import { getEnv } from "../../../../utils/envValidator.js";

/**
 * Generate auto-schedule notification email for client (light theme)
 * @param {Object} data - { events, contractNumber, companyName, contactPerson }
 * @returns {string} HTML content
 */
export const generateAutoScheduleClientEmailHTML = (data) => {
  const { events, contractNumber, companyName, contactPerson } = data;

  const eventListHTML = events
    .map((event) => {
      const eventDate = new Date(event.scheduledDate);
      const dateStr = eventDate.toLocaleDateString("en-PH", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const timeStr = event.startTime
        ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}`
        : "All day";

      return `
        <tr>
          <td style="padding: 16px 24px; border-bottom: 1px solid #e8eaed;">
            <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 500; color: #202124; font-family: Arial, Helvetica, sans-serif;">${dateStr}</p>
            <p style="margin: 0; font-size: 14px; color: #5f6368; font-family: Arial, Helvetica, sans-serif;">${timeStr}</p>
          </td>
        </tr>
        `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; mso-line-height-rule: exactly; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f8f9fa;
      font-family: Arial, Helvetica, sans-serif;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Logo -->
          <tr>
            <td style="background: #0a1f0f; padding: 32px 32px 28px 32px; text-align: center; border-bottom: 2px solid #16a34a;">
              <h1 style="margin: 0 0 6px 0; font-size: 42px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1;">
                <span style="color: #ffffff;">WASTE</span><span style="display: inline-block; width: 6px; height: 6px; background: #16a34a; border-radius: 50%; margin: 0 5px; vertical-align: middle;"></span><span style="color: #16a34a;">PH</span>
              </h1>
              <p style="margin: 0; color: #16a34a; font-size: 10px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase;">Private Waste Management</p>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 24px 32px; background: #ffffff; border-bottom: 1px solid #e5e7eb;">
              <span style="display: inline-block; background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 14px; text-transform: uppercase;">SCHEDULED APPOINTMENTS</span>
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #166534; letter-spacing: -0.025em;">
                Your Monthly Check-ins Have Been Scheduled
              </h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 400;">Dear ${contactPerson || "Valued Client"}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 24px 32px;">
              <p style="margin: 0 0 28px 0; font-size: 14px; color: #374151; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                We've scheduled <strong>${events.length} monthly check-in${events.length > 1 ? "s" : ""}</strong> for your account with us. These sessions are designed to ensure your service runs smoothly and address any concerns you may have.
              </p>
              
              <!-- Event List -->
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #5f6368; text-transform: uppercase; letter-spacing: 0.8px; font-family: Arial, Helvetica, sans-serif;">Scheduled Dates:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 28px; border: 1px solid #e8eaed;">
                ${eventListHTML}
              </table>
              
              <!-- Contact Message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                      <strong style="color: #92400e;">Need to reschedule?</strong><br>
                      If you have concerns about these dates or need to make changes, please contact us and we'll be happy to accommodate your schedule.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #3c4043; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                We look forward to our continued partnership.
              </p>
              
              <p style="margin: 0; font-size: 14px; color: #5f6368; font-family: Arial, Helvetica, sans-serif;">
                Best regards,<br>
                <strong style="color: #3c4043;">WastePH Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; background-color: #f8f9fa; border-top: 1px solid #e8eaed; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #3c4043; font-family: Arial, Helvetica, sans-serif;">
                <strong>WastePH - Private Waste Management</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #5f6368; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                For support, contact us at ${getEnv("SMTP_USER", "support@wasteph.com")}
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
    `;
};
