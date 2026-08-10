import "./App.css";
import CommunicationWidget from "@rtc-widget/react";
import "@rtc-widget/react/style.css";

const currentUser = 
  { userId: "user-12", displayName: "Khushboo12" };

const users = [
  currentUser,
  {
    userId: "user-1",
    displayName: "John Doe",
  },
  {
    userId: "user-2",
    displayName: "Jane Smith",
  },
  {
    userId: "user-3",
    displayName: "Alex Johnson",
  },
  { userId: "user-8", displayName: "Khushboo" },
  { userId: "user-9", displayName: "Prince" },
  { userId: "user-10", displayName: "Rahul" },
  
  { userId: "user-12", displayName: "Khushboo12" },
  { userId: "user-13", displayName: "Khushboo13" },
  { userId: "user-14", displayName: "Khushboo14" },
  { userId: "user-15", displayName: "Khushboo15" },
  { userId: "user-16", displayName: "Khushboo16" },
  { userId: "user-17", displayName: "Khushboo17" },
];

function App() {
  return (
    <>
      <header className="header">
        <h1>Dashboard Host Application</h1>
      </header>

      <main className="dashboard">
        <div className="card">
          <h2>Total Users</h2>
          <p>1,250</p>
        </div>

        <div className="card">
          <h2>Revenue</h2>
          <p>₹2,45,000</p>
        </div>

        <div className="card">
          <h2>Active Sessions</h2>
          <p>128</p>
        </div>

        <div className="card">
          <h2>Support Tickets</h2>
          <p>18</p>
        </div>
      </main>

      <CommunicationWidget
        currentUser={currentUser}
        users={users}
        serverUrl="http://localhost:5000"
        // theme={{
        //   position: "bottom-right",
        //   width: 420,
        //   height: 650,
        //   borderRadius: 18,
        // }}
      />
    </>
  );
}

export default App;