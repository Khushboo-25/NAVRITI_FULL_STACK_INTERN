import { useEffect, useState } from "react";
import "./MessageItem.css";

function MessageItem({
    message,
    currentUser,
    onEditMessage,
    onDeleteMessage,
}) {
    const [isEditing, setIsEditing] =
        useState(false);

    const [editContent, setEditContent] =
        useState(message.content);


    /*
     * Keep edit input synchronized if
     * another client edits this message.
     */

    useEffect(() => {
        setEditContent(message.content);
    }, [message.content]);


    /*
     * Message time
     */

    const time = new Date(
        message.createdAt
    ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });


    /*
     * Check whether this is current user's message
     */

    const isMine =
        message.senderId ===
        currentUser?.userId;


    /*
     * Start editing
     */

    const handleEdit = () => {
        setEditContent(message.content);
        setIsEditing(true);
    };


    /*
     * Save edit
     */

    const handleSaveEdit = () => {
        const trimmedContent =
            editContent.trim();

        if (!trimmedContent) {
            return;
        }

        /*
         * Send edit request through parent.
         */

        onEditMessage(
            message._id,
            trimmedContent
        );

        setIsEditing(false);
    };


    /*
     * Cancel editing
     */

    const handleCancelEdit = () => {
        setEditContent(message.content);
        setIsEditing(false);
    };


    return (
        <div
            className={`rtc-message ${
                isMine
                    ? "rtc-mine"
                    : "rtc-other"
            }`}
        >

            {/* Sender name */}

            {!isMine && (
                <div className="rtc-sender">
                    {message.senderId}
                </div>
            )}


            <div className="rtc-bubble">

                {/* Deleted message */}

                {message.isDeleted ? (
                    <>
                        <div className="rtc-deleted-message">
                            Message deleted
                        </div>

                        <span className="rtc-message-time">
                            {time}
                        </span>
                    </>
                ) : isEditing ? (

                    /* Edit mode */

                    <div className="rtc-message-edit">

                        <input
                            value={editContent}
                            onChange={(e) =>
                                setEditContent(
                                    e.target.value
                                )
                            }
                            autoFocus
                            onKeyDown={(e) => {
                                if (
                                    e.key ===
                                    "Enter"
                                ) {
                                    handleSaveEdit();
                                }

                                if (
                                    e.key ===
                                    "Escape"
                                ) {
                                    handleCancelEdit();
                                }
                            }}
                        />

                        <div className="rtc-message-actions">

                            <button
                                type="button"
                                onClick={
                                    handleSaveEdit
                                }
                            >
                                Save
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleCancelEdit
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                ) : (

                    /* Normal message */

                    <>
                        <div>
                            {message.content}
                        </div>

                        <span className="rtc-message-time">
                            {time}
                        </span>


                        {/* Actions only for own messages */}

                        {isMine && (
                            <div className="rtc-message-actions">

                                <button
                                    type="button"
                                    className="rtc-edit-button"
                                    onClick={
                                        handleEdit
                                    }
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    className="rtc-delete-button"
                                    onClick={() =>
                                        onDeleteMessage(
                                            message._id
                                        )
                                    }
                                >
                                    Delete
                                </button>

                            </div>
                        )}

                    </>
                )}

            </div>
        </div>
    );
}

export default MessageItem;