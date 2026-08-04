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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">

      <div className="modal">

        <h3>Start New Chat</h3>

        <select
          value={selectedUser}
          onChange={(e) =>
            setSelectedUser(e.target.value)
          }
        >
          <option value="">
            Select User
          </option>

          {users
            .filter(
              (user) => user.userId !== currentUser
            )
            .map((user) => (
              <option
                key={user.userId}
                value={user.userId}
              >
                {user.displayName}
              </option>
          ))}
        </select>

        <div className="modal-buttons">

          <button
            disabled={!selectedUser}
            onClick={() =>
              onStartChat(selectedUser)
            }
          >
            Start Chat
          </button>

          <button
            onClick={() => {
              setSelectedUser("");
              onClose();
            }}
          >
            Cancel
          </button>

        </div>

      </div>

    </div>
  );
}

export default NewChatModal;