import { db } from "../db/index.js";
import { serviceTable } from "../db/schema.js";

const seedServices = async () => {
  try {
    console.log("🌱 Seeding services...");

    const services = [
      {
        name: "Garbage Collection",
        description: "Regular waste collection and disposal services",
      },
      {
        name: "Septic Siphoning",
        description: "Septic tank cleaning and maintenance services",
      },
      {
        name: "Hazardous Waste",
        description: "Safe disposal of hazardous materials",
      },
      {
        name: "One-time Hauling",
        description: "Single trip waste hauling and removal",
      },
    ];

    for (const service of services) {
      const [result] = await db
        .insert(serviceTable)
        .values(service)
        .onConflictDoNothing()
        .returning();

      if (result) {
        console.log(`✅ Service created: ${service.name}`);
      } else {
        console.log(`ℹ️  Service already exists: ${service.name}`);
      }
    }

    console.log("✅ Services seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding services:", error);
    process.exit(1);
  }
};

seedServices();
