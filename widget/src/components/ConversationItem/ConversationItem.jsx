import "./ConversationItem.css";

function ConversationItem({
    conversation,
    selected,
    onClick,
}) {
    const avatar =
        conversation.type === "group"
            ? "👥"
            : conversation.displayName
                ?.charAt(0)
                .toUpperCase() || "?";

    const formattedTime =
        conversation.lastMessageTime
            ? new Date(
                  conversation.lastMessageTime
              ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : "";

    return (
        <div
            className={`rtc-conversation-item ${
                selected ? "selected" : ""
            }`}
            onClick={onClick}
        >
            <div className="rtc-conversation-avatar">
                {avatar}
            </div>

            <div className="rtc-conversation-content">
                <div className="rtc-conversation-top">

                    <div className="rtc-conversation-name">
                        {conversation.displayName ||
                            "Unknown"}
                    </div>

                    <div className="rtc-conversation-time">
                        {formattedTime}
                    </div>

                </div>

                <div className="rtc-conversation-preview">
                    {conversation.lastMessage ||
                        "No messages yet"}
                </div>
            </div>
        </div>
    );
}

export default ConversationItem;