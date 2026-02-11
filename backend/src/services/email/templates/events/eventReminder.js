import { requireEnv } from "../../../../utils/envValidator.js";

/**
 * Generate event reminder email HTML (Google Calendar style - light theme)
 * @param {Object} data - Event data
 * @param {string} timeType - '24h' or '1h'
 * @returns {string} HTML content
 */
export const generateEventReminderEmailHTML = (data, timeType) => {
    const frontendUrl = requireEnv("FRONTEND_URL", "http://localhost:5173");
    const {
      title,
      description,
      eventType,
      scheduledDate,
      startTime,
      endTime,
      clientName,
      companyName,
      hoursUntil,
      minutesUntil,
    } = data;

    const eventDate = new Date(scheduledDate);
    const dateStr = eventDate.toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const dayStr = eventDate.toLocaleDateString("en-PH", {
      weekday: "short",
    });

    const monthDay = eventDate.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });

    const is24h = timeType === "24h";
    const reminderText = is24h ? "Tomorrow" : "Soon";
    const accentColor = is24h ? "#16a34a" : "#ea580c";

    const eventTypeLabels = {
      site_visit: "Site Visit",
      call: "Phone Call",
      meeting: "Meeting",
      follow_up: "Follow-up",
      client_checkup: "Client Check-in",
    };

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
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    td {
      border-collapse: collapse !important;
    }
    img {
      border: 0;
      display: block;
      outline: none;
      text-decoration: none;
    }
    p, h1, h2 {
      margin: 0;
      padding: 0;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-title { font-size: 20px !important; line-height: 1.4 !important; }
      .mobile-hide { display: none !important; }
      .mobile-full-width { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <!--[if mso]>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" class="mobile-full-width">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #e8eaed;" class="mobile-padding">
              <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: #1f1f1f; letter-spacing: -0.5px; line-height: 1.2; mso-line-height-rule: exactly; font-family: Arial, Helvetica, sans-serif;">
                WASTE <span style="color: #16a34a;">• PH</span>
              </h1>
              <p style="margin: 0; font-size: 12px; color: #5f6368; letter-spacing: 0.3px; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">Private Waste Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px;" class="mobile-padding">
              <!-- Reminder Label -->
              <p style="margin: 0 0 24px 0; font-size: 13px; font-weight: 600; color: ${accentColor}; text-transform: uppercase; letter-spacing: 1px; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">
                ${is24h ? "TOMORROW" : "COMING UP"}
              </p>
              
              <!-- Event Title -->
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 500; color: #202124; line-height: 1.3; mso-line-height-rule: exactly; font-family: Arial, Helvetica, sans-serif;" class="mobile-title">
                ${title}
              </h2>
              
              <!-- Event Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-left: 4px solid ${accentColor}; border-radius: 8px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Date Section -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="70" valign="top" style="padding-right: 20px;">
                          <!-- Date Icon -->
                          <table role="presentation" width="64" height="64" cellpadding="0" cellspacing="0" border="0" style="background-color: ${accentColor}; border-radius: 8px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                            <tr>
                              <td align="center" valign="middle" style="padding: 8px;">
                                <p style="margin: 0; font-size: 11px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;">${dayStr.toUpperCase()}</p>
                                <p style="margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.1; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;">${eventDate.getDate()}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="top" style="padding-top: 4px;">
                          <p style="margin: 0 0 4px 0; font-size: 17px; font-weight: 500; color: #202124; line-height: 1.4; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly;">${monthDay}, ${eventDate.getFullYear()}</p>
                          <p style="margin: 0; font-size: 15px; color: #5f6368; line-height: 1.4; font-family: Arial, Helvetica, sans-serif;">${startTime ? `${startTime}${endTime ? ` – ${endTime}` : ""}` : "All day"}</p>
                        </td>
                      </tr>
                    </table>
                    
                    ${eventType || clientName ? `
                    <!-- Event Details -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e8eaed;">
                      ${eventType ? `
                      <tr>
                        <td style="padding: 8px 0 8px 0; font-size: 14px; color: #3c4043; line-height: 1.5;">
                          <strong style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Type:</strong> ${eventTypeLabels[eventType] || eventType}
                        </td>
                      </tr>
                      ` : ""}
                      ${clientName ? `
                      <tr>
                        <td style="padding: 8px 0 8px 0; font-size: 14px; color: #3c4043; line-height: 1.5;">
                          <strong style="color: #5f6368; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Client:</strong> ${clientName}${companyName ? ` (${companyName})` : ""}
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                    ` : ""}
                  </td>
                </tr>
              </table>
              
              ${description ? `
              <!-- Description -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; background-color: #f8f9fa; border-radius: 8px; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0; font-size: 15px; color: #3c4043; line-height: 1.7; font-family: Arial, Helvetica, sans-serif; mso-line-height-rule: exactly; white-space: pre-wrap;">${description}</p>
                  </td>
                </tr>
              </table>
              ` : ""}
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 36px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${frontendUrl}/admin/calendar" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="13%" stroke="f" fillcolor="${accentColor}">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:500;">View in Calendar</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${frontendUrl}/admin/calendar" target="_blank" style="display: inline-block; background-color: ${accentColor}; color: #ffffff !important; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 15px; letter-spacing: 0.3px; font-family: Arial, Helvetica, sans-serif; mso-hide: all;">View in Calendar</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; background-color: #f8f9fa; border-top: 1px solid #e8eaed; text-align: center;" class="mobile-padding">
              <p style="margin: 0; font-size: 13px; color: #5f6368; line-height: 1.7; font-family: Arial, Helvetica, sans-serif;">
                <strong style="color: #3c4043;">WastePH CRM</strong><br>
                Calendar Reminder System
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
