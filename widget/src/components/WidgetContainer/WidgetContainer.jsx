import { useEffect, useState } from "react";
import socket from "../../services/socket";
import ChatWindow from "../ChatWindow/ChatWindow";

const conversationId = "6891c2d4b8f7e0a12cd34567";
const senderId = "user-1";

function WidgetContainer() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("joinConversation", conversationId);

    socket.on("newMessage", (newMessage) => {
      console.log("Received message:", newMessage);
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      conversationId,
      senderId,
      content: message,
      messageType: "text",
    });

    setMessage("");
  };

  return (
    <ChatWindow
      messages={messages}
      message={message}
      setMessage={setMessage}
      sendMessage={sendMessage}
    />
  );
}

export default WidgetContainer;