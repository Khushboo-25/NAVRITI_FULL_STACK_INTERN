import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import CommunicationWidget from "@rtc-widget/react";
import "@rtc-widget/react/style.css";

const currentUser = 
  { userId: "user-13", displayName: "Khushboo13" };

const users = [
  currentUser,
  {
    userId: "user-2",
    displayName: "User 2",
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
