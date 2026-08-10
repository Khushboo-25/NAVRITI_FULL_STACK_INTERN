import { useState } from "react";
import "./MessageItem.css";

function MessageItem({
  message,
  currentUser,
  onEditMessage,
  onDeleteMessage,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(
    message.content
  );

  const time = new Date(
    message.createdAt
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isMine =
    message.senderId === currentUser?.userId;

  const handleEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;

    onEditMessage(
      message._id,
      editContent.trim()
    );

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={`rtc-message ${
        isMine ? "rtc-mine" : "rtc-other"
      }`}
    >
      {!isMine && (
        <div className="rtc-sender">
          {message.senderId}
        </div>
      )}

      <div className="rtc-bubble">

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
          <div className="rtc-message-edit">
            <input
              value={editContent}
              onChange={(e) =>
                setEditContent(e.target.value)
              }
              autoFocus
            />

            <div className="rtc-message-actions">
              <button
                onClick={handleSaveEdit}
              >
                Save
              </button>

              <button
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>{message.content}</div>

            <span className="rtc-message-time">
              {time}
            </span>

            {isMine && (
              <div className="rtc-message-actions">
                <button
                  className="rtc-edit-button"
                  onClick={handleEdit}
                >
                  Edit
                </button>

                <button
                  className="rtc-delete-button"
                  onClick={() =>
                    onDeleteMessage(message._id)
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