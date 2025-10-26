import React, { useState } from "react";
import { ethers } from "ethers";
import { useContracts } from "../context/ContractContext";

const hashFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hashHex}`;
};

const CapsuleForm: React.FC = () => {
  const {
    createCapsule,
    createCapsuleCrossChain,
    account,
    isLoading: contextLoading,
  } = useContracts();

  const SEPOLIA_CHAIN_ID = "11155111";

  const [formData, setFormData] = useState({
    message: "",
    fileHash: "",
    unlockTime: "",
    amount: "",
    targetChain: SEPOLIA_CHAIN_ID,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB");
      return;
    }

    setSelectedFile(file);
    setUploadProgress("Hashing file...");

    try {
      const hash = await hashFile(file);
      setFormData({ ...formData, fileHash: hash });
      setUploadProgress("");

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    } catch (error) {
      console.error("Error hashing file:", error);
      alert("Failed to process file");
      setUploadProgress("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Please connect your wallet first!");

    if (!formData.message.trim()) return alert("Please enter a message");
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      return alert("Please enter a valid amount");
    if (!formData.unlockTime) return alert("Please select an unlock time");

    const unlockTimestamp = Math.floor(
      new Date(formData.unlockTime).getTime() / 1000
    );
    const now = Math.floor(Date.now() / 1000);
    if (unlockTimestamp <= now)
      return alert("Unlock time must be in the future!");

    setIsSubmitting(true);

    try {
      const amountWei = ethers.parseUnits(formData.amount, 18);
      const targetChain = Number(formData.targetChain);

      if (formData.targetChain === SEPOLIA_CHAIN_ID) {
        await createCapsule(
          amountWei,
          formData.message,
          formData.fileHash || "",
          unlockTimestamp
        );
      } else {
        await createCapsuleCrossChain(
          amountWei,
          formData.message,
          formData.fileHash || "",
          unlockTimestamp,
          targetChain
        );
      }

      setFormData({
        message: "",
        fileHash: "",
        unlockTime: "",
        amount: "",
        targetChain: SEPOLIA_CHAIN_ID,
      });
      setSelectedFile(null);
      setFilePreview(null);
      setUploadProgress("");
    } catch (err: any) {
      console.error("Transaction failed:", err);
      alert(err.message || "Transaction failed due to an unknown error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || contextLoading;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-linear-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-4">
            <span className="text-6xl">⏳</span>
          </div>
          <h2 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Create Time Capsule
          </h2>
          <p className="text-purple-300">
            Lock your memories and PYUSD for the future
          </p>
        </div>

        {!account ? (
          <div className="text-center p-8 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <p className="text-yellow-300 text-lg">
              🔗 Connect your wallet to begin
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message */}
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <label className="block text-purple-300 font-semibold mb-3 flex items-center">
                <span className="mr-2">💬</span> Message
              </label>
              <textarea
                name="message"
                placeholder="Write your secret message to the future..."
                value={formData.message}
                onChange={handleChange}
                required
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-white placeholder-gray-500 transition-all"
              />
              <p className="text-xs text-purple-400 mt-2">
                {formData.message.length}/500 characters
              </p>
            </div>

            {/* File Upload */}
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <label className="block text-purple-300 font-semibold mb-3 flex items-center">
                <span className="mr-2">📎</span> Attach File (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 focus:border-purple-500 focus:outline-none text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer transition-all"
              />
              <p className="text-xs text-purple-400 mt-2">
                Max 5MB • Securely hashed with SHA-256
              </p>

              {filePreview && (
                <div className="mt-4 p-3 bg-gray-800/50 rounded-xl border border-purple-500/30">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-40 mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}

              {selectedFile && !filePreview && (
                <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-purple-500/30 flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-purple-400 text-sm">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              {uploadProgress && (
                <div className="mt-4 flex items-center gap-2 text-purple-400">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm">{uploadProgress}</span>
                </div>
              )}
            </div>

            {/* Unlock Time & Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                <label className="block text-purple-300 font-semibold mb-3 flex items-center">
                  <span className="mr-2">🕐</span> Unlock Time
                </label>
                <input
                  type="datetime-local"
                  name="unlockTime"
                  value={formData.unlockTime}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-white transition-all"
                />
              </div>

              <div className="bg-gray-900/50 p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                <label className="block text-purple-300 font-semibold mb-3 flex items-center">
                  <span className="mr-2">💰</span> Amount (PYUSD)
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-white placeholder-gray-500 transition-all"
                />
              </div>
            </div>

            {/* Target Chain */}
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <label className="block text-purple-300 font-semibold mb-3 flex items-center">
                <span className="mr-2">🌉</span> Target Chain
              </label>
              <select
                name="targetChain"
                value={formData.targetChain}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none text-white cursor-pointer transition-all"
              >
                <option value={SEPOLIA_CHAIN_ID}>
                  Sepolia (Current Chain)
                </option>
                <option value="11155420">Optimism Sepolia (Cross-Chain)</option>
                <option value="84532">Base Sepolia (Cross-Chain)</option>
                <option value="421614">Arbitrum Sepolia (Cross-Chain)</option>
              </select>
              <p className="text-xs text-purple-400 mt-2">
                {formData.targetChain === SEPOLIA_CHAIN_ID
                  ? "✓ Same chain deployment"
                  : "🌉 Cross-chain bridge & execute"}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isLoading
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80 hover:scale-105"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </span>
              ) : (
                <span>
                  {formData.targetChain === SEPOLIA_CHAIN_ID
                    ? "🚀 Create Capsule"
                    : "🌉 Bridge & Create"}
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CapsuleForm;