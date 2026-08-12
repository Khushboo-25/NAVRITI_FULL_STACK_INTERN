import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import CommunicationWidget from "../../widget/src/CommunicationWidget";


function App() {
  const currentUser = {
    userId: "user-1",
    displayName: "Khushboo",
  };

  const users = [
    {
      userId: "user-1",
      displayName: "Khushboo",
    },
    {
      userId: "user-2",
      displayName: "Prince",
    },
    {
      userId: "user-3",
      displayName: "Rahul",
    },
  ];

  return (
    <div className="host-app">
      <CommunicationWidget
        currentUser={currentUser}
        users={users}
        serverUrl="http://localhost:5000"
      />
    </div>
  );
}

export default App;