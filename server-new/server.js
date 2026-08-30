const express = require("express");
const cors = require("cors");
const client = require("./config/cassandra");

const app = express();

app.use(cors());
app.use(express.json());
const announcementPortalRoutes = require("./routes/announcementPortalRoutes");
const announcementPortalMemberRoutes =
  require("./routes/announcementPortalMemberRoutes");

const announcementRoutes =
  require("./routes/announcementRoutes");

const conversationRoutes =
  require("./routes/conversationRoutes");
const participantRoutes =
  require("./routes/participantRoutes");
const messageRoutes =
  require("./routes/messageRoutes");
app.use(
  "/api/announcement-portals",
  announcementPortalRoutes
);
app.use(
  "/api/announcement-portals",
  announcementPortalMemberRoutes
);
app.use(
  "/api/announcement-portals",
  announcementRoutes
);
app.use(
  "/api/conversations",
  conversationRoutes
);

app.use(
  "/api/conversations",
  participantRoutes
);

app.use(
  "/api/conversations",
  messageRoutes
);

app.get("/health", async (req, res) => {
  try {
    const result = await client.execute(
      "SELECT release_version FROM system.local"
    );

    res.json({
      status: "ok",
      database: "cassandra",
      version: result.rows[0].release_version,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      database: "cassandra",
    });
  }
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await client.connect();

    console.log("✅ Cassandra connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();