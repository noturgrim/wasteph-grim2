import { db } from "../db/index.js";
import {
  proposalTable,
  contractsTable,
  ticketAttachmentsTable,
  clientTicketsTable,
  inquiryTable,
  userFilesTable,
} from "../db/schema.js";
import { eq, isNotNull, count } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const seedFiles = async () => {
  try {
    // Check if already seeded
    const [existing] = await db
      .select({ value: count() })
      .from(userFilesTable);
    if (existing.value > 0) {
      console.log(
        `⚠️  user_files table already has ${existing.value} records. Skipping seed.`
      );
      console.log(
        "   To re-seed, manually truncate the user_files table first."
      );
      process.exit(0);
    }

    let totalInserted = 0;

    // 1. Proposals with pdfUrl
    console.log("📄 Seeding proposal files...");
    const proposals = await db
      .select({
        id: proposalTable.id,
        proposalNumber: proposalTable.proposalNumber,
        pdfUrl: proposalTable.pdfUrl,
        sentBy: proposalTable.sentBy,
        sentAt: proposalTable.sentAt,
        inquiryId: proposalTable.inquiryId,
      })
      .from(proposalTable)
      .where(isNotNull(proposalTable.pdfUrl));

    for (const proposal of proposals) {
      // Get client name from inquiry
      let clientName = null;
      if (proposal.inquiryId) {
        const [inquiry] = await db
          .select({ name: inquiryTable.name })
          .from(inquiryTable)
          .where(eq(inquiryTable.id, proposal.inquiryId))
          .limit(1);
        clientName = inquiry?.name || null;
      }

      await db.insert(userFilesTable).values({
        fileName: `${proposal.proposalNumber}.pdf`,
        fileUrl: proposal.pdfUrl,
        fileType: "application/pdf",
        entityType: "proposal",
        entityId: proposal.id,
        relatedEntityNumber: proposal.proposalNumber,
        clientName,
        action: "generated",
        uploadedBy: proposal.sentBy || null,
        createdAt: proposal.sentAt || new Date(),
      });
      totalInserted++;
    }
    console.log(`   ✅ ${proposals.length} proposal files`);

    // 2. Contracts with contractPdfUrl
    console.log("📄 Seeding contract files...");
    const contractsWithPdf = await db
      .select({
        id: contractsTable.id,
        contractNumber: contractsTable.contractNumber,
        contractPdfUrl: contractsTable.contractPdfUrl,
        contractUploadedBy: contractsTable.contractUploadedBy,
        contractUploadedAt: contractsTable.contractUploadedAt,
        clientName: contractsTable.clientName,
      })
      .from(contractsTable)
      .where(isNotNull(contractsTable.contractPdfUrl));

    for (const contract of contractsWithPdf) {
      await db.insert(userFilesTable).values({
        fileName: `${contract.contractNumber || contract.id}-contract.pdf`,
        fileUrl: contract.contractPdfUrl,
        fileType: "application/pdf",
        entityType: "contract",
        entityId: contract.id,
        relatedEntityNumber: contract.contractNumber,
        clientName: contract.clientName || null,
        action: "uploaded",
        uploadedBy: contract.contractUploadedBy || null,
        createdAt: contract.contractUploadedAt || new Date(),
      });
      totalInserted++;
    }
    console.log(`   ✅ ${contractsWithPdf.length} contract files`);

    // 3. Signed contracts
    console.log("📄 Seeding signed contract files...");
    const signedContracts = await db
      .select({
        id: contractsTable.id,
        contractNumber: contractsTable.contractNumber,
        signedContractUrl: contractsTable.signedContractUrl,
        signedAt: contractsTable.signedAt,
        clientName: contractsTable.clientName,
      })
      .from(contractsTable)
      .where(isNotNull(contractsTable.signedContractUrl));

    for (const contract of signedContracts) {
      await db.insert(userFilesTable).values({
        fileName: `${contract.contractNumber || contract.id}-signed.pdf`,
        fileUrl: contract.signedContractUrl,
        fileType: "application/pdf",
        entityType: "signed_contract",
        entityId: contract.id,
        relatedEntityNumber: contract.contractNumber,
        clientName: contract.clientName || null,
        action: "signed",
        uploadedBy: null,
        createdAt: contract.signedAt || new Date(),
      });
      totalInserted++;
    }
    console.log(`   ✅ ${signedContracts.length} signed contract files`);

    // 4. Hardbound contracts
    console.log("📄 Seeding hardbound contract files...");
    const hardboundContracts = await db
      .select({
        id: contractsTable.id,
        contractNumber: contractsTable.contractNumber,
        hardboundContractUrl: contractsTable.hardboundContractUrl,
        hardboundUploadedBy: contractsTable.hardboundUploadedBy,
        hardboundUploadedAt: contractsTable.hardboundUploadedAt,
        clientName: contractsTable.clientName,
      })
      .from(contractsTable)
      .where(isNotNull(contractsTable.hardboundContractUrl));

    for (const contract of hardboundContracts) {
      await db.insert(userFilesTable).values({
        fileName: `${contract.contractNumber || contract.id}-hardbound.pdf`,
        fileUrl: contract.hardboundContractUrl,
        fileType: "application/pdf",
        entityType: "hardbound_contract",
        entityId: contract.id,
        relatedEntityNumber: contract.contractNumber,
        clientName: contract.clientName || null,
        action: "uploaded",
        uploadedBy: contract.hardboundUploadedBy || null,
        createdAt: contract.hardboundUploadedAt || new Date(),
      });
      totalInserted++;
    }
    console.log(`   ✅ ${hardboundContracts.length} hardbound contract files`);

    // 5. Custom templates
    console.log("📄 Seeding custom template files...");
    const customTemplates = await db
      .select({
        id: contractsTable.id,
        contractNumber: contractsTable.contractNumber,
        customTemplateUrl: contractsTable.customTemplateUrl,
        requestedBy: contractsTable.requestedBy,
        requestedAt: contractsTable.requestedAt,
        clientName: contractsTable.clientName,
      })
      .from(contractsTable)
      .where(isNotNull(contractsTable.customTemplateUrl));

    for (const contract of customTemplates) {
      await db.insert(userFilesTable).values({
        fileName: `${contract.contractNumber || contract.id}-custom-template`,
        fileUrl: contract.customTemplateUrl,
        fileType: "application/pdf",
        entityType: "custom_template",
        entityId: contract.id,
        relatedEntityNumber: contract.contractNumber,
        clientName: contract.clientName || null,
        action: "uploaded",
        uploadedBy: contract.requestedBy || null,
        createdAt: contract.requestedAt || new Date(),
      });
      totalInserted++;
    }
    console.log(`   ✅ ${customTemplates.length} custom template files`);

    // 6. Ticket attachments
    console.log("📄 Seeding ticket attachment files...");
    const attachments = await db
      .select({
        ticketId: ticketAttachmentsTable.ticketId,
        fileName: ticketAttachmentsTable.fileName,
        fileUrl: ticketAttachmentsTable.fileUrl,
        fileSize: ticketAttachmentsTable.fileSize,
        fileType: ticketAttachmentsTable.fileType,
        uploadedBy: ticketAttachmentsTable.uploadedBy,
        createdAt: ticketAttachmentsTable.createdAt,
      })
      .from(ticketAttachmentsTable);

    for (const attachment of attachments) {
      // Get ticket number
      let ticketNumber = null;
      const [ticket] = await db
        .select({ ticketNumber: clientTicketsTable.ticketNumber })
        .from(clientTicketsTable)
        .where(eq(clientTicketsTable.id, attachment.ticketId))
        .limit(1);
      ticketNumber = ticket?.ticketNumber || null;

      await db.insert(userFilesTable).values({
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType || null,
        fileSize: attachment.fileSize || null,
        entityType: "ticket_attachment",
        entityId: attachment.ticketId,
        relatedEntityNumber: ticketNumber,
        clientName: null,
        action: "uploaded",
        uploadedBy: attachment.uploadedBy || null,
        createdAt: attachment.createdAt || new Date(),
      });
      totalInserted++;
    }
    console.log(`   ✅ ${attachments.length} ticket attachment files`);

    console.log(`\n🎉 Seed complete! ${totalInserted} total file records created.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding files:", error);
    process.exit(1);
  }
};

seedFiles();
