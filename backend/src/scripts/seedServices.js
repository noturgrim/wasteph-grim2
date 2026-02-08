import { db } from "../db/index.js";
import { serviceTable, serviceSubTypeTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

const seedServices = async () => {
  try {
    console.log("Seeding services...");

    const services = [
      {
        name: "Fixed Monthly Rate",
        description: "Regular monthly service contract",
      },
      {
        name: "Hazardous Waste",
        description: "Safe disposal of hazardous materials",
      },
      {
        name: "Clearing Project",
        description: "One-time clearing and cleanup",
      },
      {
        name: "Long Term Garbage",
        description: "Per-kg weight-based pricing",
      },
      {
        name: "One-time Hauling",
        description: "Single trip waste hauling and removal",
        requiresContract: false,
      },
      {
        name: "Purchase of Recyclables",
        description: "Recyclable materials buyback",
      },
    ];

    for (const service of services) {
      const [result] = await db
        .insert(serviceTable)
        .values(service)
        .onConflictDoNothing()
        .returning();

      if (result) {
        console.log(`  Service created: ${service.name}`);
      } else {
        // Update requiresContract flag for existing service if explicitly set
        if (service.requiresContract === false) {
          await db
            .update(serviceTable)
            .set({ requiresContract: false })
            .where(eq(serviceTable.name, service.name));
          console.log(`  Updated requiresContract=false: ${service.name}`);
        } else {
          console.log(`  Service already exists: ${service.name}`);
        }
      }
    }

    // Seed sub-types for One-time Hauling
    console.log("\nSeeding service sub-types...");

    const [oneTimeHauling] = await db
      .select({ id: serviceTable.id })
      .from(serviceTable)
      .where(eq(serviceTable.name, "One-time Hauling"))
      .limit(1);

    if (oneTimeHauling) {
      const subTypes = [
        {
          serviceId: oneTimeHauling.id,
          name: "Dump",
          description: "Standard dump truck hauling",
        },
        {
          serviceId: oneTimeHauling.id,
          name: "Compactor",
          description: "Compactor truck hauling",
        },
      ];

      for (const subType of subTypes) {
        const [result] = await db
          .insert(serviceSubTypeTable)
          .values(subType)
          .onConflictDoNothing()
          .returning();

        if (result) {
          console.log(`  Sub-type created: ${subType.name}`);
        } else {
          console.log(`  Sub-type already exists: ${subType.name}`);
        }
      }
    }

    console.log("\nServices seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding services:", error);
    process.exit(1);
  }
};

seedServices();
