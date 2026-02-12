import emailService from "../services/emailService.js";

/**
 * Email Preview Controller
 * Provides endpoints to preview email templates without sending
 * For development/testing purposes only
 */

export const previewNewLeadEmail = async (req, res, next) => {
  try {
    const sampleLeadData = {
      name: "John Doe",
      email: "john.doe@example.com",
      phoneNumber: "+63 912 345 6789",
      companyName: "Sample Corporation",
      serviceInterest: "Waste Collection Services",
      message: "We are interested in your waste management services for our office building. Please contact us at your earliest convenience.",
    };

    const html = emailService.generateNewLeadEmailHTML(sampleLeadData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewProposalAcceptedEmail = async (req, res, next) => {
  try {
    const sampleData = {
      clientName: "John Doe",
      proposalNumber: "PROP-20260209-0001",
      action: "accepted",
      companyName: "Sample Corporation",
      clientEmail: "john.doe@example.com",
    };

    const html = emailService.generateProposalResponseEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewProposalDeclinedEmail = async (req, res, next) => {
  try {
    const sampleData = {
      clientName: "Jane Smith",
      proposalNumber: "PROP-20260209-0002",
      action: "declined",
      companyName: "Another Company Ltd",
      clientEmail: "jane.smith@example.com",
    };

    const html = emailService.generateProposalResponseEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewProposalDisapprovedEmail = async (req, res, next) => {
  try {
    const sampleData = {
      clientName: "Jane Smith",
      proposalNumber: "PROP-20260212-0006",
      companyName: "WastePh",
      clientEmail: "jane.smith@example.com",
      rejectedBy: "Maria Admin (admin)",
      rejectionReason: "Pricing does not align with approved rate sheet. Please revise and resubmit.",
      reviewedAt: new Date().toISOString(),
    };

    const html = emailService.generateProposalDisapprovedEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewContractSignedEmail = async (req, res, next) => {
  try {
    const sampleData = {
      clientName: "Robert Johnson",
      contractNumber: "CON-20260209-0001",
      companyName: "Johnson Enterprises",
      clientEmail: "robert.johnson@example.com",
      address: "123 Business St, Manila, Metro Manila",
      contractStartDate: "2026-02-10",
      contractEndDate: "2027-02-10",
    };

    const html = emailService.generateContractSignedEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewSimpleProposalEmail = async (req, res, next) => {
  try {
    const sampleData = {
      clientName: "John Doe",
      clientEmail: "john.doe@example.com",
      proposalNumber: "PROP-20260209-0003",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      acceptToken: "sample-accept-token-abc123",
      declineToken: "sample-decline-token-xyz789",
    };

    const html = emailService.generateSimpleProposalEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewFullProposalEmail = async (req, res, next) => {
  try {
    const sampleData = {
      clientName: "Jane Smith",
      clientEmail: "jane.smith@example.com",
      proposalNumber: "PROP-20260209-0004",
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptToken: "sample-accept-token-def456",
      declineToken: "sample-decline-token-uvw012",
      serviceType: "Commercial Waste Management",
      price: "PHP 15,000.00",
      frequency: "Weekly Collection",
      terms: "12-month contract with monthly billing",
    };

    const html = emailService.generateProposalEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewContractEmail = async (req, res, next) => {
  try {
    const sampleData = {
      clientName: "Michael Brown",
      clientEmail: "michael.brown@example.com",
      contractNumber: "CON-20260209-0002",
      uploadToken: "sample-upload-token-ghi789",
    };

    const html = emailService.generateContractEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewNotificationEmail = async (req, res, next) => {
  try {
    const subject = "System Notification";
    const body = "This is a sample generic notification email. It can be used for various system notifications and alerts.";

    const html = emailService.generateNotificationEmailHTML(subject, body);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewNewTicketEmail = async (req, res, next) => {
  try {
    const sampleData = {
      ticketNumber: "TKT-20260209-0001",
      ticketId: "sample-ticket-id-123",
      clientName: "Sarah Johnson",
      companyName: "Green Solutions Inc.",
      category: "technical",
      priority: "urgent",
      subject: "Collection truck did not arrive on scheduled date",
      description: "Our regular collection was scheduled for yesterday morning but the truck never arrived. This is affecting our operations. Please advise ASAP.",
      creatorName: "John Smith",
      contractNumber: "CON-20260101-0005",
    };

    const html = emailService.generateNewTicketEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewTicketStatusUpdateEmail = async (req, res, next) => {
  try {
    const sampleData = {
      ticketNumber: "TKT-20260209-0001",
      ticketId: "sample-ticket-id-123",
      updateType: "status",
      subject: "Collection truck did not arrive on scheduled date",
      oldStatus: "open",
      newStatus: "resolved",
      resolutionNotes: "The collection has been rescheduled for tomorrow morning at 8 AM. Our team will ensure priority service. We apologize for the inconvenience.",
    };

    const html = emailService.generateTicketUpdateEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewTicketCommentEmail = async (req, res, next) => {
  try {
    const sampleData = {
      ticketNumber: "TKT-20260209-0001",
      ticketId: "sample-ticket-id-123",
      updateType: "comment",
      subject: "Collection truck did not arrive on scheduled date",
      commentText: "Thank you for reporting this issue. I've checked with our operations team and they confirmed the truck had a mechanical issue. We're sending a replacement truck tomorrow morning.",
      commentAuthor: "Admin Support",
    };

    const html = emailService.generateTicketUpdateEmailHTML(sampleData);

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const previewEmailList = async (req, res, next) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template Previews</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #0a1f0f 0%, #052e16 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 {
      color: #fff;
      font-size: 36px;
      margin-bottom: 12px;
      text-align: center;
    }
    .subtitle {
      color: rgba(255,255,255,0.6);
      text-align: center;
      margin-bottom: 40px;
      font-size: 14px;
    }
    .section-title {
      color: #16a34a;
      font-size: 20px;
      margin: 30px 0 20px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid rgba(21,128,61,0.3);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(21,128,61,0.2);
      border-radius: 12px;
      padding: 24px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }
    .card:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(21,128,61,0.4);
      transform: translateY(-2px);
    }
    .card h2 {
      color: #16a34a;
      font-size: 18px;
      margin-bottom: 12px;
    }
    .card p {
      color: rgba(255,255,255,0.7);
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .card a {
      display: inline-block;
      background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .card a:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(21,128,61,0.4);
    }
    .warning {
      background: rgba(234,179,8,0.1);
      border: 1px solid rgba(234,179,8,0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 30px;
      color: #fbbf24;
      font-size: 13px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: rgba(21,128,61,0.2);
      color: #22c55e;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email Template Previews</h1>
    <p class="subtitle">WastePH CRM - Email Notification System</p>
    
    <div class="warning">
      ⚠️ Development Preview Mode - No actual emails will be sent
    </div>

    <h3 class="section-title">Internal Notifications <span class="badge">Staff</span></h3>
    <div class="grid">
      <div class="card">
        <h2>New Lead Notification</h2>
        <p>Email sent to all sales users when a lead is submitted from the landing page.</p>
        <a href="${baseUrl}/api/email-preview/new-lead" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Proposal Accepted</h2>
        <p>Email sent to sales person when a client accepts their proposal.</p>
        <a href="${baseUrl}/api/email-preview/proposal-accepted" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Proposal Declined</h2>
        <p>Email sent to sales person when a client declines their proposal.</p>
        <a href="${baseUrl}/api/email-preview/proposal-declined" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Proposal Disapproved</h2>
        <p>Email sent to sales person when an admin rejects their proposal.</p>
        <a href="${baseUrl}/api/email-preview/proposal-disapproved" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Contract Signed</h2>
        <p>Email sent to sales person when a client uploads a signed contract.</p>
        <a href="${baseUrl}/api/email-preview/contract-signed" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>New Ticket Created</h2>
        <p>Email sent to all admins when a new support ticket is created.</p>
        <a href="${baseUrl}/api/email-preview/new-ticket" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Ticket Status Update</h2>
        <p>Email sent to sales person when their ticket status is changed by admin.</p>
        <a href="${baseUrl}/api/email-preview/ticket-status-update" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Ticket Comment Added</h2>
        <p>Email sent to sales person when an admin adds a comment to their ticket.</p>
        <a href="${baseUrl}/api/email-preview/ticket-comment" target="_blank">Preview →</a>
      </div>
    </div>

    <h3 class="section-title">Client-Facing Emails <span class="badge">Public</span></h3>
    <div class="grid">
      <div class="card">
        <h2>Simple Proposal Email</h2>
        <p>Basic proposal email sent to clients with accept/decline buttons.</p>
        <a href="${baseUrl}/api/email-preview/simple-proposal" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Full Proposal Email</h2>
        <p>Detailed proposal email sent to clients with service details and pricing.</p>
        <a href="${baseUrl}/api/email-preview/full-proposal" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Contract Email</h2>
        <p>Email sent to clients with instructions to upload their signed contract.</p>
        <a href="${baseUrl}/api/email-preview/contract" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Generic Notification</h2>
        <p>Simple notification email template for various system alerts.</p>
        <a href="${baseUrl}/api/email-preview/notification" target="_blank">Preview →</a>
      </div>
    </div>

    <h3 class="section-title">Calendar Event Emails <span class="badge">Internal</span></h3>
    <div class="grid">
      <div class="card">
        <h2>Event Assigned</h2>
        <p>Email sent immediately when someone assigns an event to another user.</p>
        <a href="${baseUrl}/api/email-preview/event-assigned" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>24-Hour Reminder</h2>
        <p>Email sent 24 hours before a scheduled event (daily at 8 AM).</p>
        <a href="${baseUrl}/api/email-preview/event-reminder-24h" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>1-Hour Reminder</h2>
        <p>Email sent 1 hour before a scheduled event (hourly check).</p>
        <a href="${baseUrl}/api/email-preview/event-reminder-1h" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Auto-Schedule (Sales) <span class="badge">Internal</span></h2>
        <p>Email sent to sales person when monthly check-ins are auto-created via "Auto Schedule" button.</p>
        <a href="${baseUrl}/api/email-preview/auto-schedule-sales" target="_blank">Preview →</a>
      </div>

      <div class="card">
        <h2>Auto-Schedule (Client) <span class="badge">Client-facing</span></h2>
        <p>Email sent to client when monthly check-ins are auto-created. Includes contact info for rescheduling.</p>
        <a href="${baseUrl}/api/email-preview/auto-schedule-client" target="_blank">Preview →</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview event assigned email
 */
export const previewEventAssignedEmail = (req, res, next) => {
  try {
    const sampleData = {
      eventId: "evt-123",
      title: "Monthly Client Check-in: Green Solutions Inc.",
      description: "Discuss service satisfaction, upcoming needs, and renewal options.",
      eventType: "client_checkup",
      scheduledDate: new Date("2026-02-15T10:00:00"),
      startTime: "10:00",
      endTime: "11:00",
      creatorName: "Sarah Admin",
      clientName: "Michael Chen",
      companyName: "Green Solutions Inc.",
    };

    const htmlContent = emailService.generateEventAssignedEmailHTML(sampleData);
    
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview 24-hour reminder email
 */
export const preview24HourReminderEmail = (req, res, next) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sampleData = {
      eventId: "evt-456",
      title: "Site Visit: ABC Manufacturing",
      description: "Quarterly waste audit and service review. Bring inspection checklist and safety equipment.",
      eventType: "site_visit",
      scheduledDate: tomorrow,
      startTime: "14:00",
      endTime: "16:00",
      clientName: "David Rodriguez",
      companyName: "ABC Manufacturing",
      hoursUntil: 24,
    };

    const htmlContent = emailService.generateEventReminderEmailHTML(sampleData, "24h");
    
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview 1-hour reminder email
 */
export const preview1HourReminderEmail = (req, res, next) => {
  try {
    const inOneHour = new Date();
    inOneHour.setHours(inOneHour.getHours() + 1);

    const sampleData = {
      eventId: "evt-789",
      title: "Follow-up Call: Contract Renewal Discussion",
      description: "Discuss renewal terms and answer any questions about the new service package.",
      eventType: "call",
      scheduledDate: inOneHour,
      startTime: inOneHour.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false }),
      clientName: "Emma Johnson",
      companyName: "TechStart Solutions",
      minutesUntil: 60,
    };

    const htmlContent = emailService.generateEventReminderEmailHTML(sampleData, "1h");
    
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview auto-schedule notification to sales
 */
export const previewAutoScheduleSalesEmail = (req, res, next) => {
  try {
    const events = [
      {
        scheduledDate: new Date("2026-02-05T01:00:00.000Z"),
        startTime: "09:00",
        endTime: "10:00",
      },
      {
        scheduledDate: new Date("2026-03-05T01:00:00.000Z"),
        startTime: "09:00",
        endTime: "10:00",
      },
      {
        scheduledDate: new Date("2026-04-05T01:00:00.000Z"),
        startTime: "09:00",
        endTime: "10:00",
      },
    ];

    const sampleData = {
      events,
      contractNumber: "CONT-20260209-0001",
      companyName: "Green Solutions Inc.",
      salesPersonName: "John Sales",
    };

    const htmlContent = emailService.generateAutoScheduleSalesEmailHTML(sampleData);
    
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Preview auto-schedule notification to client
 */
export const previewAutoScheduleClientEmail = (req, res, next) => {
  try {
    const events = [
      {
        scheduledDate: new Date("2026-02-05T01:00:00.000Z"),
        startTime: "09:00",
        endTime: "10:00",
      },
      {
        scheduledDate: new Date("2026-03-05T01:00:00.000Z"),
        startTime: "09:00",
        endTime: "10:00",
      },
      {
        scheduledDate: new Date("2026-04-05T01:00:00.000Z"),
        startTime: "09:00",
        endTime: "10:00",
      },
    ];

    const sampleData = {
      events,
      contractNumber: "CONT-20260209-0001",
      companyName: "Green Solutions Inc.",
      contactPerson: "Michael Chen",
    };

    const htmlContent = emailService.generateAutoScheduleClientEmailHTML(sampleData);
    
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
};
