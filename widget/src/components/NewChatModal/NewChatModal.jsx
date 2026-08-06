import "./NewChatModal.css";
import { useState } from "react";

function NewChatModal({
  currentUser,
  users,
  isOpen,
  onClose,
  onStartChat,
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (user) =>
      user.userId !== currentUser &&
      user.displayName
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="rtc-modal-overlay">

      <div className="rtc-modal">

        <h2>💬 New Chat</h2>

        <input
          className="rtc-user-search"
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <div className="rtc-user-list">

          {filteredUsers.map((user) => (

            <div
              key={user.userId}
              className={`rtc-user-item ${
                selectedUser === user.userId
                  ? "rtc-selected-user"
                  : ""
              }`}
              onClick={() =>
                setSelectedUser(user.userId)
              }
            >
              <div className="rtc-user-avatar">
                {user.displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                {user.displayName}
              </div>

            </div>

          ))}

        </div>

        <div className="rtc-modal-buttons">

          <button
            className="rtc-cancel-btn"
            onClick={() => {
              setSelectedUser("");
              setSearch("");
              onClose();
            }}
          >
            Cancel
          </button>

          <button
            className="rtc-primary-btn"
            disabled={!selectedUser}
            onClick={() => {
              onStartChat(selectedUser);
              setSelectedUser("");
              setSearch("");
            }}
          >
            Start Chat
          </button>

        </div>

      </div>

    </div>
  );
}

export default NewChatModal;