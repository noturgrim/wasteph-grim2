import { db } from "../db/index.js";
import { serviceTable, serviceSubTypeTable, proposalTemplateTable } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { AppError } from "../middleware/errorHandler.js";

/**
 * ServiceService - Business logic for service operations
 */
class ServiceService {
  /**
   * Get all services
   * @returns {Promise<Array>} List of services
   */
  async getAllServices() {
    const services = await db
      .select()
      .from(serviceTable)
      .where(eq(serviceTable.isActive, true));

    return services;
  }

  /**
   * Get service by ID with its default template
   * @param {string} serviceId - Service UUID
   * @returns {Promise<Object>} Service with template data
   */
  async getServiceById(serviceId) {
    const [service] = await db
      .select({
        id: serviceTable.id,
        name: serviceTable.name,
        description: serviceTable.description,
        defaultTemplateId: serviceTable.defaultTemplateId,
        requiresContract: serviceTable.requiresContract,
        isActive: serviceTable.isActive,
        createdAt: serviceTable.createdAt,
        template: {
          id: proposalTemplateTable.id,
          name: proposalTemplateTable.name,
          description: proposalTemplateTable.description,
          htmlTemplate: proposalTemplateTable.htmlTemplate,
          templateType: proposalTemplateTable.templateType,
          category: proposalTemplateTable.category,
          isActive: proposalTemplateTable.isActive,
        },
      })
      .from(serviceTable)
      .leftJoin(
        proposalTemplateTable,
        eq(serviceTable.defaultTemplateId, proposalTemplateTable.id)
      )
      .where(eq(serviceTable.id, serviceId))
      .limit(1);

    if (!service) {
      throw new AppError("Service not found", 404);
    }

    // Fallback: if service has no linked template, use the global default
    if (!service.template?.id) {
      const [defaultTemplate] = await db
        .select({
          id: proposalTemplateTable.id,
          name: proposalTemplateTable.name,
          description: proposalTemplateTable.description,
          htmlTemplate: proposalTemplateTable.htmlTemplate,
          templateType: proposalTemplateTable.templateType,
          category: proposalTemplateTable.category,
          isActive: proposalTemplateTable.isActive,
        })
        .from(proposalTemplateTable)
        .where(
          and(
            eq(proposalTemplateTable.isDefault, true),
            eq(proposalTemplateTable.isActive, true)
          )
        )
        .limit(1);

      if (defaultTemplate) {
        service.template = defaultTemplate;
      }
    }

    return service;
  }

  /**
   * Get active sub-types for a service
   * @param {string} serviceId - Service UUID
   * @returns {Promise<Array>} List of sub-types
   */
  async getSubTypes(serviceId) {
    return db
      .select({
        id: serviceSubTypeTable.id,
        name: serviceSubTypeTable.name,
        description: serviceSubTypeTable.description,
      })
      .from(serviceSubTypeTable)
      .where(
        and(
          eq(serviceSubTypeTable.serviceId, serviceId),
          eq(serviceSubTypeTable.isActive, true)
        )
      );
  }

  /**
   * Get template for a service (helper method)
   * @param {string} serviceId - Service UUID
   * @returns {Promise<Object|null>} Template object or null
   */
  async getTemplateForService(serviceId) {
    const service = await this.getServiceById(serviceId);
    return service.template || null;
  }
}

export default new ServiceService();
