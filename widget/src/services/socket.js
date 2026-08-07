import { io } from "socket.io-client";
import { getServerUrl } from "./config";

let socket = null;

export function initializeSocket() {
  if(!socket){
    socket = io(getServerUrl(), {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
    });
  }

  return socket;
}

export function getSocket() {
  return socket;
}