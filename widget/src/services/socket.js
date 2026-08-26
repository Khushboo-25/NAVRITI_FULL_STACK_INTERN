import { io } from "socket.io-client";
import { getServerUrl } from "./config";

let socket = null;

export function initializeSocket(
    userId
) {
    if (!socket) {
        const serverUrl = getServerUrl();

        if (!serverUrl) {
            throw new Error(
                "Server URL is not initialized."
            );
        }

        socket = io(serverUrl, {
            transports: ["websocket"],
        });

        socket.on("connect", () => {
            console.log(
                "Socket connected:",
                socket.id
            );

            if (userId) {
                socket.emit(
                    "joinUser",
                    userId
                );
            }
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



/* 
 * ---------------------------------------------------------
 * Join Announcement RTC room
 * ---------------------------------------------------------
 */

export function joinAnnouncementRTC(
    portalId,
    userId
) {
    const socket = getSocket();

    if (!portalId || !userId) {
        return;
    }

    socket.emit(
        "joinAnnouncementRTC",
        {
            portalId,
            userId,
        }
    );
}


/*
 * ---------------------------------------------------------
 * Leave Announcement RTC room
 * ---------------------------------------------------------
 */

export function leaveAnnouncementRTC(
    portalId,
    userId
) {
    const socket = getSocket();

    if (!portalId || !userId) {
        return;
    }

    socket.emit(
        "leaveAnnouncementRTC",
        {
            portalId,
            userId,
        }
    );
}


export function sendAnnouncementOffer(
    portalId,
    userId,
    offer
) {
    const socket = getSocket();

    socket.emit(
        "announcement:offer",
        {
            portalId,
            userId,
            offer,
        }
    );
}


export function sendAnnouncementAnswer(
    portalId,
    userId,
    answer
) {
    const socket = getSocket();

    socket.emit(
        "announcement:answer",
        {
            portalId,
            userId,
            answer,
        }
    );
}


export function sendAnnouncementIceCandidate(
    portalId,
    userId,
    candidate
) {
    const socket = getSocket();

    socket.emit(
        "announcement:ice-candidate",
        {
            portalId,
            userId,
            candidate,
        }
    );
}