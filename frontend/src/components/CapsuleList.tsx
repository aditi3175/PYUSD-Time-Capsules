import React, { useEffect, useState } from "react";
import { useContracts } from "../context/ContractContext";
import CapsuleCard from "./CapsuleCard";
import type { Capsule } from "../types";

const CapsuleList: React.FC = () => {
  const { capsule, account } = useContracts();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapsules = async () => {
      if (!capsule || !account) return;

      setLoading(true);
      setError(null);

      try {
        const totalCountRaw = await capsule.capsuleCount();
        const totalCount = BigInt(totalCountRaw.toString());

        if (totalCount === 0n) {
          setCapsules([]);
          setLoading(false);
          return;
        }

        const allCapsules: Capsule[] = [];

        for (let i = 1n; i <= totalCount; i++) {
          try {
            const capsuleData = await capsule.getCapsule(i);

            if (capsuleData.owner.toLowerCase() === account.toLowerCase()) {
              allCapsules.push({
                owner: capsuleData.owner,
                amount: BigInt(capsuleData.amount.toString()),
                message: capsuleData.message,
                fileHash: capsuleData.fileHash || "",
                unlockTime: Number(capsuleData.unlockTime),
                opened: capsuleData.opened,
              });
            }
          } catch (err) {
            console.error(`Error fetching capsule ${i}:`, err);
          }
        }

        setCapsules(allCapsules);
      } catch (err: any) {
        console.error("Error fetching capsules:", err);
        setError("Failed to fetch capsules. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCapsules();
  }, [capsule, account]);

  if (!account) {
    return (
      <div className="text-center p-12 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl backdrop-blur-xl">
        <div className="text-6xl mb-4">🔐</div>
        <p className="text-yellow-300 text-xl">
          Connect your wallet to view your capsules
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-12">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
        <p className="text-purple-300 text-lg">Loading capsules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-3xl backdrop-blur-xl">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-300 text-lg mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">💎</span>
        <h2 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          My Time Capsules
        </h2>
      </div>
      {capsules.length === 0 ? (
        <div className="text-center p-16 bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl">
          <div className="text-8xl mb-6">📭</div>
          <p className="text-gray-300 text-xl mb-2">No capsules found</p>
          <p className="text-purple-400">
            Create your first time capsule to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capsules.map((c, i) => (
            <CapsuleCard key={i} capsule={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CapsuleList;