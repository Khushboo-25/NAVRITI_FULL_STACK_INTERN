import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

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
    participantIds = [],
    enabled = true,
    visible = true,
}) {

    const [isSharing, setIsSharing] =
        useState(false);

    const [remoteParticipants, setRemoteParticipants] =
        useState([]);

    const [hiddenRemoteShares, setHiddenRemoteShares] =
        useState(new Set());


    /*
     * =====================================================
     * MY OUTGOING PEER CONNECTIONS
     *
     * One connection per person receiving MY screen.
     *
     * user-1  -> PC
     * user-2  -> PC
     * user-8  -> PC
     * =====================================================
     */

    const outgoingPeerConnectionsRef =
        useRef(new Map());


    /*
     * =====================================================
     * REMOTE INCOMING PEER CONNECTIONS
     *
     * One connection per person sharing their screen with ME.
     *
     * user-8  -> PC
     * user-13 -> PC
     * =====================================================
     */

    const incomingPeerConnectionsRef =
        useRef(new Map());


    /*
     * =====================================================
     * REMOTE STREAMS
     * =====================================================
     */

    const remoteStreamsRef =
        useRef(new Map());


    /*
     * =====================================================
     * PENDING ICE
     *
     * userId -> candidate[]
     * =====================================================
     */

    const pendingCandidatesRef =
        useRef(new Map());


    /*
     * =====================================================
     * REMOTE VIDEO ELEMENTS
     * =====================================================
     */

    const remoteVideoRefs =
        useRef(new Map());


    /*
     * =====================================================
     * MY LOCAL SCREEN STREAM
     * =====================================================
     */

    const localStreamRef =
        useRef(null);


    const localVideoRef =
        useRef(null);


    const userId =
        currentUser?.userId;


    /*
     * =====================================================
     * NORMALIZE PARTICIPANTS
     * =====================================================
     */

    const getParticipantIds =
        useCallback(() => {

            return participantIds
                .map((participant) => {

                    if (
                        typeof participant ===
                        "string"
                    ) {
                        return participant;
                    }

                    return (
                        participant?.userId ??
                        participant?.user_id ??
                        participant?.id
                    );

                })
                .filter(Boolean)
                .map((id) =>
                    id.toString()
                )
                .filter(
                    (id) =>
                        id !==
                        userId?.toString()
                );

        }, [
            participantIds,
            userId,
        ]);


    /*
     * =====================================================
     * REMOVE ONE REMOTE SCREEN
     *
     * This only closes the INCOMING connection.
     *
     * It does NOT affect:
     * - my own screen
     * - other remote screens
     * =====================================================
     */

    const removeRemotePeer =
        useCallback(
            (remoteUserId) => {

                const key =
                    remoteUserId?.toString();

                if (!key) {
                    return;
                }


                console.log(
                    "Removing remote screen:",
                    key
                );


                /*
                 * Close only this incoming PC.
                 */

                const pc =
                    incomingPeerConnectionsRef.current
                        .get(key);


                if (pc) {

                    pc.ontrack = null;

                    pc.onicecandidate =
                        null;

                    pc.onconnectionstatechange =
                        null;

                    pc.close();

                    incomingPeerConnectionsRef.current
                        .delete(key);

                }


                /*
                 * Clear remote stream.
                 */

                remoteStreamsRef.current
                    .delete(key);


                /*
                 * Clear ICE queue.
                 */

                pendingCandidatesRef.current
                    .delete(key);


                /*
                 * Clear video element.
                 */

                const video =
                    remoteVideoRefs.current
                        .get(key);


                if (video) {

                    video.srcObject =
                        null;

                }


                remoteVideoRefs.current
                    .delete(key);


                /*
                 * Remove from UI.
                 */

                setRemoteParticipants(
                    (current) =>
                        current.filter(
                            (id) =>
                                id !== key
                        )
                );


                /*
                 * Remove hidden state.
                 */

                setHiddenRemoteShares(
                    (current) => {

                        const updated =
                            new Set(current);

                        updated.delete(key);

                        return updated;

                    }
                );

            },
            []
        );


    /*
     * =====================================================
     * CREATE INCOMING PEER CONNECTION
     *
     * Used when someone sends THEIR screen to ME.
     * =====================================================
     */

    const createIncomingPeerConnection =
        useCallback(
            (remoteUserId) => {

                const key =
                    remoteUserId?.toString();

                if (!key) {
                    return null;
                }


                const existing =
                    incomingPeerConnectionsRef.current
                        .get(key);


                if (existing) {

                    return existing;

                }


                console.log(
                    "Creating INCOMING screen-share connection:",
                    key
                );


                const pc =
                    new RTCPeerConnection(
                        RTC_CONFIG
                    );


                /*
                 * ICE
                 */

                pc.onicecandidate =
                    (event) => {

                        if (
                            !event.candidate
                        ) {
                            return;
                        }


                        sendScreenShareIceCandidate(
                            conversationId,
                            userId,
                            key,
                            event.candidate
                        );

                    };


                /*
                 * REMOTE SCREEN
                 */

                pc.ontrack =
                    (event) => {

                        console.log(
                            "REMOTE SCREEN TRACK RECEIVED:",
                            key
                        );


                        let stream =
                            event.streams?.[0];


                        /*
                         * Fallback stream.
                         */

                        if (!stream) {

                            stream =
                                remoteStreamsRef.current
                                    .get(key);


                            if (!stream) {

                                stream =
                                    new MediaStream();

                                remoteStreamsRef.current
                                    .set(
                                        key,
                                        stream
                                    );

                            }


                            const exists =
                                stream
                                    .getTracks()
                                    .some(
                                        (track) =>
                                            track.id ===
                                            event.track.id
                                    );


                            if (!exists) {

                                stream.addTrack(
                                    event.track
                                );

                            }

                        } else {

                            remoteStreamsRef.current
                                .set(
                                    key,
                                    stream
                                );

                        }


                        /*
                         * Add remote participant.
                         */

                        setRemoteParticipants(
                            (current) => {

                                if (
                                    current.includes(
                                        key
                                    )
                                ) {

                                    return current;

                                }


                                return [
                                    ...current,
                                    key,
                                ];

                            }
                        );


                        /*
                         * Attach video after render.
                         */

                        setTimeout(() => {

                            const video =
                                remoteVideoRefs.current
                                    .get(key);


                            if (!video) {

                                return;

                            }


                            video.srcObject =
                                stream;


                            video.play()
                                .catch(
                                    (error) => {

                                        console.error(
                                            "REMOTE VIDEO PLAY FAILED:",
                                            {
                                                remoteUserId:
                                                    key,
                                                error,
                                            }
                                        );

                                    }
                                );

                        }, 0);


                        /*
                         * Track ended.
                         */

                        event.track.onended =
                            () => {

                                console.log(
                                    "REMOTE SCREEN TRACK ENDED:",
                                    key
                                );


                                removeRemotePeer(
                                    key
                                );

                            };

                    };


                /*
                 * CONNECTION STATE
                 */

                pc.onconnectionstatechange =
                    () => {

                        console.log(
                            "Incoming screen-share connection:",
                            {
                                remoteUserId:
                                    key,
                                state:
                                    pc.connectionState,
                            }
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
                                incomingPeerConnectionsRef.current
                                    .get(key) ===
                                pc
                            ) {

                                removeRemotePeer(
                                    key
                                );

                            }

                        }

                    };


                incomingPeerConnectionsRef.current
                    .set(
                        key,
                        pc
                    );


                /*
                 * Create ICE queue.
                 */

                if (
                    !pendingCandidatesRef.current
                        .has(key)
                ) {

                    pendingCandidatesRef.current
                        .set(
                            key,
                            []
                        );

                }


                return pc;

            },
            [
                conversationId,
                userId,
                removeRemotePeer,
            ]
        );


    /*
     * =====================================================
     * CREATE OUTGOING PEER CONNECTION
     *
     * Used when I send MY screen to someone.
     * =====================================================
     */

    const createOutgoingPeerConnection =
        useCallback(
            (remoteUserId) => {

                const key =
                    remoteUserId?.toString();

                if (!key) {
                    return null;
                }


                const existing =
                    outgoingPeerConnectionsRef.current
                        .get(key);


                if (existing) {

                    return existing;

                }


                console.log(
                    "Creating OUTGOING screen-share connection:",
                    key
                );


                const pc =
                    new RTCPeerConnection(
                        RTC_CONFIG
                    );


                pc.onicecandidate =
                    (event) => {

                        if (
                            !event.candidate
                        ) {
                            return;
                        }


                        sendScreenShareIceCandidate(
                            conversationId,
                            userId,
                            key,
                            event.candidate
                        );

                    };


                pc.onconnectionstatechange =
                    () => {

                        console.log(
                            "Outgoing screen-share connection:",
                            {
                                remoteUserId:
                                    key,
                                state:
                                    pc.connectionState,
                            }
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
                                outgoingPeerConnectionsRef.current
                                    .get(key) ===
                                pc
                            ) {

                                pc.close();

                                outgoingPeerConnectionsRef.current
                                    .delete(key);

                            }

                        }

                    };


                outgoingPeerConnectionsRef.current
                    .set(
                        key,
                        pc
                    );


                return pc;

            },
            [
                conversationId,
                userId,
            ]
        );


    /*
     * =====================================================
     * START MY SCREEN
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

                console.log(
                    "SCREEN SHARE CLICKED:",
                    {
                        conversationId,
                        userId,
                    }
                );


                /*
                 * Capture screen ONCE.
                 */

                const stream =
                    await navigator
                        .mediaDevices
                        .getDisplayMedia({
                            video: {
                                cursor: "always",
                            },
                            audio: false,
                        });


                localStreamRef.current =
                    stream;


                setIsSharing(true);


                /*
                 * Attach local preview.
                 */

                if (
                    localVideoRef.current
                ) {

                    localVideoRef.current
                        .srcObject =
                        stream;

                }


                /*
                 * Browser stop button.
                 */

                stream
                    .getTracks()
                    .forEach(
                        (track) => {

                            track.onended =
                                () => {

                                    console.log(
                                        "Browser stopped screen sharing"
                                    );

                                    stopSharing();

                                };

                        }
                    );


                /*
                 * Get all recipients.
                 */

                const targets =
                    getParticipantIds();


                console.log(
                    "SCREEN SHARE TARGETS:",
                    targets
                );


                /*
                 * Tell everyone that
                 * I started sharing.
                 */

                notifyScreenShareStarted(
                    conversationId,
                    userId
                );


                /*
                 * One PC per recipient.
                 */

                for (
                    const targetUserId
                    of targets
                ) {

                    try {

                        const pc =
                            createOutgoingPeerConnection(
                                targetUserId
                            );


                        if (!pc) {
                            continue;
                        }


                        /*
                         * Add my screen track.
                         */

                        stream
                            .getTracks()
                            .forEach(
                                (track) => {

                                    const exists =
                                        pc
                                            .getSenders()
                                            .some(
                                                (sender) =>
                                                    sender
                                                        .track
                                                        ?.id ===
                                                    track.id
                                            );


                                    if (!exists) {

                                        pc.addTrack(
                                            track,
                                            stream
                                        );

                                    }

                                }
                            );


                        /*
                         * Create offer.
                         */

                        const offer =
                            await pc.createOffer();


                        await pc.setLocalDescription(
                            offer
                        );


                        console.log(
                            "SENDING SCREEN OFFER:",
                            {
                                from: userId,
                                to: targetUserId,
                            }
                        );


                        sendScreenShareOffer(
                            conversationId,
                            userId,
                            targetUserId,
                            offer
                        );

                    } catch (error) {

                        console.error(
                            "Failed to create outgoing screen connection:",
                            {
                                targetUserId,
                                error,
                            }
                        );

                    }

                }

            } catch (error) {

                console.error(
                    "Failed to start screen sharing:",
                    error
                );

            }

        };


    /*
     * =====================================================
     * STOP MY SCREEN
     *
     * IMPORTANT:
     * Only OUTGOING PCs are closed.
     *
     * Incoming remote screens remain untouched.
     * =====================================================
     */

    const stopSharing =
        useCallback(
            (notify = true) => {

                console.log(
                    "Stopping MY screen share"
                );


                /*
                 * Stop local tracks.
                 */

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


                /*
                 * Remove local video.
                 */

                if (
                    localVideoRef.current
                ) {

                    localVideoRef.current
                        .srcObject =
                        null;

                }


                /*
                 * Close ONLY outgoing PCs.
                 */

                outgoingPeerConnectionsRef.current
                    .forEach((pc) => {

                        pc.onicecandidate =
                            null;

                        pc.onconnectionstatechange =
                            null;

                        pc.close();

                    });


                outgoingPeerConnectionsRef.current
                    .clear();


                setIsSharing(false);


                /*
                 * Tell other users.
                 */

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
            ]
        );


    /*
     * =====================================================
     * HIDE REMOTE SCREEN
     *
     * Connection stays alive.
     * =====================================================
     */

    const toggleRemoteScreen =
        useCallback(
            (remoteUserId) => {

                const key =
                    remoteUserId?.toString();

                if (!key) {
                    return;
                }


                setHiddenRemoteShares(
                    (current) => {

                        const updated =
                            new Set(current);


                        if (
                            updated.has(key)
                        ) {

                            updated.delete(key);

                        } else {

                            updated.add(key);

                        }


                        return updated;

                    }
                );

            },
            []
        );


    /*
     * =====================================================
     * CLOSE REMOTE SCREEN FOR ME
     *
     * Does NOT notify the sharer.
     * Does NOT affect anyone else.
     * =====================================================
     */

    const closeRemoteScreen =
        useCallback(
            (remoteUserId) => {

                console.log(
                    "Closing remote screen locally:",
                    remoteUserId
                );


                removeRemotePeer(
                    remoteUserId
                );

            },
            [
                removeRemotePeer,
            ]
        );


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
         * =================================================
         * OFFER
         * =================================================
         */

        const handleOffer =
            async ({
                userId: senderUserId,
                targetUserId,
                offer,
            }) => {

                if (
                    targetUserId?.toString() !==
                    userId?.toString()
                ) {

                    return;

                }


                if (
                    senderUserId?.toString() ===
                    userId?.toString()
                ) {

                    return;

                }


                const remoteUserId =
                    senderUserId.toString();


                try {

                    console.log(
                        "RECEIVED SCREEN OFFER:",
                        {
                            from:
                                remoteUserId,
                            to:
                                userId,
                        }
                    );


                    /*
                     * If an old incoming PC exists,
                     * replace only that PC.
                     */

                    const oldPc =
                        incomingPeerConnectionsRef.current
                            .get(
                                remoteUserId
                            );


                    if (oldPc) {

                        oldPc.ontrack =
                            null;

                        oldPc.onicecandidate =
                            null;

                        oldPc.onconnectionstatechange =
                            null;

                        oldPc.close();

                        incomingPeerConnectionsRef.current
                            .delete(
                                remoteUserId
                            );

                    }


                    const pc =
                        createIncomingPeerConnection(
                            remoteUserId
                        );


                    if (!pc) {
                        return;
                    }


                    await pc.setRemoteDescription(
                        new RTCSessionDescription(
                            offer
                        )
                    );


                    /*
                     * Add pending ICE.
                     */

                    const pending =
                        pendingCandidatesRef.current
                            .get(
                                remoteUserId
                            ) || [];


                    pendingCandidatesRef.current
                        .set(
                            remoteUserId,
                            []
                        );


                    for (
                        const candidate
                        of pending
                    ) {

                        try {

                            await pc.addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );

                        } catch (error) {

                            console.error(
                                "FAILED PENDING ICE:",
                                {
                                    remoteUserId,
                                    error,
                                }
                            );

                        }

                    }


                    /*
                     * Create answer.
                     */

                    const answer =
                        await pc.createAnswer();


                    await pc.setLocalDescription(
                        answer
                    );


                    sendScreenShareAnswer(
                        conversationId,
                        userId,
                        remoteUserId,
                        answer
                    );

                } catch (error) {

                    console.error(
                        "Failed to handle screen share offer:",
                        {
                            remoteUserId,
                            error,
                        }
                    );

                }

            };


        /*
         * =================================================
         * ANSWER
         * =================================================
         */

        const handleAnswer =
            async ({
                userId: senderUserId,
                targetUserId,
                answer,
            }) => {

                if (
                    targetUserId?.toString() !==
                    userId?.toString()
                ) {

                    return;

                }


                if (
                    senderUserId?.toString() ===
                    userId?.toString()
                ) {

                    return;

                }


                const remoteUserId =
                    senderUserId.toString();


                /*
                 * Answer belongs to an
                 * OUTGOING connection.
                 */

                const pc =
                    outgoingPeerConnectionsRef.current
                        .get(
                            remoteUserId
                        );


                if (!pc) {

                    console.error(
                        "No outgoing PC for screen answer:",
                        remoteUserId
                    );

                    return;

                }


                try {

                    await pc.setRemoteDescription(
                        new RTCSessionDescription(
                            answer
                        )
                    );


                    /*
                     * Add pending ICE.
                     */

                    const pending =
                        pendingCandidatesRef.current
                            .get(
                                remoteUserId
                            ) || [];


                    pendingCandidatesRef.current
                        .set(
                            remoteUserId,
                            []
                        );


                    for (
                        const candidate
                        of pending
                    ) {

                        try {

                            await pc.addIceCandidate(
                                new RTCIceCandidate(
                                    candidate
                                )
                            );

                        } catch (error) {

                            console.error(
                                "FAILED ICE AFTER ANSWER:",
                                {
                                    remoteUserId,
                                    error,
                                }
                            );

                        }

                    }

                } catch (error) {

                    console.error(
                        "Failed to handle screen answer:",
                        {
                            remoteUserId,
                            error,
                        }
                    );

                }

            };


        /*
         * =================================================
         * ICE
         * =================================================
         */

        const handleIceCandidate =
            async ({
                userId: senderUserId,
                targetUserId,
                candidate,
            }) => {

                if (
                    !candidate
                ) {

                    return;

                }


                if (
                    targetUserId?.toString() !==
                    userId?.toString()
                ) {

                    return;

                }


                if (
                    senderUserId?.toString() ===
                    userId?.toString()
                ) {

                    return;

                }


                const remoteUserId =
                    senderUserId.toString();


                /*
                 * The same signaling event can
                 * correspond to:
                 *
                 * incoming PC
                 * OR
                 * outgoing PC
                 *
                 * Try whichever exists.
                 */

                const incomingPc =
                    incomingPeerConnectionsRef.current
                        .get(
                            remoteUserId
                        );


                const outgoingPc =
                    outgoingPeerConnectionsRef.current
                        .get(
                            remoteUserId
                        );


                const pc =
                    incomingPc ||
                    outgoingPc;


                /*
                 * PC not created yet.
                 */

                if (!pc) {

                    if (
                        !pendingCandidatesRef.current
                            .has(
                                remoteUserId
                            )
                    ) {

                        pendingCandidatesRef.current
                            .set(
                                remoteUserId,
                                []
                            );

                    }


                    pendingCandidatesRef.current
                        .get(
                            remoteUserId
                        )
                        .push(
                            candidate
                        );


                    console.log(
                        "SCREEN ICE QUEUED:",
                        remoteUserId
                    );


                    return;

                }


                try {

                    if (
                        pc.remoteDescription &&
                        pc.remoteDescription.type
                    ) {

                        await pc.addIceCandidate(
                            new RTCIceCandidate(
                                candidate
                            )
                        );


                        console.log(
                            "SCREEN ICE ADDED:",
                            remoteUserId
                        );

                    } else {

                        if (
                            !pendingCandidatesRef.current
                                .has(
                                    remoteUserId
                                )
                        ) {

                            pendingCandidatesRef.current
                                .set(
                                    remoteUserId,
                                    []
                                );

                        }


                        pendingCandidatesRef.current
                            .get(
                                remoteUserId
                            )
                            .push(
                                candidate
                            );

                    }

                } catch (error) {

                    console.error(
                        "Failed to add ICE:",
                        {
                            remoteUserId,
                            error,
                        }
                    );

                }

            };


        /*
         * =================================================
         * STARTED
         * =================================================
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
                    "REMOTE USER STARTED SCREEN SHARING:",
                    senderUserId
                );

            };


        /*
         * =================================================
         * STOPPED
         * =================================================
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
                    "REMOTE USER STOPPED SCREEN SHARING:",
                    senderUserId
                );


                /*
                 * Remove ONLY that user's
                 * incoming connection.
                 */

                removeRemotePeer(
                    senderUserId
                );

            };


        /*
         * Register listeners.
         */

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
         * Cleanup listeners only.
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

        };

    }, [
        enabled,
        conversationId,
        userId,
        createIncomingPeerConnection,
        removeRemotePeer,
    ]);


    /*
     * =====================================================
     * ATTACH REMOTE STREAMS
     * =====================================================
     */

    useEffect(() => {

        remoteParticipants.forEach(
            (remoteUserId) => {

                const stream =
                    remoteStreamsRef.current
                        .get(
                            remoteUserId
                        );


                const video =
                    remoteVideoRefs.current
                        .get(
                            remoteUserId
                        );


                if (
                    stream &&
                    video &&
                    video.srcObject !==
                        stream
                ) {

                    video.srcObject =
                        stream;


                    video.play()
                        .catch(
                            (error) => {

                                console.error(
                                    "REMOTE VIDEO PLAY FAILED:",
                                    {
                                        remoteUserId,
                                        error,
                                    }
                                );

                            }
                        );

                }

            }
        );

    }, [
        remoteParticipants,
    ]);


    /*
     * =====================================================
     * LOCAL PREVIEW
     * =====================================================
     */

    useEffect(() => {

        if (
            isSharing &&
            localStreamRef.current &&
            localVideoRef.current
        ) {

            if (
                localVideoRef.current
                    .srcObject !==
                localStreamRef.current
            ) {

                localVideoRef.current
                    .srcObject =
                    localStreamRef.current;

            }


            localVideoRef.current
                .play()
                .catch(
                    (error) => {

                        console.error(
                            "LOCAL VIDEO PLAY FAILED:",
                            error
                        );

                    }
                );

        }

    }, [
        isSharing,
    ]);


    /*
     * =====================================================
     * FULL COMPONENT CLEANUP
     * =====================================================
     */

    useEffect(() => {

        return () => {

            console.log(
                "Cleaning up screen share component"
            );


            /*
             * Stop my local stream.
             */

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


            /*
             * Close outgoing PCs.
             */

            outgoingPeerConnectionsRef.current
                .forEach((pc) => {

                    pc.onicecandidate =
                        null;

                    pc.onconnectionstatechange =
                        null;

                    pc.close();

                });


            outgoingPeerConnectionsRef.current
                .clear();


            /*
             * Close incoming PCs.
             */

            incomingPeerConnectionsRef.current
                .forEach((pc) => {

                    pc.ontrack =
                        null;

                    pc.onicecandidate =
                        null;

                    pc.onconnectionstatechange =
                        null;

                    pc.close();

                });


            incomingPeerConnectionsRef.current
                .clear();


            /*
             * Clear remote streams.
             */

            remoteStreamsRef.current.clear();


            /*
             * Clear ICE.

             */

            pendingCandidatesRef.current
                .clear();


            /*
             * Clear remote videos.
             */

            remoteVideoRefs.current
                .forEach((video) => {

                    if (video) {

                        video.srcObject =
                            null;

                    }

                });


            remoteVideoRefs.current.clear();


            /*
             * Clear local video.
             */

            if (
                localVideoRef.current
            ) {

                localVideoRef.current
                    .srcObject =
                    null;

            }

        };

    }, []);


    /*
     * =====================================================
     * DISABLED
     * =====================================================
     */

    if (!enabled) {

        return null;

    }


    /*
     * IMPORTANT:
     *
     * When visible=false we hide the UI only.
     * The component remains mounted.
     *
     * Therefore WebRTC connections continue.
     */

    if (!visible) {

        return null;

    }


    /*
     * =====================================================
     * UI
     * =====================================================
     */

    const hasRemoteScreens =
        remoteParticipants.length > 0;


    return (
        <div className="rtc-screen-share-container">


            {/* =================================================
                SHARE SCREEN BUTTON
            ================================================= */}

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


            {/* =================================================
                SCREEN SHARE VIEWER
            ================================================= */}

            {(isSharing ||
                hasRemoteScreens) && (

                <div className="rtc-screen-share-viewer">


                    {/* =========================================
                        VIEWER HEADER
                    ========================================= */}

                    <div className="rtc-screen-share-viewer-header">

                        <span>
                            Screen sharing
                        </span>

                        <span className="rtc-screen-share-live">
                            LIVE
                        </span>

                    </div>


                    {/* =========================================
                        SCREEN CARDS
                    ========================================= */}

                    <div className="rtc-screen-share-videos">


                        {/* =====================================
                            MY SCREEN
                        ===================================== */}

                        {isSharing && (

                            <div className="rtc-screen-share-card">


                                <div className="rtc-screen-share-card-header">

                                    <span className="rtc-screen-share-user-name">
                                        You
                                    </span>


                                    <div className="rtc-screen-share-card-actions">

                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() =>
                                                stopSharing()
                                            }
                                            title="Stop sharing"
                                            aria-label="Stop sharing"
                                        >
                                            ✕
                                        </button>

                                    </div>

                                </div>


                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="rtc-screen-share-video"
                                />

                            </div>

                        )}


                        {/* =====================================
                            REMOTE SCREENS
                        ===================================== */}

                        {remoteParticipants.map(
                            (remoteUserId) => {

                                const isHidden =
                                    hiddenRemoteShares.has(
                                        remoteUserId
                                    );


                                return (

                                    <div
                                        key={
                                            remoteUserId
                                        }
                                        className={`rtc-screen-share-card ${
                                            isHidden
                                                ? "hidden"
                                                : ""
                                        }`}
                                    >


                                        {/* CARD HEADER */}

                                        <div className="rtc-screen-share-card-header">

                                            <span className="rtc-screen-share-user-name">
                                                {remoteUserId}
                                            </span>


                                            <div className="rtc-screen-share-card-actions">


                                                {/* HIDE */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRemoteScreen(
                                                            remoteUserId
                                                        )
                                                    }
                                                    title={
                                                        isHidden
                                                            ? "Show screen"
                                                            : "Hide screen"
                                                    }
                                                    aria-label={
                                                        isHidden
                                                            ? "Show screen"
                                                            : "Hide screen"
                                                    }
                                                >

                                                    {isHidden
                                                        ? "◉"
                                                        : "◌"}

                                                </button>


                                                {/* CLOSE FOR ME */}

                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() =>
                                                        closeRemoteScreen(
                                                            remoteUserId
                                                        )
                                                    }
                                                    title="Close screen for me"
                                                    aria-label="Close screen for me"
                                                >

                                                    ✕

                                                </button>

                                            </div>

                                        </div>


                                        {/* VIDEO */}

                                        {!isHidden && (

                                            <video
                                                ref={(
                                                    element
                                                ) => {

                                                    if (
                                                        element
                                                    ) {

                                                        remoteVideoRefs.current
                                                            .set(
                                                                remoteUserId,
                                                                element
                                                            );


                                                        const stream =
                                                            remoteStreamsRef.current
                                                                .get(
                                                                    remoteUserId
                                                                );


                                                        if (
                                                            stream &&
                                                            element.srcObject !==
                                                                stream
                                                        ) {

                                                            element.srcObject =
                                                                stream;


                                                            element
                                                                .play()
                                                                .catch(
                                                                    (
                                                                        error
                                                                    ) => {

                                                                        console.error(
                                                                            "REMOTE VIDEO PLAY FAILED:",
                                                                            {
                                                                                remoteUserId,
                                                                                error,
                                                                            }
                                                                        );

                                                                    }
                                                                );

                                                        }

                                                    } else {

                                                        remoteVideoRefs.current
                                                            .delete(
                                                                remoteUserId
                                                            );

                                                    }

                                                }}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="rtc-screen-share-video"
                                            />

                                        )}


                                        {/* HIDDEN STATE */}

                                        {isHidden && (

                                            <div className="rtc-screen-share-hidden">

                                                <span>
                                                    Screen hidden
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleRemoteScreen(
                                                            remoteUserId
                                                        )
                                                    }
                                                >
                                                    Show
                                                </button>

                                            </div>

                                        )}

                                    </div>

                                );

                            }
                        )}

                    </div>

                </div>

            )}

        </div>
    );
}


export default ScreenShare;
