import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cassandra from "cassandra-driver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const contactPoints = (process.env.CASSANDRA_CONTACT_POINTS || "127.0.0.1")
    .split(",")
    .map((point) => point.trim())
    .filter(Boolean);

const keyspace = process.env.CASSANDRA_KEYSPACE || "navriti";
const replicationFactor = Number(
    process.env.CASSANDRA_REPLICATION_FACTOR || 1
);

const clientOptions = {
    contactPoints,
    localDataCenter:
        process.env.CASSANDRA_LOCAL_DATACENTER || "datacenter1",
    protocolOptions: {
        port: Number(process.env.CASSANDRA_PORT || 9042),
    },
};

if (process.env.CASSANDRA_USERNAME) {
    clientOptions.credentials = {
        username: process.env.CASSANDRA_USERNAME,
        password: process.env.CASSANDRA_PASSWORD || "",
    };
}

const splitCqlStatements = (cql) =>
    cql
        .split(";")
        .map((statement) =>
            statement
                .split("\n")
                .filter((line) => !line.trim().startsWith("--"))
                .join("\n")
                .trim()
        )
        .filter(Boolean);

const run = async () => {
    const adminClient = new cassandra.Client(clientOptions);

    await adminClient.connect();

    await adminClient.execute(`
        CREATE KEYSPACE IF NOT EXISTS ${keyspace}
        WITH replication = {
            'class': 'SimpleStrategy',
            'replication_factor': ${replicationFactor}
        }
    `);

    console.log(`Keyspace ready: ${keyspace}`);
    await adminClient.shutdown();

    const schemaClient = new cassandra.Client({
        ...clientOptions,
        keyspace,
    });

    await schemaClient.connect();

    const schemaPath = path.join(__dirname, "schema.cql");
    const schemaCql = fs.readFileSync(schemaPath, "utf8");

    for (const statement of splitCqlStatements(schemaCql)) {
        await schemaClient.execute(statement);
        console.log("Applied:", statement.split("\n")[0]);
    }

    await schemaClient.shutdown();
    console.log("Cassandra schema setup complete");
};

run().catch((error) => {
    console.error("Cassandra schema setup failed:", error.message);
    process.exit(1);
});
