import "./MessageItem.css";

function MessageItem({ message }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="message">
      <div className="sender">{message.senderId}</div>

      <div className="bubble">
        {message.content}

        <span className="message-time">
          {time}
        </span>
      </div>
    </div>
  );
}

export default MessageItem;