import ConversationItem from "../ConversationItem/ConversationItem";
import "./ConversationList.css";

function ConversationList({
  conversations,
  selectedConversation,
  setSelectedConversation,
  mentionedConversations,
}) {
  return (
    <div className="rtc-conversation-list">

      {conversations.map((conversation) => {
        const isMentioned =
          mentionedConversations?.has(
            conversation.conversationId.toString()
          );

        return (
          <div
            key={conversation.conversationId}
            className="rtc-conversation-wrapper"
          >
            <ConversationItem
              conversation={conversation}
              selected={
                selectedConversation?.conversationId ===
                conversation.conversationId
              }
              onClick={() =>
                setSelectedConversation(
                  conversation
                )
              }
            />

            {isMentioned && (
              <span className="rtc-mention-badge">
                @
              </span>
            )}
          </div>
        );
      })}

    </div>
  );
}

export default ConversationList;