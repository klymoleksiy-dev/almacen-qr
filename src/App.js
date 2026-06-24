import { useState } from 'react';
import Login from './components/Login';
import MainApp from './components/MainApp';

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem('user_name'));

  if (!userName) {
    return <Login onLogin={name => {
      localStorage.setItem('user_name', name);
      setUserName(name);
    }} />;
  }

  return <MainApp userName={userName} onLogout={() => {
    localStorage.removeItem('user_name');
    setUserName(null);
  }} />;
}