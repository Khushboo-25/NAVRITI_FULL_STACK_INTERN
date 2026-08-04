import "./ConversationItem.css";

function ConversationItem({
  conversation,
  selected,
  onClick,
}) {
  return (
    <div
      className={`conversation-item ${
        selected ? "active" : ""
      }`}
      onClick={onClick}
    >
      <div className="conversation-name">
        {conversation.displayName}
      </div>

      <div className="conversation-type">
        {conversation.type}
      </div>
    </div>
  );
}

export default ConversationItem;