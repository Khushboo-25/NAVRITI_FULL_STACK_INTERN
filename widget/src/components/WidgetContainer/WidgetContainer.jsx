import { useEffect, useState } from "react";

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

function WidgetContainer({
  currentUser,
  users,
  serverUrl,
}) {
  const senderId = currentUser?.userId;
  const isMobile = window.innerWidth <= 768;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [conversationId, setConversationId] =
    useState(null);

  const [conversations, setConversations] =
    useState([]);

  const [selectedConversation, setSelectedConversation] =
    useState(null);

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
   * Initialize API + Socket
   * --------------------------------------------------
   */

  useEffect(() => {
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
    if (!senderId) return;

    const socket = getSocket();

    if (!socket) {
      console.error(
        "Socket is not initialized"
      );
      return;
    }

    const initializeWidget = async () => {
      try {
        const userConversations =
          await getUserConversations(senderId);

        setConversations(userConversations);

        if (
          userConversations.length > 0 &&
          !isMobile
        ) {
          setSelectedConversation(
            userConversations[0]
          );
        }
      } catch (error) {
        console.error(
          "Failed to load conversations:",
          error
        );
      }
    };

    initializeWidget();

    /*
     * ------------------------------------------------
     * New message
     * ------------------------------------------------
     */

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => [
        ...prev,
        newMessage,
      ]);
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
          msg._id === updatedMessage._id
            ? updatedMessage
            : msg
        )
      );
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
          msg._id === deletedMessage._id
            ? deletedMessage
            : msg
        )
      );
    };

    /*
     * ------------------------------------------------
     * Socket listeners
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
  }, [senderId]);

  /*
   * --------------------------------------------------
   * Load messages whenever conversation changes
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!selectedConversation) return;

    const loadConversation = async () => {
      try {
        const selectedConversationId =
          selectedConversation.conversationId;

        setConversationId(
          selectedConversationId
        );

        const previousMessages =
          await getMessages(
            selectedConversationId
          );

        setMessages(previousMessages);

        const socket = getSocket();

        if (socket) {
          socket.emit(
            "joinConversation",
            selectedConversationId
          );
        }
      } catch (error) {
        console.error(
          "Failed to load messages:",
          error
        );
      }
    };

    loadConversation();
  }, [selectedConversation]);

  /*
   * --------------------------------------------------
   * Send message
   * --------------------------------------------------
   */

  const sendMessage = () => {
    if (!message.trim()) return;
    if (!conversationId) return;

    const socket = getSocket();

    if (!socket) {
      console.error(
        "Socket is not initialized"
      );
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
    setSelectedConversation(conversation);

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

      const updatedConversations =
        await getUserConversations(
          senderId
        );

      setConversations(
        updatedConversations
      );

      const conversation =
        updatedConversations.find(
          (item) =>
            item.conversationId ===
            session.conversationId
        );

      if (conversation) {
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

      const updatedConversations =
        await getUserConversations(
          senderId
        );

      setConversations(
        updatedConversations
      );

      const conversation =
        updatedConversations.find(
          (item) =>
            item.conversationId ===
            newGroup.conversationId
        );

      if (conversation) {
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
    if (!content.trim()) return;

    const socket = getSocket();

    if (!socket) {
      console.error(
        "Socket is not initialized"
      );
      return;
    }

    socket.emit("editMessage", {
      messageId,
      senderId,
      content: content.trim(),
    });
  };

  /*
   * --------------------------------------------------
   * Delete message
   * --------------------------------------------------
   */

  const handleDeleteMessage = (
    messageId
  ) => {
    const socket = getSocket();

    if (!socket) {
      console.error(
        "Socket is not initialized"
      );
      return;
    }

    socket.emit("deleteMessage", {
      messageId,
      senderId,
    });
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

      {/* Conversation Sidebar */}

      <div
        className={`rtc-sidebar ${
          isMobile && showChat
            ? "rtc-hide-mobile"
            : ""
        }`}
      >
        <div className="rtc-sidebar-header">

          <div className="rtc-sidebar-title">
            <h3>
              Current User:{" "}
              {currentUser?.displayName}
            </h3>

            <span>
              {conversations.length}
            </span>
          </div>

          <div className="rtc-sidebar-buttons">

            <button
              onClick={() =>
                setIsChatModalOpen(true)
              }
            >
              💬 Chat
            </button>

            <button
              onClick={() =>
                setIsGroupModalOpen(true)
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
        />
      </div>

      {/* Chat Section */}

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
          selectedConversation={
            selectedConversation
          }
          currentUser={currentUser}
          users={users}
          onBack={() =>
            setShowChat(false)
          }
          onEditMessage={
            handleEditMessage
          }
          onDeleteMessage={
            handleDeleteMessage
          }
        />
      </div>

      {/* New Chat Modal */}

      <NewChatModal
        currentUser={senderId}
        users={users}
        isOpen={isChatModalOpen}
        onClose={() =>
          setIsChatModalOpen(false)
        }
        onStartChat={
          handleStartChat
        }
      />

      {/* New Group Modal */}

      <NewGroupModal
        currentUser={senderId}
        users={users}
        isOpen={isGroupModalOpen}
        onClose={() =>
          setIsGroupModalOpen(false)
        }
        onCreateGroup={
          handleStartGroupChat
        }
      />

    </div>
  );
}

export default WidgetContainer;