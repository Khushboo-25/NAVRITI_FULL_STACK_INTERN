import MessageItem from "../MessageItem/MessageItem";
import "./MessageList.css";
function MessageList({ messages }) {
  


  return (
    <div className="message-list">

      {messages.map((msg) => (
        <MessageItem
          key={msg._id}
          message={msg}
        />
      ))}
    </div>
  );
}

export default MessageList;