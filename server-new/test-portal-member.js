const cassandra = require("./config/cassandra");
const { randomUUID } = require("crypto");

const {
  addMember,
  getMembersByPortal,
  getPortalsByUser,
  removeMember,
} = require("./repositories/announcementPortalMemberRepository");

const portalId = randomUUID();
const userId = "test-user-1";

async function test() {
  try {
    await cassandra.connect();

    const member = {
      portal_id: portalId,
      user_id: userId,
      role: "member",
      added_by: "admin-1",
      created_at: new Date(),
      updated_at: new Date(),
    };

    await addMember(member);
    console.log("✅ Member added");

    const members = await getMembersByPortal(portalId);
    console.log("✅ Members by portal:", members);

    const portals = await getPortalsByUser(userId);
    console.log("✅ Portals by user:", portals);

    await removeMember(portalId, userId);
    console.log("✅ Member removed");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await cassandra.shutdown();
  }
}

test();