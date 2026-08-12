import { io } from "socket.io-client";
import { getServerUrl } from "./config";

let socket = null;

export function initializeSocket() {
    if (!socket) {
        const serverUrl = getServerUrl();

        if (!serverUrl) {
            throw new Error(
                "Server URL is not initialized."
            );
        }
        // socket = io(getServerUrl());
        socket = io(serverUrl, {
            transports: ["websocket"],
        });
        // socket = io(serverUrl);

        socket.on("connect", () => {
            console.log(
                "Socket connected:",
                socket.id
            );
        });

        socket.on("disconnect", (reason) => {
            console.log(
                "Socket disconnected:",
                reason
            );
        });

        socket.on("connect_error", (error) => {
            console.error(
                "Socket connection error:",
                error.message
            );
        });
    }

    return socket;
}

export function getSocket() {
    if (!socket) {
        throw new Error(
            "Socket is not initialized. Call initializeSocket() first."
        );
    }

    return socket;
}