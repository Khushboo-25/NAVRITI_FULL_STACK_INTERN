const cassandra = require("./config/cassandra");
const { randomUUID } = require("crypto");
const {
  createPortal,
  getPortalById,
  deletePortal,
} = require("./repositories/announcementPortalRepository");

const id = randomUUID();
async function test() {
  try {
    await cassandra.connect();

    const portal = {
      id,
      name: "Test Portal",
      description: "Cassandra test",
      created_by: "test-user",
      target_audience: "all",
      created_at: new Date(),
      updated_at: new Date(),
    };

    await createPortal(portal);
    console.log("✅ Portal created");

    const result = await getPortalById(id);
    console.log("✅ Portal fetched:", result);

    await deletePortal(id);
    console.log("✅ Portal deleted");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await cassandra.shutdown();
  }
}

test();