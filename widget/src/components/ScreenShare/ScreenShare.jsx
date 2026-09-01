import { useCallback, useEffect, useRef, useState } from "react";

import { getSocket } from "../../services/socket";

import {
    sendScreenShareAnswer,
    sendScreenShareIceCandidate,
    sendScreenShareOffer,
    notifyScreenShareStarted,
    notifyScreenShareStopped,
} from "../../services/socket";

import "./ScreenShare.css";


const RTC_CONFIG = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302",
        },
    ],
};


function ScreenShare({
    conversationId,
    currentUser,
    enabled = true,
}) {
    

    const [isSharing, setIsSharing] =
        useState(false);

    const [remoteSharing, setRemoteSharing] =
        useState(false);


    const peerConnectionRef =
        useRef(null);

    const localStreamRef =
        useRef(null);

    const remoteStreamRef =
        useRef(null);

    const remoteVideoRef =
        useRef(null);

    const pendingCandidatesRef =
        useRef([]);


    const userId =
        currentUser?.userId;


    /*
     * =====================================================
     * Close peer connection
     * =====================================================
     */

    const closePeerConnection =
        useCallback(() => {

            if (peerConnectionRef.current) {

                peerConnectionRef.current.ontrack = null;
                peerConnectionRef.current.onicecandidate = null;

                peerConnectionRef.current.close();

                peerConnectionRef.current = null;
            }

            remoteStreamRef.current = null;

            pendingCandidatesRef.current = [];

        }, []);


    /*
     * =====================================================
     * Create Peer Connection
     * =====================================================
     */

    const createPeerConnection =
        useCallback(() => {

            const pc =
                new RTCPeerConnection(
                    RTC_CONFIG
                );


            /*
             * ICE
             */

            pc.onicecandidate =
                (event) => {

                    if (!event.candidate) {
                        return;
                    }

                    sendScreenShareIceCandidate(
                        conversationId,
                        userId,
                        event.candidate
                    );
                };


            /*
             * REMOTE SCREEN TRACK
             */

            pc.ontrack = (event) => {
                console.log(
                    "REMOTE SCREEN TRACK RECEIVED",
                    event
                );

                let stream = event.streams?.[0];

                if (!stream) {
                    if (!remoteStreamRef.current) {
                        remoteStreamRef.current = new MediaStream();
                    }

                    stream = remoteStreamRef.current;

                    if (
                        !stream
                            .getTracks()
                            .some(
                                (track) =>
                                    track.id === event.track.id
                            )
                    ) {
                        stream.addTrack(event.track);
                    }
                }

                remoteStreamRef.current = stream;

                setRemoteSharing(true);

                // IMPORTANT:
                // React may not have rendered <video> yet.
                // Attach stream after render.
                setTimeout(() => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;

                        remoteVideoRef.current
                            .play()
                            .then(() => {
                                console.log(
                                    "REMOTE SCREEN VIDEO PLAYING"
                                );
                            })
                            .catch((error) => {
                                console.error(
                                    "REMOTE VIDEO PLAY FAILED",
                                    error
                                );
                            });
                    }
                }, 0);
            };


            pc.onconnectionstatechange =
                () => {

                    console.log(
                        "Screen share connection:",
                        pc.connectionState
                    );


                    if (
                        pc.connectionState ===
                            "failed" ||
                        pc.connectionState ===
                            "closed" ||
                        pc.connectionState ===
                            "disconnected"
                    ) {

                        if (
                            peerConnectionRef.current ===
                            pc
                        ) {

                            closePeerConnection();

                            setRemoteSharing(
                                false
                            );
                        }
                    }
                };


            peerConnectionRef.current =
                pc;


            return pc;

        }, [
            conversationId,
            userId,
            closePeerConnection,
        ]);


    /*
     * =====================================================
     * STOP SCREEN SHARING
     * =====================================================
     */

    const stopSharing =
        useCallback(
            (notify = true) => {

                console.log(
                    "Stopping screen share"
                );


                if (
                    localStreamRef.current
                ) {

                    localStreamRef.current
                        .getTracks()
                        .forEach(
                            (track) => {

                                track.onended =
                                    null;

                                track.stop();

                            }
                        );

                    localStreamRef.current =
                        null;
                }


                closePeerConnection();


                setIsSharing(false);


                if (
                    notify &&
                    conversationId &&
                    userId
                ) {

                    notifyScreenShareStopped(
                        conversationId,
                        userId
                    );
                }

            },
            [
                conversationId,
                userId,
                closePeerConnection,
            ]
        );


    /*
     * =====================================================
     * START SCREEN SHARING
     * =====================================================
     */
    

    const startSharing =
        async () => {

            if (
                !conversationId ||
                !userId ||
                isSharing
            ) {

                return;
            }


            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices
                    .getDisplayMedia
            ) {

                console.error(
                    "Screen sharing is not supported."
                );

                return;
            }


            try {
                console.log("SCREEN SHARE CLICKED", {
                    conversationId,
                    userId,
                    isSharing,
                });
                console.log(
                    "Requesting screen..."
                );


                const stream =
                    await navigator
                        .mediaDevices
                        .getDisplayMedia({
                            
                            video: {
                                cursor: "always",
                            },
                            audio: false,
                        });

                console.log(
                                "SCREEN CAPTURE ACQUIRED",
                                stream
                            );
                console.log(
                    "Screen selected:",
                    stream
                );


                const pc =
                    createPeerConnection();


                /*
                 * Add screen track
                 */

                stream
                    .getTracks()
                    .forEach(
                        (track) => {

                            pc.addTrack(
                                track,
                                stream
                            );


                            /*
                             * Browser's native
                             * "Stop sharing"
                             */

                            track.onended =
                                () => {

                                    console.log(
                                        "Browser stopped screen sharing"
                                    );

                                    stopSharing();
                                };

                        }
                    );


                localStreamRef.current =
                    stream;


                setIsSharing(true);


                /*
                 * Tell receiver that sharing
                 * has started.
                 */

                notifyScreenShareStarted(
                    conversationId,
                    userId
                );


                /*
                 * Create offer
                 */
                console.log(
                    "SENDING SCREEN OFFER",
                    {
                        conversationId,
                        userId,
                    }
                );
                const offer =
                    await pc.createOffer();


                await pc.setLocalDescription(
                    offer
                );


                console.log(
                    "SCREEN CAPTURE ACQUIRED",
                    stream
                );

                sendScreenShareOffer(
                    conversationId,
                    userId,
                    offer
                );

            } catch (error) {

                console.error(
                    "Failed to start screen sharing:",
                    error
                );

            }

        };


    /*
     * =====================================================
     * SOCKET SIGNALING
     * =====================================================
     */

    useEffect(() => {

        if (
            !enabled ||
            !conversationId ||
            !userId
        ) {

            return;
        }


        const socket =
            getSocket();


        /*
         * -------------------------------------------------
         * RECEIVE OFFER
         * -------------------------------------------------
         */

        const handleOffer = async ({
            userId: senderUserId,
            offer,
        }) => {

            if (
                senderUserId?.toString() ===
                userId?.toString()
            ) {
                return;
            }

            try {

                console.log(
                    "RECEIVED SCREEN OFFER",
                    {
                        senderUserId,
                        conversationId,
                    }
                );

                closePeerConnection();

                const pc =
                    createPeerConnection();

                await pc.setRemoteDescription(
                    new RTCSessionDescription(offer)
                );

                /*
                * Process ICE candidates that arrived
                * before the offer.
                */

                const pendingCandidates = [
                    ...pendingCandidatesRef.current,
                ];

                pendingCandidatesRef.current = [];

                for (
                    const candidate
                    of pendingCandidates
                ) {

                    try {

                        await pc.addIceCandidate(
                            new RTCIceCandidate(candidate)
                        );

                        console.log(
                            "PENDING SCREEN ICE ADDED"
                        );

                    } catch (error) {

                        console.error(
                            "Failed pending ICE:",
                            error
                        );
                    }
                }

                /*
                * Create answer
                */

                const answer =
                    await pc.createAnswer();

                await pc.setLocalDescription(
                    answer
                );

                console.log(
                    "SENDING SCREEN ANSWER",
                    {
                        conversationId,
                        userId,
                    }
                );

                sendScreenShareAnswer(
                    conversationId,
                    userId,
                    answer
                );

            } catch (error) {

                console.error(
                    "Failed to handle screen share offer:",
                    error
                );
            }
        };


        /*
         * -------------------------------------------------
         * RECEIVE ANSWER
         * -------------------------------------------------
         */

        const handleAnswer =
            async ({
                userId: senderUserId,
                answer,
            }) => {

                if (
                    senderUserId?.toString() ===
                    userId?.toString()
                ) {

                    return;
                }


                const pc =
                    peerConnectionRef.current;


                if (!pc) {

                    console.error(
                        "No screen share peer connection"
                    );

                    return;
                }


                try {

                    console.log(
                        "Screen share answer received"
                    );


                    await pc.setRemoteDescription(
                        new RTCSessionDescription(
                            answer
                        )
                    );


                    for (
                        const candidate
                        of pendingCandidatesRef.current
                    ) {

                        await pc.addIceCandidate(
                            new RTCIceCandidate(
                                candidate
                            )
                        );

                    }


                    pendingCandidatesRef.current =
                        [];

                } catch (error) {

                    console.error(
                        "Failed to handle screen share answer:",
                        error
                    );

                }

            };


        /*
         * -------------------------------------------------
         * RECEIVE ICE
         * -------------------------------------------------
         */

        const handleIceCandidate = async ({
            userId: senderUserId,
            candidate,
        }) => {
            if (
                !candidate ||
                senderUserId?.toString() ===
                    userId?.toString()
            ) {
                return;
            }

            const pc =
                peerConnectionRef.current;

            if (!pc) {
                pendingCandidatesRef.current.push(
                    candidate
                );
                return;
            }

            try {
                if (
                    pc.remoteDescription &&
                    pc.remoteDescription.type
                ) {
                    await pc.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );

                    console.log(
                        "REMOTE SCREEN ICE ADDED"
                    );
                } else {
                    pendingCandidatesRef.current.push(
                        candidate
                    );

                    console.log(
                        "SCREEN ICE QUEUED"
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to add ICE candidate:",
                    error
                );
            }
        };


        /*
         * -------------------------------------------------
         * SCREEN SHARE STARTED
         * -------------------------------------------------
         */

        const handleStarted =
            ({
                userId: senderUserId,
            }) => {

                if (
                    senderUserId?.toString() ===
                    userId?.toString()
                ) {

                    return;
                }


                console.log(
                    "Remote user started screen sharing"
                );

            };


        /*
         * -------------------------------------------------
         * SCREEN SHARE STOPPED
         * -------------------------------------------------
         */

        const handleStopped =
            ({
                userId: senderUserId,
            }) => {

                if (
                    senderUserId?.toString() ===
                    userId?.toString()
                ) {

                    return;
                }


                console.log(
                    "Remote user stopped screen sharing"
                );


                setRemoteSharing(false);


                if (
                    remoteVideoRef.current
                ) {

                    remoteVideoRef.current.srcObject =
                        null;

                }


                closePeerConnection();

            };


        socket.on(
            "screenShare:offer",
            handleOffer
        );

        socket.on(
            "screenShare:answer",
            handleAnswer
        );

        socket.on(
            "screenShare:ice-candidate",
            handleIceCandidate
        );

        socket.on(
            "screenShare:started",
            handleStarted
        );

        socket.on(
            "screenShare:stopped",
            handleStopped
        );


        /*
         * -------------------------------------------------
         * CLEANUP
         * -------------------------------------------------
         */

        return () => {

            socket.off(
                "screenShare:offer",
                handleOffer
            );

            socket.off(
                "screenShare:answer",
                handleAnswer
            );

            socket.off(
                "screenShare:ice-candidate",
                handleIceCandidate
            );

            socket.off(
                "screenShare:started",
                handleStarted
            );

            socket.off(
                "screenShare:stopped",
                handleStopped
            );


            stopSharing(false);


            setRemoteSharing(false);


            if (
                remoteVideoRef.current
            ) {

                remoteVideoRef.current.srcObject =
                    null;

            }

        };

    }, [
        enabled,
        conversationId,
        userId,
        createPeerConnection,
        closePeerConnection,
        stopSharing,
    ]);
        useEffect(() => {
        if (
            remoteSharing &&
            remoteStreamRef.current &&
            remoteVideoRef.current
        ) {
            remoteVideoRef.current.srcObject =
                remoteStreamRef.current;

            remoteVideoRef.current
                .play()
                .catch((error) => {
                    console.error(
                        "REMOTE VIDEO PLAY FAILED:",
                        error
                    );
                });
        }
    }, [remoteSharing]);


    if (!enabled) {
        return null;
    }


    return (
        <>

            {/* ================================
                SCREEN SHARE BUTTON
            ================================= */}

            <button
                type="button"
                className={`rtc-screen-share-button ${
                    isSharing
                        ? "active"
                        : ""
                }`}
                onClick={
                    isSharing
                        ? () => stopSharing()
                        : startSharing
                }
                aria-label={
                    isSharing
                        ? "Stop screen sharing"
                        : "Share screen"
                }
                title={
                    isSharing
                        ? "Stop screen sharing"
                        : "Share screen"
                }
            >
                {isSharing
                    ? "■"
                    : "▣"}
            </button>


            {/* ================================
                REMOTE SCREEN
            ================================= */}

            {remoteSharing && (
                <div className="rtc-screen-share-viewer">

                    <div className="rtc-screen-share-viewer-header">

                        <span>
                            Screen sharing
                        </span>

                        <span className="rtc-screen-share-live">
                            LIVE
                        </span>

                    </div>


                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="rtc-screen-share-video"
                    />

                </div>
            )}

        </>
    );
}


export default ScreenShare;