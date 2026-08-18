import { useEffect, useState, useRef } from "react";

import {
    initializeSocket,
    getSocket,
} from "../../services/socket";

import ChatWindow from "../ChatWindow/ChatWindow";
import ConversationList from "../ConversationList/ConversationList";
import NewChatModal from "../NewChatModal/NewChatModal";
import NewGroupModal from "../NewGroupModal/NewGroupModal";

import { getMessages } from "../../services/messageService";

import {
    createOrGetDirect,
    getUserConversations,
    createGroup,
} from "../../services/conversationService";

import "./WidgetContainer.css";

import { initializeConfig } from "../../services/config";
import { initializeApi } from "../../services/api";

const getLastMessagePreview = (message) => {
    if (!message) {
        return "";
    }

    if (message.isDeleted) {
        return "Message deleted";
    }

    if (message.messageType === "file") {
        return `📎 ${
            message.attachment?.fileName || "File"
        }`;
    }

    return message.content || "";
};

function WidgetContainer({
    currentUser,
    users,
    serverUrl,
}) {
    const senderId = currentUser?.userId;

    const isMobile =
        window.innerWidth <= 768;


    /*
     * --------------------------------------------------
     * State
     * --------------------------------------------------
     */

    const [message, setMessage] =
        useState("");

    const [messages, setMessages] =
        useState([]);

    const [conversationId, setConversationId] =
        useState(null);

    const [conversations, setConversations] =
        useState([]);

    const [
        selectedConversation,
        setSelectedConversation,
    ] = useState(null);

    const [
        mentionedConversations,
        setMentionedConversations,
    ] = useState(new Set());

    const [searchText, setSearchText] =
        useState("");

    const [isChatModalOpen, setIsChatModalOpen] =
        useState(false);

    const [isGroupModalOpen, setIsGroupModalOpen] =
        useState(false);

    const [showChat, setShowChat] =
        useState(false);


    /*
     * --------------------------------------------------
     * Refs
     * --------------------------------------------------
     */

    const selectedConversationRef =
        useRef(null);

    /*
     * Used to ignore stale getMessages()
     * responses when user switches conversations
     * quickly.
     */

    const loadRequestRef = useRef(0);


    /*
     * --------------------------------------------------
     * Initialize API + Socket
     * --------------------------------------------------
     */

    useEffect(() => {
        if (!serverUrl) {
            console.error(
                "CommunicationWidget: serverUrl is required"
            );

            return;
        }

        initializeConfig(serverUrl);
        initializeApi();
        initializeSocket();

    }, [serverUrl]);


    /*
     * --------------------------------------------------
     * Load conversations + Socket listeners
     * --------------------------------------------------
     */

    useEffect(() => {
        if (!senderId) {
            return;
        }

        const socket = getSocket();

        if (!socket) {
            console.error(
                "Socket is not initialized"
            );

            return;
        }


        /*
         * ------------------------------------------------
         * Load user's conversations
         * ------------------------------------------------
         */

        const initializeWidget = async () => {
            try {
                const userConversations =
                    await getUserConversations(
                        senderId
                    );

                setConversations(
                    userConversations
                );
                const mentionedIds =
                    userConversations
                        .filter(
                            (conversation) =>
                                conversation.hasMention
                        )
                        .map(
                            (conversation) =>
                                conversation.conversationId.toString()
                        );

                setMentionedConversations(
                    new Set(mentionedIds)
                );


                /*
                 * Desktop:
                 * automatically select first conversation.
                 */

                if (
                    userConversations.length > 0 &&
                    !isMobile
                ) {
                    const firstConversation =
                        userConversations[0];

                    const firstConversationId =
                        firstConversation.conversationId.toString();

                    selectedConversationRef.current =
                        firstConversationId;

                    setSelectedConversation(
                        firstConversation
                    );
                }

            } catch (error) {
                console.error(
                    "Failed to load conversations:",
                    error
                );
            }
        };




        /*
         * ------------------------------------------------
         * New message
         * ------------------------------------------------
         */

        const handleNewMessage = (
            newMessage
        ) => {
            const newConversationId =
                newMessage.conversationId?.toString();


            if (!newConversationId) {
                return;
            }


            /*
             * -----------------------------------------
             * 1. Update conversation list
             * -----------------------------------------
             */

            setConversations((prev) => {

                const existingConversation =
                    prev.find(
                        (conversation) =>
                            conversation.conversationId?.toString() ===
                            newConversationId
                    );


                /*
                 * Conversation isn't currently
                 * present in sidebar.
                 *
                 * Refresh from backend.
                 */

                if (!existingConversation) {

                    getUserConversations(
                        senderId
                    )
                        .then(
                            (
                                updatedConversations
                            ) => {
                                setConversations(
                                    updatedConversations
                                );
                            }
                        )
                        .catch((error) => {
                            console.error(
                                "Failed to refresh conversations:",
                                error
                            );
                        });

                    return prev;
                }


                /*
                 * Update latest message
                 */

                const updatedConversation = {
                    ...existingConversation,

                    lastMessage:
                        getLastMessagePreview(
                            newMessage
                        ),

                    lastMessageTime:
                        newMessage.createdAt,
                };


                /*
                 * Move conversation to top
                 */

                return [
                    updatedConversation,

                    ...prev.filter(
                        (conversation) =>
                            conversation.conversationId?.toString() !==
                            newConversationId
                    ),
                ];
            });


            /*
             * -----------------------------------------
             * 2. Mention notification
             *
             * IMPORTANT:
             * This must happen BEFORE the
             * current-conversation return.
             * -----------------------------------------
             */

            const currentUserName =
                currentUser?.displayName?.trim();


            if (
                currentUserName &&
                newMessage.content
            ) {

                /*
                 * Escape special regex characters
                 */

                const escapedName =
                    currentUserName.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    );


                const mentionRegex =
                    new RegExp(
                        `@${escapedName}(?=\\s|$|[.,!?])`,
                        "i"
                    );


                const wasMentioned =
                    mentionRegex.test(
                        newMessage.content
                    );


                console.log(
                    "Mention check:",
                    {
                        message:
                            newMessage.content,

                        currentUser:
                            currentUserName,

                        wasMentioned,

                        conversationId:
                            newConversationId,
                    }
                );


                if (wasMentioned) {

                    setMentionedConversations(
                        (prev) => {

                            const updated =
                                new Set(prev);

                            updated.add(
                                newConversationId
                            );

                            return updated;
                        }
                    );
                }
            }


            /*
             * -----------------------------------------
             * 3. Update currently opened chat
             * -----------------------------------------
             */

            const currentConversationId =
                selectedConversationRef.current?.toString();


            /*
             * If message belongs to another
             * conversation, don't add it to
             * current messages.
             */

            if (
                currentConversationId !==
                newConversationId
            ) {
                return;
            }


            /*
             * -----------------------------------------
             * 4. Prevent duplicate messages
             * -----------------------------------------
             */

            setMessages((prev) => {

                const exists =
                    prev.some(
                        (msg) =>
                            msg._id ===
                            newMessage._id
                    );


                if (exists) {
                    return prev;
                }


                return [
                    ...prev,
                    newMessage,
                ];
            });
        };


        /*
         * ------------------------------------------------
         * Edited message
         * ------------------------------------------------
         */

        const handleMessageUpdated = (
            updatedMessage
        ) => {

            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id ===
                    updatedMessage._id
                        ? updatedMessage
                        : msg
                )
            );


            /*
             * If edited message is the latest
             * message, update sidebar preview.
             */

            setConversations((prev) =>
                prev.map(
                    (conversation) => {

                        if (
                            conversation.conversationId?.toString() !==
                            updatedMessage.conversationId?.toString()
                        ) {
                            return conversation;
                        }


                        return {
                            ...conversation,

                            lastMessage:
                                updatedMessage.isDeleted
                                    ? "Message deleted"
                                    : updatedMessage.content,

                            lastMessageTime:
                                updatedMessage.createdAt,
                        };
                    }
                )
            );

          // -----------------------------------------
          // Mention check for EDITED message
          // -----------------------------------------

          const currentUserName =
              currentUser?.displayName?.trim();

          if (
              currentUserName &&
              updatedMessage.content
          ) {
              const escapedName =
                  currentUserName.replace(
                      /[.*+?^${}()|[\]\\]/g,
                      "\\$&"
                  );

              const mentionRegex = new RegExp(
                  `@${escapedName}(?=\\s|$|[.,!?])`,
                  "i"
              );

              const wasMentioned =
                  mentionRegex.test(
                      updatedMessage.content
                  );

              if (wasMentioned) {
                  const editedConversationId =
                      updatedMessage.conversationId
                          ?.toString();

                  setMentionedConversations((prev) => {
                      const updated = new Set(prev);

                      updated.add(
                          editedConversationId
                      );

                      return updated;
                  });
              }
          }
        };


        /*
         * ------------------------------------------------
         * Deleted message
         * ------------------------------------------------
         */

        const handleMessageDeleted = (
            deletedMessage
        ) => {

            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id ===
                    deletedMessage._id
                        ? deletedMessage
                        : msg
                )
            );


            /*
             * Update sidebar preview if
             * deleted message belongs to
             * the conversation.
             */

            setConversations((prev) =>
                prev.map(
                    (conversation) => {

                        if (
                            conversation.conversationId?.toString() !==
                            deletedMessage.conversationId?.toString()
                        ) {
                            return conversation;
                        }


                        return {
                            ...conversation,

                            lastMessage:
                                "Message deleted",

                            lastMessageTime:
                                deletedMessage.updatedAt ||
                                deletedMessage.createdAt,
                        };
                    }
                )
            );
        };


        /*
         * ------------------------------------------------
         * Register Socket listeners
         * ------------------------------------------------
         */

        socket.on(
            "newMessage",
            handleNewMessage
        );

        socket.on(
            "messageUpdated",
            handleMessageUpdated
        );

        socket.on(
            "messageDeleted",
            handleMessageDeleted
        );
        
        initializeWidget();


        /*
         * ------------------------------------------------
         * Cleanup
         * ------------------------------------------------
         */

        return () => {

            socket.off(
                "newMessage",
                handleNewMessage
            );

            socket.off(
                "messageUpdated",
                handleMessageUpdated
            );

            socket.off(
                "messageDeleted",
                handleMessageDeleted
            );
        };

    }, [
        senderId,
        isMobile,
        currentUser?.displayName,
    ]);


    /*
     * --------------------------------------------------
     * Load messages whenever conversation changes
     * --------------------------------------------------
     */

    useEffect(() => {

        if (!selectedConversation) {
            return;
        }


        const selectedConversationId =
            selectedConversation.conversationId.toString();


        /*
         * Create unique request ID
         */

        const requestId =
            ++loadRequestRef.current;


        const loadConversation =
            async () => {

                try {

                    const socket =
                        getSocket();


                    /*
                     * ---------------------------------
                     * Leave previous conversation
                     * ---------------------------------
                     */

                    const previousConversationId =
                        selectedConversationRef.current;


                    if (
                        socket &&
                        previousConversationId &&
                        previousConversationId !==
                            selectedConversationId
                    ) {

                        socket.emit(
                            "leaveConversation",
                            previousConversationId
                        );
                    }


                    /*
                     * ---------------------------------
                     * Update selected conversation ref
                     * immediately
                     * ---------------------------------
                     */

                    selectedConversationRef.current =
                        selectedConversationId;


                    /*
                     * ---------------------------------
                     * Join new conversation BEFORE
                     * fetching messages
                     * ---------------------------------
                     */

                    if (socket) {

                        socket.emit(
                            "joinConversation",
                            selectedConversationId
                        );
                    }


                    /*
                     * ---------------------------------
                     * Set conversation ID
                     * ---------------------------------
                     */

                    setConversationId(
                        selectedConversationId
                    );


                    /*
                     * Clear current messages
                     * while loading
                     * ---------------------------------
                     */

                    setMessages([]);


                    /*
                     * ---------------------------------
                     * Fetch message history
                     * ---------------------------------
                     */

                    const previousMessages =
                        await getMessages(
                            selectedConversationId
                        );


                    /*
                     * ---------------------------------
                     * Ignore stale request
                     * ---------------------------------
                     */

                    if (
                        requestId !==
                        loadRequestRef.current
                    ) {
                        return;
                    }


                    /*
                     * ---------------------------------
                     * Merge REST history with
                     * messages received from Socket
                     * while loading
                     * ---------------------------------
                     */

                    setMessages(
                        (currentMessages) => {

                            const merged = [
                                ...previousMessages,
                                ...currentMessages,
                            ];


                            /*
                             * Remove duplicates
                             */

                            const unique =
                                Array.from(
                                    new Map(
                                        merged.map(
                                            (msg) => [
                                                msg._id,
                                                msg,
                                            ]
                                        )
                                    ).values()
                                );


                            /*
                             * Sort oldest → newest
                             */

                            unique.sort(
                                (a, b) =>
                                    new Date(
                                        a.createdAt
                                    ) -
                                    new Date(
                                        b.createdAt
                                    )
                            );


                            return unique;
                        }
                    );

                } catch (error) {

                    console.error(
                        "Failed to load messages:",
                        error
                    );
                }
            };


        loadConversation();


        /*
         * Invalidate request if conversation
         * changes before it completes.
         */

        return () => {
            loadRequestRef.current++;
        };

    }, [selectedConversation]);


    /*
     * --------------------------------------------------
     * Send message
     * --------------------------------------------------
     */

    const sendMessage = (fileData = null) => {

        if (!conversationId) {
            return;
        }

        const socket = getSocket();

        if (!socket) {
            console.error("Socket is not initialized");
            return;
        }

        // File message
        if (fileData) {
            socket.emit("sendMessage", {
                conversationId,
                senderId,
                content: "",
                messageType: fileData.messageType,
                attachment: fileData.attachment,
            });

            return;
        }

        // Text message
        if (!message.trim()) {
            return;
        }

        socket.emit("sendMessage", {
            conversationId,
            senderId,
            content: message.trim(),
            messageType: "text",
        });

        setMessage("");
    };

    /*
     * --------------------------------------------------
     * Select conversation
     * --------------------------------------------------
     */

    const handleConversationSelect = (
        conversation
    ) => {

        const selectedId =
            conversation.conversationId.toString();


        /*
         * Update ref immediately
         */

        selectedConversationRef.current =
            selectedId;


        /*
         * Select conversation
         */

        setSelectedConversation(
            conversation
        );


        /*
         * Remove mention badge
         * once conversation is opened.
         */

        setMentionedConversations(
            (prev) => {

                const updated =
                    new Set(prev);

                updated.delete(
                    selectedId
                );

                return updated;
            }
        );


        /*
         * Mobile
         */

        if (isMobile) {
            setShowChat(true);
        }
    };


    /*
     * --------------------------------------------------
     * Start one-to-one chat
     * --------------------------------------------------
     */

    const handleStartChat = async (
        targetUserId
    ) => {

        try {

            const session =
                await createOrGetDirect(
                    senderId,
                    targetUserId
                );


            /*
             * Refresh conversations
             */

            const updatedConversations =
                await getUserConversations(
                    senderId
                );


            setConversations(
                updatedConversations
            );


            /*
             * Find newly selected conversation
             */

            const conversation =
                updatedConversations.find(
                    (item) =>
                        item.conversationId ===
                        session.conversationId
                );


            if (conversation) {

                selectedConversationRef.current =
                    conversation.conversationId.toString();


                setSelectedConversation(
                    conversation
                );


                if (isMobile) {
                    setShowChat(true);
                }
            }


            setIsChatModalOpen(false);

        } catch (error) {

            console.error(
                "Failed to start chat:",
                error
            );

            throw error;
        }
    };


    /*
     * --------------------------------------------------
     * Create group
     * --------------------------------------------------
     */

    const handleStartGroupChat = async (
        groupName,
        participants
    ) => {

        try {

            const newGroup =
                await createGroup(
                    groupName,
                    senderId,
                    participants
                );


            /*
             * Refresh conversations
             */

            const updatedConversations =
                await getUserConversations(
                    senderId
                );


            setConversations(
                updatedConversations
            );


            /*
             * Find new group
             */

            const conversation =
                updatedConversations.find(
                    (item) =>
                        item.conversationId ===
                        newGroup.conversationId
                );


            if (conversation) {

                selectedConversationRef.current =
                    conversation.conversationId.toString();


                setSelectedConversation(
                    conversation
                );


                if (isMobile) {
                    setShowChat(true);
                }
            }


            setIsGroupModalOpen(false);

        } catch (error) {

            console.error(
                "Failed to create group:",
                error
            );

            throw error;
        }
    };


    /*
     * --------------------------------------------------
     * Edit message
     * --------------------------------------------------
     */

    const handleEditMessage = (
        messageId,
        content
    ) => {

        if (!content.trim()) {
            return;
        }


        const socket =
            getSocket();


        if (!socket) {

            console.error(
                "Socket is not initialized"
            );

            return;
        }


        socket.emit(
            "editMessage",
            {
                messageId,
                senderId,
                content:
                    content.trim(),
            }
        );
    };


    /*
     * --------------------------------------------------
     * Delete message
     * --------------------------------------------------
     */

    const handleDeleteMessage = (
        messageId
    ) => {

        const socket =
            getSocket();


        if (!socket) {

            console.error(
                "Socket is not initialized"
            );

            return;
        }


        socket.emit(
            "deleteMessage",
            {
                messageId,
                senderId,
            }
        );
    };


    /*
     * --------------------------------------------------
     * Search conversations
     * --------------------------------------------------
     */

    const filteredConversations =
        conversations.filter(
            (conversation) =>
                conversation.displayName
                    ?.toLowerCase()
                    .includes(
                        searchText.toLowerCase()
                    )
        );


    /*
     * --------------------------------------------------
     * UI
     * --------------------------------------------------
     */

    return (
        <div className="rtc-widget-container">

            {/* ================================
                Conversation Sidebar
            ================================= */}

            <div
                className={`rtc-sidebar ${
                    isMobile &&
                    showChat
                        ? "rtc-hide-mobile"
                        : ""
                }`}
            >

                <div className="rtc-sidebar-header">

                    <div className="rtc-sidebar-title">

                        <h3>
                            Current User:{" "}
                            {
                                currentUser?.displayName
                            }
                        </h3>

                        <span>
                            {
                                conversations.length
                            }
                        </span>

                    </div>


                    <div className="rtc-sidebar-buttons">

                        <button
                            type="button"
                            onClick={() =>
                                setIsChatModalOpen(
                                    true
                                )
                            }
                        >
                            💬 Chat
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                setIsGroupModalOpen(
                                    true
                                )
                            }
                        >
                            👥 Group
                        </button>

                    </div>


                    <input
                        className="rtc-conversation-search"
                        type="text"
                        placeholder="🔍 Search conversations..."
                        value={searchText}
                        onChange={(e) =>
                            setSearchText(
                                e.target.value
                            )
                        }
                    />

                </div>


                <ConversationList
                    conversations={
                        filteredConversations
                    }
                    selectedConversation={
                        selectedConversation
                    }
                    setSelectedConversation={
                        handleConversationSelect
                    }
                    mentionedConversations={
                        mentionedConversations
                    }
                />

            </div>


            {/* ================================
                Chat Section
            ================================= */}

            <div
                className={`rtc-chat-section ${
                    isMobile
                        ? showChat
                            ? "rtc-show-mobile"
                            : ""
                        : ""
                }`}
            >

                <ChatWindow
                    messages={messages}
                    message={message}
                    setMessage={setMessage}
                    sendMessage={sendMessage}
                    serverUrl={serverUrl}
                    selectedConversation={
                        selectedConversation
                    }
                    currentUser={
                        currentUser
                    }
                    users={users}
                    onBack={() => {

                        setShowChat(false);

                        setSelectedConversation(
                            null
                        );

                        setConversationId(
                            null
                        );

                        setMessages([]);

                        selectedConversationRef.current =
                            null;
                    }}
                    onEditMessage={
                        handleEditMessage
                    }
                    onDeleteMessage={
                        handleDeleteMessage
                    }
                />

            </div>


            {/* ================================
                New Chat Modal
            ================================= */}

            <NewChatModal
                currentUser={
                    senderId
                }
                users={users}
                isOpen={
                    isChatModalOpen
                }
                onClose={() =>
                    setIsChatModalOpen(
                        false
                    )
                }
                onStartChat={
                    handleStartChat
                }
            />


            {/* ================================
                New Group Modal
            ================================= */}

            <NewGroupModal
                currentUser={
                    senderId
                }
                users={users}
                isOpen={
                    isGroupModalOpen
                }
                onClose={() =>
                    setIsGroupModalOpen(
                        false
                    )
                }
                onCreateGroup={
                    handleStartGroupChat
                }
            />

        </div>
    );
}


export default WidgetContainer;