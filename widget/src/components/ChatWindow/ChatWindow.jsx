import MessageList from "../MessageList/MessageList";
import ChatInput from "../ChatInput/ChatInput";
import "./ChatWindow.css";

function ChatWindow({
  messages,
  message,
  setMessage,
  sendMessage,
  selectedConversation,
  currentUser,
  onBack
})
{
    if (!selectedConversation) {
        return (
          <div className="rtc-chat-widget rtc-empty-chat">
            <div className="rtc-empty-chat-content">
              <div className="rtc-empty-icon">💬</div>

              <h2>No Conversation Selected</h2>

              <p>
                Select a conversation from the left
                or start a new chat.
              </p>
            </div>
          </div>
        );
      }

    
  return (
    <div className="rtc-chat-widget">
      <div className="rtc-chat-header">
        <button
            className="rtc-back-button"
            onClick={onBack}
        >
            ←
        </button>
        <div className="rtc-chat-avatar">
          {selectedConversation.type === "group"
            ? "👥"
            : "👤"}
        </div>

        <div className="rtc-chat-details">

          <h2>
            {selectedConversation.displayName}
          </h2>

          <p>
            {selectedConversation.type === "group"
              ? "Group Conversation"
              : "Direct Conversation"}
          </p>

        </div>

      </div>

      <MessageList 
      messages={messages} 
      currentUser={currentUser}
      />

      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
      />
    </div>
  );
}

export default ChatWindow;