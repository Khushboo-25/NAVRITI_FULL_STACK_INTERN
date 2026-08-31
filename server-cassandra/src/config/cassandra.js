import cassandra from "cassandra-driver";

let client = null;

const buildClientOptions = (withKeyspace) => {
    const contactPoints = (
        process.env.CASSANDRA_CONTACT_POINTS || "127.0.0.1"
    )
        .split(",")
        .map((point) => point.trim())
        .filter(Boolean);

    const options = {
        contactPoints,
        localDataCenter:
            process.env.CASSANDRA_LOCAL_DATACENTER || "datacenter1",
        protocolOptions: {
            port: Number(process.env.CASSANDRA_PORT || 9042),
        },
    };

    if (withKeyspace) {
        options.keyspace = process.env.CASSANDRA_KEYSPACE || "navriti";
    }

    if (process.env.CASSANDRA_USERNAME) {
        options.credentials = {
            username: process.env.CASSANDRA_USERNAME,
            password: process.env.CASSANDRA_PASSWORD || "",
        };
    }

    return options;
};

export const connectCassandra = async () => {
    try {
        client = new cassandra.Client(buildClientOptions(true));
        await client.connect();
        console.log("Cassandra connected");
        return client;
    } catch (error) {
        console.error("Cassandra connection Failed:");
        console.log(error.message);
        process.exit(1);
    }
};

export const getClient = () => {
    if (!client) {
        throw new Error("Cassandra is not connected");
    }

    return client;
};

export const execute = (query, params = []) =>
    getClient().execute(query, params, { prepare: true });
