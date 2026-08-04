import { useEffect, useState } from "react";
import socket from "../../services/socket";

import ChatWindow from "../ChatWindow/ChatWindow";
import ConversationList from "../ConversationList/ConversationList";
import NewChatModal from "../NewChatModal/NewChatModal";

import { getMessages } from "../../services/messageService";
import {
  createOrGetSession,
  getUserConversations,
  
} from "../../services/conversationService";

// Temporary (Later these will come from Host Application)
const users = [
  {
    userId: "user-1",
    displayName: "User 1",
  },
  {
    userId: "user-3",
    displayName: "User 3",
  },
  {
    userId: "user-4",
    displayName: "User 4",
  },
  {
    userId: "user-12",
    displayName: "User 12",
  },
  {
    userId: "user-13",
    displayName: "User 13",
  },
  {
    userId: "user-14",
    displayName: "User 14",
  },
  {
    userId: "user-15",
    displayName: "User 15",
  },
];

const senderId = "user-15";

function WidgetContainer() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [conversationId, setConversationId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load conversations when widget starts
  useEffect(() => {
    const initializeWidget = async () => {
      try {
        const userConversations =
          await getUserConversations(senderId);

        setConversations(userConversations);

        if (userConversations.length > 0) {
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
  }, []);

  // Load messages whenever conversation changes
  useEffect(() => {
    if (!selectedConversation) return;

    const loadConversation = async () => {
      try {
        setConversationId(
          selectedConversation.conversationId
        );

        const previousMessages = await getMessages(
          selectedConversation.conversationId
        );

        setMessages(previousMessages);

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

    socket.emit("sendMessage", {
      conversationId,
      senderId,
      content: message,
      messageType: "text",
    });

    setMessage("");
  };

  // Start a new chat
  const handleStartChat = async (targetUserId) => {
    try {
      const session = await createOrGetSession(
        senderId,
        targetUserId
      );

      const updatedConversations =
        await getUserConversations(senderId);

      setConversations(updatedConversations);

      const conversation =
        updatedConversations.find(
          (item) =>
            item.conversationId ===
            session.conversationId
        );

      if (conversation) {
        setSelectedConversation(conversation);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "600px",
        border: "1px solid #ddd",
      }}
    >
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <h3>Chats</h3>

          <button
            onClick={() => setIsModalOpen(true)}
          >
            +
          </button>
        </div>

        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          setSelectedConversation={
            setSelectedConversation
          }
        />
      </div>

      <div style={{ flex: 1 }}>
        <ChatWindow
          messages={messages}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          selectedConversation={
            selectedConversation
          }
        />
      </div>

      <NewChatModal
        currentUser={senderId}
        users={users}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartChat={handleStartChat}
      />
    </div>
  );
}

export default WidgetContainer;