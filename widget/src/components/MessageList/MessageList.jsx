import {useEffect,useRef} from "react";

import MessageItem from "../MessageItem/MessageItem";
import "./MessageList.css";
function MessageList({ 
  messages, 
  currentUser,
  onEditMessage,
  onDeleteMessage,
 }) {
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (

    <div className="rtc-message-list">

      {messages.map((msg) => (
        <MessageItem
          key={msg._id}
          message={msg}
          currentUser={currentUser}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;