import "./App.css";
import CommunicationWidget from "../../widget/src/CommunicationWidget";

const currentUser = {
    
        userId: "user-13",
        displayName: "Khushboo13",
        role: "admin",
};

const users = [
    currentUser,

    {
        userId: "user-2",
        displayName: "Admin 2",
        role: "admin",
    },
    {
        userId: "user-8",
        displayName: "Khushboo",
        role: "user",
    },
    {
        userId: "user-9",
        displayName: "Prince",
        role: "user",
    },
    {
        userId: "user-10",
        displayName: "Rahul",
        role: "user",
    },
    {
        userId: "user-12",
        displayName: "Khushboo12",
        role: "user",
    },
    {
        userId: "user-14",
        displayName: "Khushboo14",
        role: "user",
    },
    {
        userId: "user-15",
        displayName: "Khushboo15",
        role: "user",
    },
    {
        userId: "user-16",
        displayName: "Khushboo16",
        role: "user",
    },
    {
        userId: "user-17",
        displayName: "Khushboo17",
        role: "user",
    },
];

function App() {
    return (
        <CommunicationWidget
            currentUser={currentUser}
            users={users}
            serverUrl="http://localhost:5000"
        />
    );
}

export default App;