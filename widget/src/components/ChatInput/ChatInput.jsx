import { useState } from "react";
import "./ChatInput.css";

function ChatInput({
    message,
    setMessage,
    sendMessage,
    users = [],
    currentUser,
}) {
    const [showMentions, setShowMentions] =
        useState(false);

    const [mentionText, setMentionText] =
        useState("");


    /*
     * --------------------------------------------
     * Handle typing
     * --------------------------------------------
     */

    const handleChange = (e) => {
        const value = e.target.value;

        setMessage(value);

        const currentWord =
            value.split(/\s/).pop() || "";

        if (currentWord.startsWith("@")) {
            const searchText =
                currentWord
                    .slice(1)
                    .toLowerCase();

            setMentionText(searchText);
            setShowMentions(true);
        } else {
            setMentionText("");
            setShowMentions(false);
        }
    };


    /*
     * --------------------------------------------
     * Filter users for mention
     * --------------------------------------------
     */

    const filteredUsers = users
        .filter(
            (user) =>
                user.userId !==
                currentUser?.userId
        )
        .filter((user) =>
            user.displayName
                ?.toLowerCase()
                .includes(mentionText)
        );


    /*
     * --------------------------------------------
     * Select mention
     * --------------------------------------------
     */

    const handleMentionSelect = (user) => {
        const words = message.split(/\s/);

        words[words.length - 1] =
            `@${user.displayName}`;

        setMessage(
            words.join(" ") + " "
        );

        setShowMentions(false);
        setMentionText("");
    };


    /*
     * --------------------------------------------
     * Send message
     * --------------------------------------------
     */

    const handleSend = () => {
        if (!message.trim()) {
            return;
        }

        sendMessage();

        setShowMentions(false);
        setMentionText("");
    };


    /*
     * --------------------------------------------
     * Keyboard handling
     * --------------------------------------------
     */

    const handleKeyDown = (e) => {

        if (e.key === "Enter") {
            e.preventDefault();

            handleSend();

            return;
        }

        if (e.key === "Escape") {
            setShowMentions(false);
            setMentionText("");
        }
    };


    return (
        <div className="rtc-chat-input-container">

            {/* Mention suggestions */}

            {showMentions &&
                filteredUsers.length > 0 && (
                    <div className="rtc-mention-list">

                        {filteredUsers.map((user) => (
                            <button
                                key={user.userId}
                                type="button"
                                className="rtc-mention-item"
                                onClick={() =>
                                    handleMentionSelect(
                                        user
                                    )
                                }
                            >
                                @{user.displayName}
                            </button>
                        ))}

                    </div>
                )}


            {/* Input */}

            <input
                className="rtc-chat-input"
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />


            {/* Send */}

            <button
                type="button"
                className="rtc-send-button"
                onClick={handleSend}
                disabled={!message.trim()}
                aria-label="Send message"
            >
                ➤
            </button>

        </div>
    );
}

export default ChatInput;