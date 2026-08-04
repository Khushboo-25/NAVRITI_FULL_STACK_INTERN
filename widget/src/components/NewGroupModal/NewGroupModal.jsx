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
  const [selectedUsers, setSelectedUsers] = useState([]);

  if (!isOpen) return null;

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(
        selectedUsers.filter((id) => id !== userId)
      );
    } else {
      setSelectedUsers([
        ...selectedUsers,
        userId,
      ]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">

        <h3>Create Group</h3>

        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) =>
            setGroupName(e.target.value)
          }
        />

        <h4>Select Members</h4>

        <div className="user-list">
          {users
            .filter(
              (user) =>
                user.userId !== currentUser
            )
            .map((user) => (
              <label key={user.userId}>

                <input
                  type="checkbox"
                  checked={selectedUsers.includes(
                    user.userId
                  )}
                  onChange={() =>
                    toggleUser(user.userId)
                  }
                />

                {user.displayName}

              </label>
            ))}
        </div>

        <div className="modal-buttons">

          <button
            disabled={
              !groupName ||
              selectedUsers.length === 0
            }
            onClick={() =>
              onCreateGroup(
                groupName,
                selectedUsers
              )
            }
          >
            Create Group
          </button>

          <button onClick={onClose}>
            Cancel
          </button>

        </div>

      </div>
    </div>
  );
}

export default NewGroupModal;