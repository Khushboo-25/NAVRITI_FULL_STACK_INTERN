import MessageList from "../MessageList/MessageList";
import ChatInput from "../ChatInput/ChatInput";
import "./ChatWindow.css";

function ChatWindow({
  messages,
  message,
  setMessage,
  sendMessage,
  selectedConversation,
}) {
  return (
    <div className="chat-widget">
      <div className="chat-header">
        
        <h2>
          Talking to: {selectedConversation
            ? selectedConversation.displayName
            : "Select a Conversation"}
        </h2>
      </div>

      <MessageList messages={messages} />

      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
      />
    </div>
  );
}

export default ChatWindow;