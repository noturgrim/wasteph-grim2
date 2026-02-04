import { db } from "../db/index.js";
import { contractTemplatesTable, activityLogTable } from "../db/schema.js";
import { eq, desc, and, or, like, count, inArray, sql } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

/**
 * ContractTemplateService - Business logic for contract template operations
 */
class ContractTemplateService {
  /**
   * Create a new contract template
   * @param {Object} templateData - Template data
   * @param {string} userId - User creating the template (admin)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData, userId, metadata = {}) {
    const { name, description, htmlTemplate, templateType, isDefault } =
      templateData;

    // Enforce one active template per type
    if (templateType) {
      const [existing] = await db
        .select()
        .from(contractTemplatesTable)
        .where(
          and(
            eq(contractTemplatesTable.templateType, templateType),
            eq(contractTemplatesTable.isActive, true)
          )
        )
        .limit(1);

      if (existing) {
        throw new AppError(
          `An active template already exists for type "${templateType}". Delete or deactivate it first.`,
          409
        );
      }
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await db
        .update(contractTemplatesTable)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(contractTemplatesTable.isDefault, true));
    }

    const [template] = await db
      .insert(contractTemplatesTable)
      .values({
        name,
        description,
        htmlTemplate,
        templateType: templateType || null,
        isDefault: isDefault || false,
        isActive: true,
      })
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_template_created",
      entityType: "contract_template",
      entityId: template.id,
      details: { name, templateType },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return template;
  }

  /**
   * Get all contract templates
   * @param {Object} options - Query options { isActive, templateType, search, page, limit }
   * @returns {Promise<Object>} Templates with pagination
   */
  async getAllTemplates(options = {}) {
    const {
      isActive,
      templateType,
      search,
      page: rawPage = 1,
      limit: rawLimit = 10,
    } = options;
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;
    const offset = (page - 1) * limit;

    let query = db.select().from(contractTemplatesTable);
    const conditions = [];

    // Active filter
    if (isActive !== undefined) {
      conditions.push(eq(contractTemplatesTable.isActive, isActive));
    }

    // Template type filter (comma-separated)
    if (templateType) {
      const types = templateType.split(",");
      conditions.push(types.length === 1
        ? eq(contractTemplatesTable.templateType, types[0])
        : inArray(contractTemplatesTable.templateType, types));
    }

    // Search filter (name or description)
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(contractTemplatesTable.name, searchTerm),
          like(contractTemplatesTable.description, searchTerm)
        )
      );
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    let countQuery = db
      .select({ value: count() })
      .from(contractTemplatesTable);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ value: total }] = await countQuery;

    // Get templates with pagination
    const data = await query
      .orderBy(desc(contractTemplatesTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get contract template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object>} Template
   */
  async getTemplateById(id) {
    const [template] = await db
      .select()
      .from(contractTemplatesTable)
      .where(eq(contractTemplatesTable.id, id))
      .limit(1);

    if (!template) {
      throw new AppError("Contract template not found", 404);
    }

    return template;
  }

  /**
   * Get contract template by type
   * @param {string} type - Contract type
   * @returns {Promise<Object>} Template
   */
  async getTemplateByType(type) {
    const [template] = await db
      .select()
      .from(contractTemplatesTable)
      .where(
        and(
          eq(contractTemplatesTable.templateType, type),
          eq(contractTemplatesTable.isActive, true)
        )
      )
      .limit(1);

    if (!template) {
      // Return default template if no type-specific template found
      return this.getDefaultTemplate();
    }

    return template;
  }

  /**
   * Get default contract template
   * @returns {Promise<Object>} Default template
   */
  async getDefaultTemplate() {
    const [template] = await db
      .select()
      .from(contractTemplatesTable)
      .where(
        and(
          eq(contractTemplatesTable.isDefault, true),
          eq(contractTemplatesTable.isActive, true)
        )
      )
      .limit(1);

    if (!template) {
      // If no default, return first active template
      const [firstActive] = await db
        .select()
        .from(contractTemplatesTable)
        .where(eq(contractTemplatesTable.isActive, true))
        .orderBy(desc(contractTemplatesTable.createdAt))
        .limit(1);

      if (!firstActive) {
        throw new AppError(
          "No contract templates available. Please create one first.",
          404
        );
      }

      return firstActive;
    }

    return template;
  }

  /**
   * Update contract template
   * @param {string} id - Template ID
   * @param {Object} updateData - Data to update
   * @param {string} userId - User updating the template
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(id, updateData, userId, metadata = {}) {
    // Check if template exists
    const existingTemplate = await this.getTemplateById(id);

    const { name, description, htmlTemplate, templateType, isDefault } =
      updateData;

    // Enforce one active template per type (exclude current template)
    if (templateType && templateType !== existingTemplate.templateType) {
      const [conflict] = await db
        .select()
        .from(contractTemplatesTable)
        .where(
          and(
            eq(contractTemplatesTable.templateType, templateType),
            eq(contractTemplatesTable.isActive, true),
            sql`${contractTemplatesTable.id} != ${id}`
          )
        )
        .limit(1);

      if (conflict) {
        throw new AppError(
          `An active template already exists for type "${templateType}". Delete or deactivate it first.`,
          409
        );
      }
    }

    // If setting as default, unset other defaults first
    if (isDefault && !existingTemplate.isDefault) {
      await db
        .update(contractTemplatesTable)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(contractTemplatesTable.isDefault, true));
    }

    const [updatedTemplate] = await db
      .update(contractTemplatesTable)
      .set({
        name: name !== undefined ? name : existingTemplate.name,
        description:
          description !== undefined
            ? description
            : existingTemplate.description,
        htmlTemplate:
          htmlTemplate !== undefined
            ? htmlTemplate
            : existingTemplate.htmlTemplate,
        templateType:
          templateType !== undefined
            ? templateType
            : existingTemplate.templateType,
        isDefault:
          isDefault !== undefined ? isDefault : existingTemplate.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(contractTemplatesTable.id, id))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_template_updated",
      entityType: "contract_template",
      entityId: id,
      details: { changes: updateData },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedTemplate;
  }

  /**
   * Set template as default
   * @param {string} id - Template ID
   * @param {string} userId - User performing the action
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated template
   */
  async setDefaultTemplate(id, userId, metadata = {}) {
    // Check if template exists and is active
    const template = await this.getTemplateById(id);

    if (!template.isActive) {
      throw new AppError("Cannot set inactive template as default", 400);
    }

    // Unset all other defaults
    await db
      .update(contractTemplatesTable)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(contractTemplatesTable.isDefault, true));

    // Set this template as default
    const [updatedTemplate] = await db
      .update(contractTemplatesTable)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(contractTemplatesTable.id, id))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_template_set_default",
      entityType: "contract_template",
      entityId: id,
      details: { name: template.name },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return updatedTemplate;
  }

  /**
   * Delete contract template (soft delete)
   * @param {string} id - Template ID
   * @param {string} userId - User deleting the template
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Deleted template
   */
  async deleteTemplate(id, userId, metadata = {}) {
    const template = await this.getTemplateById(id);

    // Prevent deleting the default template
    if (template.isDefault) {
      throw new AppError(
        "Cannot delete the default template. Set another template as default first.",
        400
      );
    }

    // Soft delete
    const [deletedTemplate] = await db
      .update(contractTemplatesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(contractTemplatesTable.id, id))
      .returning();

    // Log activity
    await this.logActivity({
      userId,
      action: "contract_template_deleted",
      entityType: "contract_template",
      entityId: id,
      details: { name: template.name },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    return deletedTemplate;
  }

  /**
   * Suggest template based on contract type
   * @param {string} contractType - Contract type
   * @returns {Promise<Object>} Suggested template
   */
  async suggestTemplateForContract(contractType) {
    if (!contractType) {
      return this.getDefaultTemplate();
    }

    try {
      return await this.getTemplateByType(contractType);
    } catch (error) {
      // If no template found for type, return default
      return this.getDefaultTemplate();
    }
  }

  /**
   * Log activity
   * @param {Object} logData - Activity log data
   */
  async logActivity(logData) {
    try {
      await db.insert(activityLogTable).values({
        userId: logData.userId,
        action: logData.action,
        entityType: logData.entityType,
        entityId: logData.entityId,
        details: logData.details ? JSON.stringify(logData.details) : null,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
      });
    } catch (error) {
      // Don't throw - logging failure shouldn't break the operation
      console.error("Failed to log activity:", error);
    }
  }
}

export default new ContractTemplateService();
