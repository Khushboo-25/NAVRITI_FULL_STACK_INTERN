import { useState } from "react";
import "./NewGroupModal.css";

function NewGroupModal({
  currentUser,
  users,
  isOpen,
  onClose,
  onCreateGroup,
}) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (user) =>
      user.userId !== currentUser &&
      user.displayName
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers((prev) =>
        prev.filter((id) => id !== userId)
      );
    } else {
      setSelectedUsers((prev) => [...prev, userId]);
    }
  };

  const resetModal = () => {
    setGroupName("");
    setSearch("");
    setSelectedUsers([]);
    onClose();
  };

  return (
    <div className="rtc-modal-overlay">
      <div className="rtc-modal">

        <div className="rtc-modal-header">
          <h2>👥 Create Group</h2>
        </div>

        <input
          className="rtc-group-name-input"
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) =>
            setGroupName(e.target.value)
          }
        />

        <input
          className="rtc-user-search"
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        {selectedUsers.length > 0 && (
          <div className="rtc-selected-members">

            {selectedUsers.map((id) => {
              const user = users.find(
                (u) => u.userId === id
              );

              return (
                <div
                  key={id}
                  className="rtc-member-chip"
                >
                  {user.displayName}

                  <button
                    type="button"
                    onClick={() =>
                      toggleUser(id)
                    }
                  >
                    ✕
                  </button>
                </div>
              );
            })}

          </div>
        )}

        <div className="rtc-user-list">

          {filteredUsers.map((user) => (

            <div
              key={user.userId}
              className={`rtc-user-item ${
                selectedUsers.includes(user.userId)
                  ? "rtc-selected-user"
                  : ""
              }`}
              onClick={() =>
                toggleUser(user.userId)
              }
            >

              <div className="rtc-user-avatar">
                {user.displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="rtc-user-name">
                {user.displayName}
              </div>

              {selectedUsers.includes(
                user.userId
              ) && (
                <span className="rtc-check">
                  ✓
                </span>
              )}

            </div>

          ))}

        </div>

        <div className="rtc-modal-buttons">

          <button
            className="rtc-cancel-btn"
            onClick={resetModal}
          >
            Cancel
          </button>

          <button
            className="rtc-primary-btn"
            disabled={
              !groupName.trim() ||
              selectedUsers.length === 0
            }
            onClick={() => {
              onCreateGroup(
                groupName,
                selectedUsers
              );

              setGroupName("");
              setSearch("");
              setSelectedUsers([]);
            }}
          >
            Create Group
          </button>

        </div>

      </div>
    </div>
  );
}

export default NewGroupModal;