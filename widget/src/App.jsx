import WidgetContainer from "./components/WidgetContainer/WidgetContainer";

function App() {
  const currentUser = {
    userId: "user-2",
    displayName: "User 2",
  };

  const users = [
    {
      userId: "user-1",
      displayName: "User 1",
    },
    {
      userId: "user-3",
      displayName: "User 3",
    },
    {
      userId: "user-4",
      displayName: "User 4",
    },
  ];

  return (
    <div className="App">
      {/* Hello {currentUser.displayName}! */}
      <WidgetContainer
        // currentUser={currentUser}
        // users={users}
      />
    </div>
  );
}

export default App;