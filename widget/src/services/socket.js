import {io} from "socket.io-client";


console.log("socket.js loaded");
const socket = io("http://localhost:5000",{
    transports: ["websocket"],
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);
});
socket.on("disconnect", (err) => {
    console.log("Disconnected from server", err.message);
});

export default socket;