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
            transports: ["polling", "websocket"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
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

export function sendScreenShareOffer(conversationId, userId, offer) {
    getSocket().emit("screenShare:offer", {
        conversationId,
        userId,
        offer,
    });
}

export function sendScreenShareAnswer(conversationId, userId, answer) {
    getSocket().emit("screenShare:answer", {
        conversationId,
        userId,
        answer,
    });
}

export function sendScreenShareIceCandidate(
    conversationId,
    userId,
    candidate
) {
    getSocket().emit("screenShare:ice-candidate", {
        conversationId,
        userId,
        candidate,
    });
}

export function notifyScreenShareStarted(conversationId, userId) {
    getSocket().emit("screenShare:started", {
        conversationId,
        userId,
    });
}

export function notifyScreenShareStopped(conversationId, userId) {
    getSocket().emit("screenShare:stopped", {
        conversationId,
        userId,
    });
}
