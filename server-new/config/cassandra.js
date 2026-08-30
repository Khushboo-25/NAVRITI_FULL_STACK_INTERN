const cassandra = require("cassandra-driver");

const client = new cassandra.Client({
  contactPoints: ["127.0.0.1"],
  localDataCenter: "datacenter1",
  keyspace: "navriti",
  protocolOptions: {
    port: 9042,
  },
});

module.exports = client;
