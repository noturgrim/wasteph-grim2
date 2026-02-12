import { db } from "../db/index.js";
import { serviceRequestTable } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

class ServiceRequestService {
  // Get all service requests for a lead
  async getServiceRequestsByLeadId(leadId) {
    try {
      const requests = await db
        .select()
        .from(serviceRequestTable)
        .where(eq(serviceRequestTable.leadId, leadId));
      return requests;
    } catch (error) {
      throw new Error(`Failed to fetch service requests: ${error.message}`);
    }
  }

  // Get a single service request by ID
  async getServiceRequestById(id) {
    try {
      const [request] = await db
        .select()
        .from(serviceRequestTable)
        .where(eq(serviceRequestTable.id, id));

      if (!request) {
        throw new Error("Service request not found");
      }

      return request;
    } catch (error) {
      throw new Error(`Failed to fetch service request: ${error.message}`);
    }
  }

  // Create a new service request
  async createServiceRequest(data) {
    try {
      const [newRequest] = await db
        .insert(serviceRequestTable)
        .values({
          leadId: data.leadId,
          serviceType: data.serviceType,
          serviceMode: data.serviceMode,
          serviceLocation: data.serviceLocation,
          city: data.city,
          estimatedVolume: data.estimatedVolume,
          notes: data.notes,
          priority: data.priority,
          attachments: data.attachments
            ? JSON.stringify(data.attachments)
            : null,

          // Garbage Collection fields
          collectionFrequency: data.collectionFrequency,
          wasteType: data.wasteType,
          containerInfo: data.containerInfo,
          garbagePhoto: data.garbagePhoto,
          pricingModel: data.pricingModel,

          // Septic Siphoning fields
          propertyType: data.propertyType,
          lastSiphoningDate: data.lastSiphoningDate,
          estimatedTankSize: data.estimatedTankSize,
          accessNotes: data.accessNotes,
          urgencyTargetDate: data.urgencyTargetDate,

          // Hazardous Waste fields
          hazardousCategory: data.hazardousCategory,
          packagingCondition: data.packagingCondition,
          hazardousQuantity: data.hazardousQuantity,
          storageCondition: data.storageCondition,
          complianceNotes: data.complianceNotes,

          // One-time Hauling fields
          materialType: data.materialType,
          loadSize: data.loadSize,
          preferredPickupDate: data.preferredPickupDate,
          loadingConstraints: data.loadingConstraints,
          haulingPhoto: data.haulingPhoto,
        })
        .returning();

      return newRequest;
    } catch (error) {
      throw new Error(`Failed to create service request: ${error.message}`);
    }
  }

  // Update a service request
  async updateServiceRequest(id, data) {
    try {
      const updateData = {
        serviceType: data.serviceType,
        serviceMode: data.serviceMode,
        serviceLocation: data.serviceLocation,
        city: data.city,
        estimatedVolume: data.estimatedVolume,
        notes: data.notes,
        priority: data.priority,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,

        // Garbage Collection fields
        collectionFrequency: data.collectionFrequency,
        wasteType: data.wasteType,
        containerInfo: data.containerInfo,
        garbagePhoto: data.garbagePhoto,
        pricingModel: data.pricingModel,

        // Septic Siphoning fields
        propertyType: data.propertyType,
        lastSiphoningDate: data.lastSiphoningDate,
        estimatedTankSize: data.estimatedTankSize,
        accessNotes: data.accessNotes,
        urgencyTargetDate: data.urgencyTargetDate,

        // Hazardous Waste fields
        hazardousCategory: data.hazardousCategory,
        packagingCondition: data.packagingCondition,
        hazardousQuantity: data.hazardousQuantity,
        storageCondition: data.storageCondition,
        complianceNotes: data.complianceNotes,

        // One-time Hauling fields
        materialType: data.materialType,
        loadSize: data.loadSize,
        preferredPickupDate: data.preferredPickupDate,
        loadingConstraints: data.loadingConstraints,
        haulingPhoto: data.haulingPhoto,

        updatedAt: new Date(),
      };

      const [updatedRequest] = await db
        .update(serviceRequestTable)
        .set(updateData)
        .where(eq(serviceRequestTable.id, id))
        .returning();

      if (!updatedRequest) {
        throw new Error("Service request not found");
      }

      return updatedRequest;
    } catch (error) {
      throw new Error(`Failed to update service request: ${error.message}`);
    }
  }

  // Delete a service request
  async deleteServiceRequest(id) {
    try {
      const [deletedRequest] = await db
        .delete(serviceRequestTable)
        .where(eq(serviceRequestTable.id, id))
        .returning();

      if (!deletedRequest) {
        throw new Error("Service request not found");
      }

      return deletedRequest;
    } catch (error) {
      throw new Error(`Failed to delete service request: ${error.message}`);
    }
  }
}

export default new ServiceRequestService();
