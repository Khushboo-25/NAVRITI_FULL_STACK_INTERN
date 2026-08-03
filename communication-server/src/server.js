import http from 'http';
import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();
const server = await import('socket.io');
const httpServer = http.createServer(app);
import connectDB from "./config/db.js";
import socketHandler from './socket/socketHandler.js';


const io = new server.Server(httpServer,{
    cors:{
        origin: "*",
        methods: ["GET", "POST"]
    }
});
socketHandler(io);
await connectDB();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



