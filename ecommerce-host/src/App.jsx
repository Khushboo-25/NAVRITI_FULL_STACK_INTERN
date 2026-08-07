import CommunicationWidget from "@rtc-widget/react";
import "@rtc-widget/react/style.css";

const currentUser = {
  userId: "user-1",
  displayName: "User 1",
};

const users = [
  currentUser,
  {
    userId: "user-2",
    displayName: "User 2",
  },
  {
    userId: "user-3",
    displayName: "User 3",
  },
];

function App() {
  return (
    <>
      {/* Host Application UI */}

      <CommunicationWidget
        currentUser={currentUser}
        users={users}
        serverUrl="http://localhost:5000"
        // theme={{
        //   position: "bottom-right",
        //   width: 400,
        //   height: 650,
        //   borderRadius: 18,
        // }}
      />
    </>
  );
}

export default App;