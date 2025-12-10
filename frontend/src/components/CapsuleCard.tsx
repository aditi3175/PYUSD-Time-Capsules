import React, { useState } from "react";
import type { Capsule } from "../types";
import { formatPYUSD, formatTimestamp } from "../utils/helpers";
import { useContracts } from "../context/ContractContext";

interface CapsuleCardProps {
  capsule: Capsule;
}

const CapsuleCard: React.FC<CapsuleCardProps> = ({ capsule }) => {
  const { withdrawCapsule, withdrawCapsuleCrossChain, transferCapsuleOwnership } = useContracts();
  const [recipient, setRecipient] = useState("");
  const [targetChainId, setTargetChainId] = useState<number>(11155420); // example Optimism Sepolia
  const now = Math.floor(Date.now() / 1000);
  const isUnlocked = capsule.unlockTime <= now;
  const canOpen = isUnlocked && !capsule.opened;
  const timeLeft = capsule.unlockTime - now;

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Unlocked!";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:scale-105 hover:border-purple-500/60 transition-all duration-300 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/30">
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {capsule.opened ? (
            <span className="inline-flex items-center px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
              <span className="mr-1">✓</span> Opened
            </span>
          ) : canOpen ? (
            <span className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/50 animate-pulse">
              <span className="mr-1">⚡</span> Ready to Open!
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/50">
              <span className="mr-1">🔒</span> {formatTimeLeft(timeLeft)}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {formatPYUSD(capsule.amount)}
          </p>
        </div>
      </div>

      {/* Message */}
      <div className="mb-4">
        <p className="text-white font-medium text-lg mb-2 line-clamp-2">
          {capsule.message}
        </p>
      </div>

      {/* File Hash */}
      {capsule.fileHash && (
        <div className="mb-4 p-3 bg-gray-900/50 rounded-xl border border-purple-500/20">
          <p className="text-purple-300 text-xs mb-1">📎 File Hash:</p>
          <p className="text-gray-400 text-xs font-mono break-all">
            {capsule.fileHash.slice(0, 20)}...{capsule.fileHash.slice(-10)}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 pt-4 border-t border-gray-700">
        <div className="flex items-center text-sm">
          <span className="text-gray-400 mr-2">👤</span>
          <span className="text-gray-400">Owner:</span>
          <span className="ml-auto text-purple-300 font-mono text-xs">
            {capsule.owner.slice(0, 6)}...{capsule.owner.slice(-4)}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-400 mr-2">🕐</span>
          <span className="text-gray-400">Unlock Time:</span>
          <span className="ml-auto text-purple-300 text-xs">
            {formatTimestamp(capsule.unlockTime)}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-400 mr-2">📊</span>
          <span className="text-gray-400">Status:</span>
          <span className="ml-auto text-purple-300 text-xs">
            {capsule.opened ? "Opened" : "Locked"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 mt-4">
        {canOpen && (
          <>
            <button
              onClick={() => withdrawCapsule(capsule.id as number)}
              className="w-full py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-semibold shadow-lg shadow-green-500/50 hover:shadow-green-500/80 transition-all duration-300 hover:scale-105"
            >
              🔓 Open Capsule
            </button>
            <div className="flex items-center gap-2">
              <input
                value={targetChainId}
                onChange={(e) => setTargetChainId(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-sm"
                placeholder="Target Chain ID"
              />
              <button
                onClick={() => withdrawCapsuleCrossChain(capsule.id as number, targetChainId)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm"
              >
                🌉 Cross-Chain Withdraw
              </button>
            </div>
          </>
        )}

        {!capsule.opened && (
          <div className="flex items-center gap-2">
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-sm"
              placeholder="Recipient address"
            />
            <button
              onClick={() => transferCapsuleOwnership(capsule.id as number, recipient)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
            >
              🎁 Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapsuleCard;