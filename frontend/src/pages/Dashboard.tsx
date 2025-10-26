import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useContracts } from "../context/ContractContext";
import type { Capsule } from "../types";

const Dashboard: React.FC = () => {
  const { capsule, account } = useContracts();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCapsules = async () => {
    if (!capsule || !account) return;

    setLoading(true);
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
    } catch (err) {
      console.error("Error fetching capsules:", err);
      alert("Error fetching capsules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapsules();
  }, [capsule, account]);

  const totalPYUSD = capsules.reduce((acc, c) => acc + c.amount, 0n);
  const openedCount = capsules.filter((c) => c.opened).length;
  const lockedCount = capsules.length - openedCount;
  const now = Math.floor(Date.now() / 1000);
  const readyToOpenCount = capsules.filter(
    (c) => !c.opened && c.unlockTime <= now
  ).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar />
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-5xl font-bold bg-lineart-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Dashboard
          </h2>
          <p className="text-purple-300">
            Track your time capsules and locked value
          </p>
        </div>

        {!account ? (
          <div className="text-center p-12 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl backdrop-blur-xl">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-yellow-300 text-xl">
              Connect your wallet to view your dashboard
            </p>
          </div>
        ) : loading ? (
          <div className="text-center p-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
            <p className="text-purple-300 text-lg">Loading your capsules...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800/50 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-blue-300 font-semibold">
                    Total Capsules
                  </h3>
                  <span className="text-3xl">📦</span>
                </div>
                <p className="text-4xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {capsules.length}
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-green-300 font-semibold">PYUSD Locked</h3>
                  <span className="text-3xl">💰</span>
                </div>
                <p className="text-4xl font-bold bg-linear-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {(Number(totalPYUSD) / 10 ** 18).toFixed(2)}
                </p>
                <p className="text-xs text-green-400 mt-1">PYUSD</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-purple-300 font-semibold">
                    Opened / Locked
                  </h3>
                  <span className="text-3xl">🔓</span>
                </div>
                <p className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {openedCount} / {lockedCount}
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-lg shadow-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-orange-300 font-semibold">
                    Ready to Open
                  </h3>
                  <span className="text-3xl">✨</span>
                </div>
                <p className="text-4xl font-bold bg-linear-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  {readyToOpenCount}
                </p>
              </div>
            </div>

            {/* Recent Capsules */}
            <div className="bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">⏳</span>
                <h3 className="text-3xl font-bold text-white">
                  Recent Capsules
                </h3>
              </div>
              {capsules.length === 0 ? (
                <div className="text-center p-12 bg-gray-900/50 rounded-2xl">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-400 text-lg">
                    No capsules yet. Create your first time capsule!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {capsules.slice(0, 5).map((c, i) => {
                    const isUnlocked = c.unlockTime <= now;
                    const canOpen = isUnlocked && !c.opened;

                    return (
                      <div
                        key={i}
                        className="bg-gray-900/50 border border-gray-700 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-lg mb-2">
                              {c.message.slice(0, 60)}
                              {c.message.length > 60 ? "..." : ""}
                            </p>
                            <p className="text-purple-300 font-mono">
                              💎 {(Number(c.amount) / 10 ** 18).toFixed(4)}{" "}
                              PYUSD
                            </p>
                          </div>
                          <div>
                            {c.opened ? (
                              <span className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-full">
                                ✓ Opened
                              </span>
                            ) : canOpen ? (
                              <span className="px-4 py-2 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/50 animate-pulse">
                                ⚡ Ready!
                              </span>
                            ) : (
                              <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 text-sm rounded-full border border-yellow-500/50">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">
                          🕐 Unlocks:{" "}
                          {new Date(c.unlockTime * 1000).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;