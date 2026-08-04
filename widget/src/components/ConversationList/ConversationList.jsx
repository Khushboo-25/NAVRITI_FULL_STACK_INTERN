import ConversationItem from "../ConversationItem/ConversationItem";
import "./ConversationList.css";

function ConversationList({
  conversations,
  selectedConversation,
  setSelectedConversation,
}) {
  return (
    <div className="conversation-list">

      {conversations.map((conversation) => (

        <ConversationItem
          key={conversation.conversationId}
          conversation={conversation}
          selected={
            selectedConversation?.conversationId ===
            conversation.conversationId
          }
          onClick={() =>
            setSelectedConversation(conversation)
          }
        />

      ))}

    </div>
  );
}

export default ConversationList;