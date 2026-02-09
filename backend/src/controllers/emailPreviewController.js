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
      max-width: 800px;
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
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
      font-size: 20px;
      margin-bottom: 12px;
    }
    .card p {
      color: rgba(255,255,255,0.7);
      font-size: 14px;
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
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email Template Previews</h1>
    <p class="subtitle">WastePH CRM - Email Notification System</p>
    
    <div class="warning">
      ⚠️ Development Preview Mode - No actual emails will be sent
    </div>

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
        <h2>Contract Signed</h2>
        <p>Email sent to sales person when a client uploads a signed contract.</p>
        <a href="${baseUrl}/api/email-preview/contract-signed" target="_blank">Preview →</a>
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
