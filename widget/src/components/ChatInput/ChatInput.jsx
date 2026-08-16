import { useState } from "react";
import "./ChatInput.css";

function ChatInput({
    message,
    setMessage,
    sendMessage,
    users = [],
    currentUser,
    selectedConversation,
    serverUrl,
}) {
    const [showMentions, setShowMentions] =
        useState(false);

    const [mentionText, setMentionText] =
        useState("");
    const [isUploading, setIsUploading] = 
        useState(false);


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
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        try {
            setIsUploading(true);

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
                `${serverUrl}/api/files/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "File upload failed"
                );
            }

            sendMessage({
                messageType: "file",
                content: "",
                attachment: {
                    fileName: data.file.originalName,
                    fileUrl: data.file.fileUrl,
                    fileType: data.file.fileType,
                    fileSize: data.file.fileSize,
                },
            });

        } catch (error) {
            console.error("File upload error:", error);
            alert(error.message || "File upload failed");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    /*
     * --------------------------------------------
     * Filter users for mention
     * --------------------------------------------
     */

    const participantIds =
    selectedConversation?.participants || [];

    const filteredUsers = users
        .filter((user) =>
            participantIds.some(
                (id) =>
                    id.toString() ===
                    user.userId.toString()
            )
        )
        .filter(
            (user) =>
                user.userId.toString() !==
                currentUser?.userId.toString()
        )
        .filter((user) =>
            user.displayName
                ?.toLowerCase()
                .includes(mentionText)
        );
        console.log("MENTION DEBUG", {
            selectedConversation,
            participantIds,
            users,
            filteredUsers,
        });

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
            {/* File Input */}
            <input
                type="file"
                id="rtc-file-input"
                hidden
                onChange={handleFileSelect}
            />

            <label
                htmlFor="rtc-file-input"
                className="rtc-file-button"
                title="Attach file"
            >
                📎
            </label>
            {/* text Input */}

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
                disabled={!message.trim() || isUploading} 
                aria-label="Send message" 
            >
                {isUploading ? "..." : "➤"}
            </button>

        </div>
    );
}

export default ChatInput;