import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="p-8 bg-gray-900/80 border border-cyan-500/50 rounded-lg shadow-2xl shadow-cyan-500/20 w-full max-w-sm m-4 text-center animate-fade-in">
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
        <h1 className="text-3xl font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.7)] mb-2">
          BWS
        </h1>
        <p className="text-fuchsia-300 mb-6 drop-shadow-[0_0_5px_rgba(232,121,249,0.7)]">Enter your callsign to access workspace</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full p-3 mb-4 bg-gray-900/70 border border-cyan-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center transition-shadow duration-300 focus:shadow-[0_0_15px_rgba(0,255,255,0.5)]"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-cyan-900/50 hover:bg-cyan-500/70 border border-cyan-500 rounded-md transition-all text-cyan-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.9)] text-lg font-bold"
          >
            Enter Workspace
          </button>
        </form>
        <p className="text-xs text-cyan-500/70 mt-6">Created by Bigbundit</p>
      </div>
    </div>
  );
};

export default LoginScreen;