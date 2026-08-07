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


function WidgetContainer({ currentUser, users ,serverUrl}) {
  
useEffect(() => {
  initializeConfig(serverUrl);
  initializeApi();
  initializeSocket();

}, [serverUrl]);
  const senderId = currentUser?.userId;
  const isMobile = window.innerWidth <= 768;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [conversationId, setConversationId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const [searchText, setSearchText] = useState("");

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [showChat, setShowChat] = useState(false);
  
  // Load conversations
  useEffect(() => {
    const socket = initializeSocket(serverUrl);
    const initializeWidget = async () => {
      try {
        const userConversations = await getUserConversations(senderId);

        setConversations(userConversations);

        if (userConversations.length > 0 && !isMobile) {
          setSelectedConversation(userConversations[0]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    initializeWidget();

    socket.on("newMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [senderId]);

  // Load messages whenever conversation changes
  useEffect(() => {
    if (!selectedConversation) return;

    const loadConversation = async () => {
      try {
        setConversationId(selectedConversation.conversationId);

        const previousMessages = await getMessages(
          selectedConversation.conversationId
        );

        setMessages(previousMessages);
        const socket = getSocket();

        socket.emit(
          "joinConversation",
          selectedConversation.conversationId
        );
      } catch (error) {
        console.error(error);
      }
    };

    loadConversation();
  }, [selectedConversation]);

  const sendMessage = () => {
    if (!message.trim()) return;
    if (!conversationId) return;
    const socket = getSocket();

    socket.emit("sendMessage", {
      conversationId,
      senderId,
      content: message,
      messageType: "text",
    });

    setMessage("");
  };

  const handleConversationSelect = (conversation) => {
    console.log("clicked");
    console.log(conversation);
    console.log("showChat before:", showChat);

    setSelectedConversation(conversation);

    if (isMobile) {
        setShowChat(true);
    }
  };

  const handleStartChat = async (targetUserId) => {
    try {
      const session = await createOrGetDirect(senderId, targetUserId);

      const updatedConversations =
        await getUserConversations(senderId);

      setConversations(updatedConversations);

      const conversation = updatedConversations.find(
        (item) =>
          item.conversationId === session.conversationId
      );

      if (conversation) {
        setSelectedConversation(conversation);

        if (isMobile) {
          setShowChat(true);
        }
      }

      setIsChatModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartGroupChat = async (
    groupName,
    participants
  ) => {
    try {
      const newGroup = await createGroup(
        groupName,
        senderId,
        participants
      );

      const updatedConversations =
        await getUserConversations(senderId);

      setConversations(updatedConversations);

      const conversation = updatedConversations.find(
        (item) =>
          item.conversationId === newGroup.conversationId
      );

      if (conversation) {
        setSelectedConversation(conversation);

        if (isMobile) {
          setShowChat(true);
        }
      }

      setIsGroupModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.displayName
        .toLowerCase()
        .includes(searchText.toLowerCase())
  );

  return (
    <div className="rtc-widget-container">

      <div
        className={`rtc-sidebar ${
          isMobile && showChat ? "rtc-hide-mobile" : ""
        }`}
      >
        <div className="rtc-sidebar-header">

          <div className="rtc-sidebar-title">
            <h3>
              Current User: {currentUser?.displayName}
            </h3>

            <span>{conversations.length}</span>
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
              setSearchText(e.target.value)
            }
          />

        </div>

        <ConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          setSelectedConversation={
            handleConversationSelect
          }
        />
      </div>

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
          onBack={() => setShowChat(false)}
        />
      </div>

      <NewChatModal
        currentUser={senderId}
        users={users}
        isOpen={isChatModalOpen}
        onClose={() =>
          setIsChatModalOpen(false)
        }
        onStartChat={handleStartChat}
      />

      <NewGroupModal
        currentUser={senderId}
        users={users}
        isOpen={isGroupModalOpen}
        onClose={() =>
          setIsGroupModalOpen(false)
        }
        onCreateGroup={handleStartGroupChat}
      />
    </div>
  );
}

export default WidgetContainer;