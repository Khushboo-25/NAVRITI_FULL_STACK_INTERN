import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
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
];
function App() {
  const [count, setCount] = useState(0)

  return (
    <CommunicationWidget
      currentUser={currentUser}
      users={users}
      serverUrl="http://localhost:5000"
    />
  )
}

export default App
