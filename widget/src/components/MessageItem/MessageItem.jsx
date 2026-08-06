import "./MessageItem.css";

function MessageItem({ message,currentUser }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Temporary until host passes currentUser
  const isMine = message.senderId === currentUser?.userId; // Replace with actual current user ID from host application

  return (
    <div className={`rtc-message ${isMine ? "rtc-mine" : "rtc-other"}`}>
      {!isMine && (
        <div className="rtc-sender">
          {message.senderId}
        </div>
      )}

      <div className="rtc-bubble">
        <div>{message.content}</div>

        <span className="rtc-message-time">
          {time}
        </span>
      </div>
    </div>
  );
}

export default MessageItem;