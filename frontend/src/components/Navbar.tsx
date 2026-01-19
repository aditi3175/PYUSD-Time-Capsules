import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useContracts } from "../context/ContractContext";

const Navbar: React.FC = () => {
  const { account, disconnectWallet } = useContracts();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-linear-to-r from-gray-900 via-purple-900 to-gray-900 text-white shadow-2xl border-b border-purple-500/30">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/80 transition-all duration-300 group-hover:scale-110">
              <span className="text-2xl">⏳</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                PYUSD Time Capsules
              </h1>
              <p className="text-xs text-purple-300">
                Preserve memories, unlock futures
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive("/")
                  ? "bg-purple-600 shadow-lg shadow-purple-500/50 scale-105"
                  : "bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm"
              }`}
            >
              🏠 Home
            </Link>
            <Link
              to="/my-capsules"
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive("/my-capsules")
                  ? "bg-purple-600 shadow-lg shadow-purple-500/50 scale-105"
                  : "bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm"
              }`}
            >
              💎 My Capsules
            </Link>
            <Link
              to="/dashboard"
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive("/dashboard")
                  ? "bg-purple-600 shadow-lg shadow-purple-500/50 scale-105"
                  : "bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm"
              }`}
            >
              📊 Dashboard
            </Link>
          </div>

          {/* Wallet Button */}
          <div>
            {account ? (
              <div className="flex items-center space-x-3">
                <div className="px-4 py-2 bg-linear-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/50 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono text-green-300">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  window.ethereum.request({ method: "eth_requestAccounts" })
                }
                className="px-6 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 transition-all duration-300 hover:scale-105"
              >
                🔗 Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;