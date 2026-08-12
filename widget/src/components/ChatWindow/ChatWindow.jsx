import MessageList from "../MessageList/MessageList";
import ChatInput from "../ChatInput/ChatInput";
import "./ChatWindow.css";

function ChatWindow({
    messages,
    message,
    setMessage,
    sendMessage,
    selectedConversation,
    currentUser,
    users,
    onBack,
    onEditMessage,
    onDeleteMessage,
}) {
    if (!selectedConversation) {
        return (
            <div className="rtc-chat-widget rtc-empty-chat">
                <div className="rtc-empty-chat-content">
                    <div className="rtc-empty-icon">
                        💬
                    </div>

                    <h2>No Conversation Selected</h2>

                    <p>
                        Select a conversation from the
                        left or start a new chat.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rtc-chat-widget">

            {/* Chat Header */}

            <div className="rtc-chat-header">

                <button
                    type="button"
                    className="rtc-chat-back-button"
                    onClick={onBack}
                    aria-label="Close conversation"
                >
                    <span className="rtc-back-mobile">
                        ←
                    </span>

                    <span className="rtc-back-desktop">
                        ✕
                    </span>
                </button>


                <div className="rtc-chat-avatar">
                    {selectedConversation.type === "group"
                        ? "👥"
                        : "👤"}
                </div>


                <div className="rtc-chat-details">

                    <h2>
                        {selectedConversation.displayName}
                    </h2>

                    <p>
                        {selectedConversation.type === "group"
                            ? "Group Conversation"
                            : "Direct Conversation"}
                    </p>

                </div>

            </div>


            {/* Messages */}

            <MessageList
                messages={messages}
                currentUser={currentUser}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
            />


            {/* Input */}

            <ChatInput
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                users={users}
                currentUser={currentUser}
                selectedConversation={selectedConversation}
            />

        </div>
    );
}

export default ChatWindow;