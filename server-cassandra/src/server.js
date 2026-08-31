import "dotenv/config";
import http from 'http';
import app from './app.js';
import dotenv from 'dotenv';

import { connectCassandra } from "./config/cassandra.js";
import socketHandler from './socket/socketHandler.js';
import {Server} from "socket.io";
import {
    setAnnouncementSocket,
} from "./controllers/announcementPortalController.js";

dotenv.config();
const httpServer = http.createServer(app);


const io = new Server(httpServer,{
    cors:{
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"]
    }
});

setAnnouncementSocket(io);
socketHandler(io);
await connectCassandra();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
