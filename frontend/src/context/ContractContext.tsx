import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { pyusdABI, timeCapsuleABI } from "../utils/contractABI";
import { initNexus, executeCrossChain } from "../services/availService";
import type { SUPPORTED_CHAINS_IDS } from "@avail-project/nexus-core";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const PYUSD_ADDRESS = import.meta.env.VITE_PYUSD_ADDRESS;
const TIME_CAPSULE_ADDRESS = import.meta.env.VITE_TIME_CAPSULE_ADDRESS;

const NEXUS_ROUTER_ADDRESS_SEPOLIA =
  "0x7b5817ce177112c7b8641af73f6030c2d3a339b1";
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in hex

// Helper function to create a delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ContractContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  pyusd: ethers.Contract | null;
  capsule: ethers.Contract | null;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  mintTokens: (amount: bigint) => Promise<void>;
  createCapsule: (
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number
  ) => Promise<void>;
  createCapsuleCrossChain: (
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number,
    targetChainId: number
  ) => Promise<void>;
}

const ContractContext = createContext<ContractContextType>({
  account: null,
  provider: null,
  pyusd: null,
  capsule: null,
  isLoading: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  mintTokens: async () => {},
  createCapsule: async () => {},
  createCapsuleCrossChain: async () => {},
});

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [pyusd, setPyusd] = useState<ethers.Contract | null>(null);
  const [capsule, setCapsule] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-Connect (Silent, non-blocking connection check)
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const prov = new ethers.BrowserProvider(window.ethereum);
          const accounts = await prov.send("eth_accounts", []);

          // --- CRITICAL CHANGE: Only set state, do not call connectWallet (avoiding race condition) ---
          if (accounts.length > 0) {
            setProvider(prov);
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error("Auto-connect failed:", err);
        }
      }
    };
    checkConnection();
  }, []);

  // Handle Account Changes (Standard Ethers/MetaMask listener)
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setPyusd(null);
          setCapsule(null);
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () =>
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
    }
  }, [account]);

  // Separate SDK Initialization Effect (Runs after account/provider are set)
  useEffect(() => {
    if (account && window.ethereum && !capsule) {
      const initializeSdkSafely = async () => {
        try {
          // 1. Ensure Wallet Connection is stable
          const prov = new ethers.BrowserProvider(window.ethereum);
          const signer = await prov.getSigner();

          setPyusd(new ethers.Contract(PYUSD_ADDRESS, pyusdABI, signer));
          setCapsule(
            new ethers.Contract(TIME_CAPSULE_ADDRESS, timeCapsuleABI, signer)
          );

          // 2. Initialize Nexus SDK
          await initNexus(window.ethereum);
          console.log(
            "✅ Nexus SDK initialized successfully in separate effect."
          );
        } catch (sdkError) {
          console.error(
            "❌ Nexus SDK initialization FAILED in new effect:",
            sdkError
          );
        }
      };
      initializeSdkSafely();
    }
  }, [account]);

  // Explicit User Connection Handler
  const connectWallet = async (silentReconnect: boolean = false) => {
    if (!window.ethereum) return alert("MetaMask not detected!");

    try {
      setIsLoading(true);
      const prov = new ethers.BrowserProvider(window.ethereum);

      // 1. REQUEST ACCOUNTS
      let accounts: string[];
      if (silentReconnect) {
        accounts = await prov.send("eth_accounts", []);
        if (accounts.length === 0) {
          setIsLoading(false);
          return;
        }
      } else {
        accounts = await prov.send("eth_requestAccounts", []);
      }

      // 2. CHECK/SWITCH CHAIN
      let chainId = await prov.send("eth_chainId", []);

      if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
        try {
          await prov.send("wallet_switchEthereumChain", [
            { chainId: SEPOLIA_CHAIN_ID_HEX },
          ]);
          await delay(700); // 700ms CRITICAL FIX: Wait for MetaMask state clearance
          chainId = await prov.send("eth_chainId", []);
        } catch (switchError: any) {
          if (switchError.code === 4001) {
            alert(
              "Please switch your wallet to the Sepolia network manually to use this app."
            );
          } else {
            alert("Could not switch to Sepolia. Ensure it is configured.");
          }
          setIsLoading(false);
          return;
        }
      }

      // 3. Ethers/State Setup
      setProvider(prov);
      setAccount(accounts[0]);

      const signer = await prov.getSigner();
      setPyusd(new ethers.Contract(PYUSD_ADDRESS, pyusdABI, signer));
      setCapsule(
        new ethers.Contract(TIME_CAPSULE_ADDRESS, timeCapsuleABI, signer)
      );

      // 4. SDK INITIALIZATION (For manual connection flow)
      try {
        await initNexus(window.ethereum);
        console.log("✅ Nexus SDK initialized");
      } catch (sdkError) {
        console.error("❌ Nexus SDK initialization FAILED:", sdkError);
        throw new Error(
          "SDK initialization failed. Cross-chain features are unavailable."
        );
      }

      console.log("✅ Wallet connected:", accounts[0]);
    } catch (err: any) {
      console.error(err);
      if (!silentReconnect) {
        alert(`Connection failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    if (!account) return;
    try {
      setAccount(null);
      setProvider(null);
      setPyusd(null);
      setCapsule(null);
      console.log("🛑 Wallet disconnected.");
    } catch (err) {
      console.error("Disconnection failed:", err);
    }
  };

  const mintTokens = async (amount: bigint) => {
    if (!pyusd || !account) return alert("Connect wallet first!");
    try {
      setIsLoading(true);
      const tx = await pyusd.mint(account, amount);
      await tx.wait();
      alert(`✅ Minted ${ethers.formatEther(amount)} PYUSD`);
    } catch (err: any) {
      console.error(err);
      alert(`Mint failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createCapsule = async (
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number
  ) => {
    if (!capsule || !pyusd || !account) return alert("Connect wallet first!");
    try {
      setIsLoading(true);
      const capsuleAddress = await capsule.getAddress();

      // Approve tokens
      const approveTx = await pyusd.approve(capsuleAddress, amount);
      await approveTx.wait();

      // Create capsule
      const tx = await capsule.createCapsule(
        amount,
        message,
        fileHash,
        unlockTime
      );
      await tx.wait();

      alert("✅ Capsule created successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Create capsule failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createCapsuleCrossChain = async (
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number,
    targetChainId: number
  ) => {
    if (!capsule || !pyusd || !account) return alert("Connect wallet first!");

    try {
      setIsLoading(true);
      const nexusRouterAddress = NEXUS_ROUTER_ADDRESS_SEPOLIA;

      // 1. Approve the Nexus Router (the cross-chain bridge contract)
      const approveTx = await pyusd.approve(nexusRouterAddress, amount);
      await approveTx.wait();
      console.log("✅ Approved Nexus Router to spend tokens.");

      // 2. Execute Cross-Chain Transaction...
      const capsuleAddress = await capsule.getAddress();
      const targetChainIdSDK = targetChainId as SUPPORTED_CHAINS_IDS;
      // Using PYUSD as the canonical token for the bridge
      const tokenSymbol = "PYUSD" as any;
      const amountString = amount.toString();
      console.log(
        `Executing Bridge: Token=${tokenSymbol}, Amount=${amountString}, TargetChain=${targetChainIdSDK}`
      );

      await executeCrossChain(
        capsuleAddress,
        timeCapsuleABI,
        "createCapsule",
        [amount.toString(), message, fileHash, unlockTime],
        targetChainIdSDK,
        tokenSymbol,
        amountString
      );
      
      alert(
        "✅ Cross-chain Capsule creation initiated! Check wallet for transaction status."
      );
    } catch (err: any) {
      console.error("Cross-chain execution failed:", err);
      alert(
        `❌ Cross-chain creation failed! Details: ${
          err.message ||
          "Ensure tokens are approved, and you have the required tokens and gas."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContractContext.Provider
      value={{
        account,
        provider,
        pyusd,
        capsule,
        isLoading,
        connectWallet,
        disconnectWallet,
        mintTokens,
        createCapsule,
        createCapsuleCrossChain,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => useContext(ContractContext);