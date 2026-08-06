import "./ChatInput.css";

function ChatInput({
  message,
  setMessage,
  sendMessage,
}) {
  return (
    <div className="rtc-chat-input-container">
      <input
        className="rtc-chat-input"
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage();
          }
        }}
      />



      <button
        className="rtc-send-button"
        onClick={sendMessage}
      >
        ➤
      </button>
    </div>
  );
}

export default ChatInput;