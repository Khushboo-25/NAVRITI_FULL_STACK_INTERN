const cassandra = require("./config/cassandra");
const { randomUUID } = require("crypto");

const {
  createAnnouncement,
  getAnnouncementsByPortal,
  deleteAnnouncement,
} = require("./repositories/announcementRepository");

const portalId = randomUUID();
const announcementId = randomUUID();
const publishedAt = new Date();

async function test() {
  try {
    await cassandra.connect();

    const announcement = {
      portal_id: portalId,
      published_at: publishedAt,
      id: announcementId,
      sender_id: "test-user-1",
      title: "Test Announcement",
      content: "Hello from Cassandra",
      attachments: null,
      target_audience: "all",
      target_user_ids: [],
      expires_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await createAnnouncement(announcement);
    console.log("✅ Announcement created");

    const announcements = await getAnnouncementsByPortal(portalId);
    console.log("✅ Announcements:", announcements);

    await deleteAnnouncement(
      portalId,
      publishedAt,
      announcementId
    );

    console.log("✅ Announcement deleted");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await cassandra.shutdown();
  }
}

test();