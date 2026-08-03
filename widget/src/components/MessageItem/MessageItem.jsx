import "./MessageItem.css";

function MessageItem({ message }) {
  return (
    <div className="message">
      <div className="sender">{message.senderId}</div>

      <div className="bubble">{message.content}</div>
    </div>
  );
}

export default MessageItem;