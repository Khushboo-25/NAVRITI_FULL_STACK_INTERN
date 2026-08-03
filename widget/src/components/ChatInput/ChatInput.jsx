import "./ChatInput.css";

function ChatInput({
  message,
  setMessage,
  sendMessage,
}) {
  return (
    <div className="chat-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default ChatInput;