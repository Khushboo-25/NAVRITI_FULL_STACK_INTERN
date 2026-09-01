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
}) {

    const [isSharing, setIsSharing] =
        useState(false);

    const [remoteSharing, setRemoteSharing] =
        useState(false);


    /*
     * =====================================================
     * One PeerConnection per remote participant
     *
     * user-8  -> RTCPeerConnection
     * user-13 -> RTCPeerConnection
     * user-14 -> RTCPeerConnection
     * =====================================================
     */

    const peerConnectionsRef =
        useRef(new Map());


    /*
     * =====================================================
     * One MediaStream per remote participant
     * =====================================================
     */

    const remoteStreamsRef =
        useRef(new Map());


    /*
     * =====================================================
     * ICE candidates per remote participant
     * =====================================================
     */

    const pendingCandidatesRef =
        useRef(new Map());


    /*
     * =====================================================
     * Video element per remote participant
     * =====================================================
     */

    const remoteVideoRefs =
        useRef(new Map());


    /*
     * =====================================================
     * Local screen stream
     * =====================================================
     */

    const localStreamRef =
        useRef(null);


    /*
     * =====================================================
     * Remote participants currently displaying screen
     * =====================================================
     */

    const [remoteParticipants, setRemoteParticipants] =
        useState([]);


    const userId =
        currentUser?.userId;


    /*
     * =====================================================
     * NORMALIZE PARTICIPANT IDS
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
     * REMOVE ONE PEER
     * =====================================================
     */

    const removePeerConnection =
        useCallback(
            (remoteUserId) => {

                const key =
                    remoteUserId?.toString();

                if (!key) {
                    return;
                }


                console.log(
                    "Removing screen-share peer:",
                    key
                );


                const pc =
                    peerConnectionsRef.current
                        .get(key);


                if (pc) {

                    pc.ontrack = null;

                    pc.onicecandidate =
                        null;

                    pc.onconnectionstatechange =
                        null;

                    pc.close();

                    peerConnectionsRef.current
                        .delete(key);

                }


                remoteStreamsRef.current
                    .delete(key);


                pendingCandidatesRef.current
                    .delete(key);


                remoteVideoRefs.current
                    .delete(key);


                setRemoteParticipants(
                    (current) => {

                        const updated =
                            current.filter(
                                (id) =>
                                    id !== key
                            );


                        /*
                         * Hide viewer only when
                         * the LAST remote peer is gone.
                         */

                        if (
                            updated.length ===
                            0
                        ) {

                            setRemoteSharing(
                                false
                            );

                        }


                        return updated;

                    }
                );

            },
            []
        );


    /*
     * =====================================================
     * CLOSE ALL PEER CONNECTIONS
     * =====================================================
     */

    const closeAllPeerConnections =
        useCallback(() => {

            console.log(
                "Closing all screen-share peer connections"
            );


            peerConnectionsRef.current
                .forEach((pc) => {

                    pc.ontrack = null;

                    pc.onicecandidate =
                        null;

                    pc.onconnectionstatechange =
                        null;

                    pc.close();

                });


            peerConnectionsRef.current.clear();

            remoteStreamsRef.current.clear();

            pendingCandidatesRef.current.clear();

            remoteVideoRefs.current.clear();

            setRemoteParticipants([]);

            setRemoteSharing(false);

        }, []);


    /*
     * =====================================================
     * CREATE PEER CONNECTION FOR ONE USER
     * =====================================================
     */

    const createPeerConnection =
        useCallback(
            (remoteUserId) => {

                const key =
                    remoteUserId?.toString();

                if (!key) {
                    return null;
                }


                /*
                 * Reuse existing PC.
                 */

                const existing =
                    peerConnectionsRef.current
                        .get(key);


                if (existing) {

                    return existing;

                }


                console.log(
                    "Creating screen-share peer connection:",
                    key
                );


                const pc =
                    new RTCPeerConnection(
                        RTC_CONFIG
                    );


                /*
                 * Create ICE queue for this user.
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


                /*
                 * =================================================
                 * ICE CANDIDATE
                 * =================================================
                 */

                pc.onicecandidate =
                    (event) => {

                        if (
                            !event.candidate
                        ) {

                            return;

                        }


                        console.log(
                            "Sending screen-share ICE:",
                            {
                                from: userId,
                                to: key,
                            }
                        );


                        sendScreenShareIceCandidate(
                            conversationId,
                            userId,
                            key,
                            event.candidate
                        );

                    };


                /*
                 * =================================================
                 * REMOTE TRACK
                 * =================================================
                 */

                pc.ontrack =
                    (event) => {

                        console.log(
                            "REMOTE SCREEN TRACK RECEIVED:",
                            {
                                from: key,
                                event,
                            }
                        );


                        let stream =
                            event.streams?.[0];


                        /*
                         * Fallback MediaStream.
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


                            const alreadyAdded =
                                stream
                                    .getTracks()
                                    .some(
                                        (track) =>
                                            track.id ===
                                            event.track.id
                                    );


                            if (
                                !alreadyAdded
                            ) {

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
                         * Add this user to
                         * visible remote screens.
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
                         * IMPORTANT:
                         *
                         * This makes the viewer
                         * actually render.
                         */

                        setRemoteSharing(
                            true
                        );


                        /*
                         * Attach stream after
                         * React renders <video>.
                         */

                        setTimeout(() => {

                            const video =
                                remoteVideoRefs.current
                                    .get(key);


                            if (!video) {

                                console.warn(
                                    "Remote video element not ready:",
                                    key
                                );

                                return;

                            }


                            video.srcObject =
                                stream;


                            video.play()
                                .then(() => {

                                    console.log(
                                        "REMOTE SCREEN VIDEO PLAYING:",
                                        key
                                    );

                                })
                                .catch(
                                    (error) => {

                                        console.error(
                                            "REMOTE VIDEO PLAY FAILED:",
                                            {
                                                userId: key,
                                                error,
                                            }
                                        );

                                    }
                                );

                        }, 0);


                        /*
                         * Remote track ended.
                         */

                        event.track.onended =
                            () => {

                                console.log(
                                    "Remote screen track ended:",
                                    key
                                );


                                removePeerConnection(
                                    key
                                );

                            };

                    };


                /*
                 * =================================================
                 * CONNECTION STATE
                 * =================================================
                 */

                pc.onconnectionstatechange =
                    () => {

                        console.log(
                            "Screen-share connection:",
                            {
                                remoteUserId: key,
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
                                peerConnectionsRef.current
                                    .get(key) ===
                                pc
                            ) {

                                removePeerConnection(
                                    key
                                );

                            }

                        }

                    };


                /*
                 * Save PC using remote user
                 * as the Map key.
                 */

                peerConnectionsRef.current.set(
                    key,
                    pc
                );


                return pc;

            },
            [
                conversationId,
                userId,
                removePeerConnection,
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

                console.log(
                    "SCREEN SHARE CLICKED:",
                    {
                        conversationId,
                        userId,
                    }
                );


                /*
                 * Get screen ONCE.
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


                console.log(
                    "SCREEN CAPTURE ACQUIRED:",
                    stream
                );


                localStreamRef.current =
                    stream;


                setIsSharing(true);


                /*
                 * Browser native Stop sharing.
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
                 * Get every participant except
                 * current user.
                 */

                const targets =
                    getParticipantIds();


                console.log(
                    "SCREEN SHARE TARGETS:",
                    targets
                );


                if (!targets.length) {

                    console.warn(
                        "No remote participants available for screen sharing."
                    );

                    return;

                }


                /*
                 * Notify conversation.
                 */

                notifyScreenShareStarted(
                    conversationId,
                    userId
                );


                /*
                 * =================================================
                 * ONE PEER CONNECTION PER PARTICIPANT
                 * =================================================
                 */

                for (
                    const targetUserId
                    of targets
                ) {

                    try {

                        console.log(
                            "Creating screen-share connection to:",
                            targetUserId
                        );


                        const pc =
                            createPeerConnection(
                                targetUserId
                            );


                        if (!pc) {

                            continue;

                        }


                        /*
                         * Add same screen track
                         * to this peer connection.
                         */

                        stream
                            .getTracks()
                            .forEach(
                                (track) => {

                                    pc.addTrack(
                                        track,
                                        stream
                                    );

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
                            `Failed to create screen-share connection for ${targetUserId}:`,
                            error
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
     * STOP SCREEN SHARING
     * =====================================================
     */

    const stopSharing =
        useCallback(
            (notify = true) => {

                console.log(
                    "Stopping screen share"
                );


                /*
                 * Stop local screen.
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
                 * Close all PCs.
                 */

                closeAllPeerConnections();


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
                closeAllPeerConnections,
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
         * RECEIVE OFFER
         * =================================================
         */

        const handleOffer =
            async ({
                userId: senderUserId,
                targetUserId,
                offer,
            }) => {
                 console.log("========== SCREEN OFFER RECEIVED ==========");
                console.log({
                    myUserId: userId,
                    senderUserId,
                    targetUserId,
                    conversationId,
                    hasOffer: !!offer,
                });
                console.log("==========================================");

                /*
                 * Ignore offers not meant for us.
                 */

                if (
                    targetUserId?.toString() !==
                    userId?.toString()
                ) {

                    return;

                }


                /*
                 * Ignore own offer.
                 */

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
                            from: remoteUserId,
                            to: userId,
                        }
                    );


                    /*
                     * If an old PC exists for
                     * this SAME user, close it.
                     *
                     * Do not touch other users.
                     */

                    const existing =
                        peerConnectionsRef.current
                            .get(
                                remoteUserId
                            );


                    if (existing) {

                        existing.ontrack =
                            null;

                        existing.onicecandidate =
                            null;

                        existing.onconnectionstatechange =
                            null;

                        existing.close();

                        peerConnectionsRef.current
                            .delete(
                                remoteUserId
                            );

                    }


                    /*
                     * Create PC for this sender.
                     */

                    const pc =
                        createPeerConnection(
                            remoteUserId
                        );


                    if (!pc) {

                        return;

                    }


                    /*
                     * Set remote offer.
                     */

                    await pc.setRemoteDescription(
                        new RTCSessionDescription(
                            offer
                        )
                    );


                    /*
                     * Process ICE that arrived
                     * before offer.
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


                            console.log(
                                "PENDING SCREEN ICE ADDED:",
                                remoteUserId
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


                    console.log(
                        "SENDING SCREEN ANSWER:",
                        {
                            from: userId,
                            to: remoteUserId,
                        }
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
         * RECEIVE ANSWER
         * =================================================
         */

        const handleAnswer =
            async ({
                userId: senderUserId,
                targetUserId,
                answer,
            }) => {

                /*
                 * Answer must be for us.
                 */

                if (
                    targetUserId?.toString() !==
                    userId?.toString()
                ) {

                    return;

                }


                const remoteUserId =
                    senderUserId.toString();


                const pc =
                    peerConnectionsRef.current
                        .get(
                            remoteUserId
                        );


                if (!pc) {

                    console.error(
                        "No peer connection for screen-share answer:",
                        remoteUserId
                    );

                    return;

                }


                try {

                    console.log(
                        "RECEIVED SCREEN ANSWER:",
                        {
                            from: remoteUserId,
                            to: userId,
                        }
                    );


                    await pc.setRemoteDescription(
                        new RTCSessionDescription(
                            answer
                        )
                    );


                    /*
                     * Add ICE that arrived
                     * before answer.
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
                                "FAILED PENDING ICE AFTER ANSWER:",
                                {
                                    remoteUserId,
                                    error,
                                }
                            );

                        }

                    }

                } catch (error) {

                    console.error(
                        "Failed to handle screen share answer:",
                        {
                            remoteUserId,
                            error,
                        }
                    );

                }

            };


        /*
         * =================================================
         * RECEIVE ICE
         * =================================================
         */

        const handleIceCandidate =
            async ({
                userId: senderUserId,
                targetUserId,
                candidate,
            }) => {

                /*
                 * Only process ICE meant for us.
                 */

                if (
                    targetUserId?.toString() !==
                    userId?.toString()
                ) {

                    return;

                }


                if (!candidate) {

                    return;

                }


                const remoteUserId =
                    senderUserId.toString();


                const pc =
                    peerConnectionsRef.current
                        .get(
                            remoteUserId
                        );


                /*
                 * PC doesn't exist yet.
                 * Queue ICE for this specific user.
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

                    /*
                     * Remote description already exists.
                     */

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
                            "REMOTE SCREEN ICE ADDED:",
                            remoteUserId
                        );

                    } else {

                        /*
                         * Queue until remote offer
                         * is applied.
                         */

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

                    }

                } catch (error) {

                    console.error(
                        "Failed to add ICE candidate:",
                        {
                            remoteUserId,
                            error,
                        }
                    );

                }

            };


        /*
         * =================================================
         * SCREEN SHARE STARTED
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
         * SCREEN SHARE STOPPED
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
                 * Remove only this sender.
                 */

                removePeerConnection(
                    senderUserId
                );

            };


        /*
         * =================================================
         * REGISTER LISTENERS
         * =================================================
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
         * =================================================
         * CLEANUP LISTENERS
         * =================================================
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
        createPeerConnection,
        removePeerConnection,
    ]);


    /*
     * =====================================================
     * ATTACH STREAMS AFTER VIDEO RENDERS
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

                    console.log(
                        "ATTACHING REMOTE STREAM:",
                        remoteUserId
                    );


                    video.srcObject =
                        stream;


                    video.play()
                        .then(() => {

                            console.log(
                                "REMOTE VIDEO PLAYING:",
                                remoteUserId
                            );

                        })
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
     * CLEANUP WHEN COMPONENT UNMOUNTS
     * =====================================================
     */

    useEffect(() => {

        return () => {

            console.log(
                "Cleaning up screen share component"
            );


            /*
             * Stop local screen.
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
             * Close every PC.
             */

            peerConnectionsRef.current
                .forEach((pc) => {

                    pc.ontrack = null;

                    pc.onicecandidate =
                        null;

                    pc.onconnectionstatechange =
                        null;

                    pc.close();

                });


            peerConnectionsRef.current.clear();

            remoteStreamsRef.current.clear();

            pendingCandidatesRef.current.clear();

            remoteVideoRefs.current.clear();

        };

    }, []);


    /*
     * =====================================================
     * UI
     * =====================================================
     */

    if (!enabled) {

        return null;

    }


    return (
        <>

            {/* =========================================
                SCREEN SHARE BUTTON
            ========================================= */}

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


            {/* =========================================
                REMOTE SCREEN(S)
            ========================================= */}

            {remoteSharing &&
                remoteParticipants.length >
                    0 && (

                    <div className="rtc-screen-share-viewer">

                        <div className="rtc-screen-share-viewer-header">

                            <span>
                                Screen sharing
                            </span>

                            <span className="rtc-screen-share-live">
                                LIVE
                            </span>

                        </div>


                        <div className="rtc-screen-share-videos">

                            {remoteParticipants.map(
                                (
                                    remoteUserId
                                ) => (

                                    <div
                                        key={
                                            remoteUserId
                                        }
                                        className="rtc-screen-share-video-wrapper"
                                    >

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


                                                    /*
                                                     * If stream already
                                                     * exists, attach it
                                                     * immediately.
                                                     */

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
                                                                        error
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


                                        <span className="rtc-screen-share-user">

                                            {remoteUserId}

                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                )}

        </>
    );
}


export default ScreenShare;