import { useState } from "react";
import "./ChatInput.css";

function ChatInput({
  message,
  setMessage,
  sendMessage,
  users = [],
}) {
  const [showMentions, setShowMentions] =
    useState(false);

  const [mentionText, setMentionText] =
    useState("");

  const handleChange = (e) => {
    const value = e.target.value;

    setMessage(value);

    const currentWord =
      value.split(/\s/).pop() || "";

    if (currentWord.startsWith("@")) {
      const searchText =
        currentWord.slice(1).toLowerCase();

      setMentionText(searchText);
      setShowMentions(true);
    } else {
      setMentionText("");
      setShowMentions(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.displayName
      ?.toLowerCase()
      .includes(mentionText)
  );

  const handleMentionSelect = (user) => {
    const words = message.split(/\s/);

    words[words.length - 1] =
      `@${user.displayName}`;

    const newMessage =
      words.join(" ") + " ";

    setMessage(newMessage);
    setShowMentions(false);
    setMentionText("");
  };

  return (
    <div className="rtc-chat-input-container">

      {showMentions &&
        filteredUsers.length > 0 && (
          <div className="rtc-mention-list">
            {filteredUsers.map((user) => (
              <button
                key={user.userId}
                type="button"
                className="rtc-mention-item"
                onClick={() =>
                  handleMentionSelect(user)
                }
              >
                @{user.displayName}
              </button>
            ))}
          </div>
        )}

      <input
        className="rtc-chat-input"
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendMessage();
            setShowMentions(false);
          }

          if (e.key === "Escape") {
            setShowMentions(false);
          }
        }}
      />

      <button
        className="rtc-send-button"
        onClick={() => {
          sendMessage();
          setShowMentions(false);
        }}
      >
        ➤
      </button>

    </div>
  );
}

export default ChatInput;