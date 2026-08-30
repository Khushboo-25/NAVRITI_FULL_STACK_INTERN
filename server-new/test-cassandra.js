const client = require("./config/cassandra");

async function test() {
  try {
    await client.connect();
    console.log("✅ Cassandra connected");

    const result = await client.execute(
      "SELECT release_version FROM system.local"
    );

    console.log("Cassandra version:", result.rows[0].release_version);
  } catch (error) {
    console.error("❌ Cassandra connection failed:", error);
  } finally {
    await client.shutdown();
  }
}

test();