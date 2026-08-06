import { useState } from "react";
import WidgetContainer from "./components/WidgetContainer/WidgetContainer";
import "./index.css";

function CommunicationWidget({
  currentUser,
  users,
  serverUrl,

  // Launcher
  launcherIcon = "💬",
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggleWidget = () => {
    setOpen((prev) => !prev);
  };

  const closeWidget = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="rtc-launcher"
        onClick={toggleWidget}
        aria-label={
          open
            ? "Close Communication Widget"
            : "Open Communication Widget"
        }
      >
        {launcherIcon}
      </button>

      {open && (
        <div className="rtc-popup">
          <WidgetContainer
            currentUser={currentUser}
            users={users}
            serverUrl={serverUrl}
            onClose={closeWidget}
          />
        </div>
      )}
    </>
  );
}

export default CommunicationWidget;