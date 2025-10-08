import React from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import Background from './components/Background';
import LoginScreen from './components/LoginScreen';
import MainApp from './components/MainApp';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useLocalStorage<string | null>('bws-currentUser', null);

  const handleLogin = (username: string) => {
    // Sanitize username to create a valid key
    const sanitizedUser = username.replace(/[^a-zA-Z0-9-]/g, '');
    if(sanitizedUser) {
        setCurrentUser(sanitizedUser);
    } else {
        alert("Please enter a valid username.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <>
      <Background />
      {!currentUser ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <MainApp currentUser={currentUser} onLogout={handleLogout} />
      )}
    </>
  );
};

export default App;