
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signIn, signOut } from '../services/firebase';
import { APP_TITLE } from '../constants';

interface NavbarProps {
  onCreateTask: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCreateTask }) => {
  const { user, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    try {
      await signIn(email, password);
      setIsLoginModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setError("登入失敗，請檢查您的帳號或密碼。");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error(err);
      setError("登出失敗。");
    }
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg sticky top-0 z-30">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
          <div className="space-x-3">
            {isAdmin && (
              <button
                onClick={onCreateTask}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out shadow hover:shadow-md"
              >
                <i className="fas fa-plus mr-2"></i>建立任務
              </button>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out shadow hover:shadow-md"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>登出 ({user.email})
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white hover:bg-gray-100 text-blue-600 font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out shadow hover:shadow-md"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>登入
              </button>
            )}
          </div>
        </div>
      </nav>

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">管理員登入</h2>
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">電子郵件</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="password_login" className="block text-sm font-medium text-gray-700">密碼</label>
                <input
                  type="password"
                  id="password_login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLoginModalOpen(false); setError(null); }}
                  disabled={isLoggingIn}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
                >
                  {isLoggingIn ? (
                     <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
                  ): "登入"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
