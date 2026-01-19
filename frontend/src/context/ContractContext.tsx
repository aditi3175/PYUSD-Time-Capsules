import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { pyusdABI, timeCapsuleABI } from "../utils/contractABI";
import { initNexus, executeCrossChain } from "../services/availService";
import { executeOnChain } from "../services/availService";
import type { SUPPORTED_CHAINS_IDS } from "@avail-project/nexus-core";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const PYUSD_ADDRESS = import.meta.env.VITE_PYUSD_ADDRESS;
const TIME_CAPSULE_ADDRESS = import.meta.env.VITE_TIME_CAPSULE_ADDRESS;
const NEXUS_ROUTER_ADDRESS = import.meta.env.VITE_NEXUS_ROUTER_ADDRESS;
//const NEXUS_TOKEN_SYMBOL = import.meta.env.VITE_NEXUS_TOKEN_SYMBOL || "PYUSD";
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111 in hex

// Token addresses on Sepolia testnet
// NOTE: These are default addresses. You can override them via environment variables.
// USDC: Used by Aave on Sepolia (0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8)
// Some faucets may distribute USDC from different addresses - check the faucet's documentation
const TOKEN_ADDRESSES: Record<string, string> = {
  PYUSD: PYUSD_ADDRESS || "",
  USDC: import.meta.env.VITE_USDC_ADDRESS || "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Sepolia USDC (Aave-compatible)
  USDT: import.meta.env.VITE_USDT_ADDRESS || "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0", // Sepolia USDT
};

// Standard ERC20 ABI (same for all tokens)
const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

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
    targetChainId: number,
    tokenSymbol: string
  ) => Promise<void>;
  transferCapsuleOwnership: (id: number, newOwner: string) => Promise<void>;
  withdrawCapsule: (id: number) => Promise<void>;
  withdrawCapsuleCrossChain: (id: number, targetChainId: number) => Promise<void>;
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
  transferCapsuleOwnership: async () => {},
  withdrawCapsule: async () => {},
  withdrawCapsuleCrossChain: async () => {},
});

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [pyusd, setPyusd] = useState<ethers.Contract | null>(null);
  const [capsule, setCapsule] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setCurrentChainId] = useState<string | null>(null);
  const [isSepolia, setIsSepolia] = useState(false);
  const [_sdkInitialized, setSdkInitialized] = useState(false);

  const isSwitchingChain = useRef(false);

  // Auto-Connect (Silent, non-blocking connection check)
  // useEffect(() => {
  //   const checkConnection = async () => {
  //     if (window.ethereum) {
  //       try {
  //         const prov = new ethers.BrowserProvider(window.ethereum);
  //         const accounts = await prov.send("eth_accounts", []);

  //         // --- CRITICAL CHANGE: Only set state, do not call connectWallet (avoiding race condition) ---
  //         if (accounts.length > 0) {
  //           setProvider(prov);
  //           setAccount(accounts[0]);
  //         }
  //       } catch (err) {
  //         console.error("Auto-connect failed:", err);
  //       }
  //     }
  //   };
  //   checkConnection();
  // }, []);
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Just detect MetaMask, do nothing else
          await window.ethereum.request({ method: "eth_chainId" });
        } catch (err) {
          console.error("MetaMask detection failed:", err);
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
      
      // Handle Network Changes
      const handleChainChanged = async (chainId: string) => {
        setCurrentChainId(chainId);
        const isSepoliaNetwork = chainId === SEPOLIA_CHAIN_ID_HEX;
        setIsSepolia(isSepoliaNetwork);
        
        // Reset contracts when switching networks
        setPyusd(null);
        setCapsule(null);
        setSdkInitialized(false);
        
        // Reinitialize contracts if on Sepolia
        if (isSepoliaNetwork && account && window.ethereum) {
          try {
            const prov = new ethers.BrowserProvider(window.ethereum);
            const signer = await prov.getSigner();
            setPyusd(new ethers.Contract(PYUSD_ADDRESS, pyusdABI, signer));
            setCapsule(new ethers.Contract(TIME_CAPSULE_ADDRESS, timeCapsuleABI, signer));
          } catch (err) {
            console.error("Failed to reinitialize contracts on network change:", err);
          }
        }
      };
      
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      
      // Get initial chain ID
      if (window.ethereum) {
        window.ethereum.request({ method: "eth_chainId" }).then((chainId: string) => {
          setCurrentChainId(chainId);
          setIsSepolia(chainId === SEPOLIA_CHAIN_ID_HEX);
        });
      }
      
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account]);

  // Separate SDK Initialization Effect (Runs after account/provider are set)
  // Only runs if SDK hasn't been initialized yet (prevents race condition with connectWallet)
useEffect(() => {
  if (account && window.ethereum && !capsule && isSepolia) {
    const initializeContracts = async () => {
      try {
        const prov = new ethers.BrowserProvider(window.ethereum);
        const signer = await prov.getSigner();

        setPyusd(new ethers.Contract(PYUSD_ADDRESS, pyusdABI, signer));
        setCapsule(
          new ethers.Contract(TIME_CAPSULE_ADDRESS, timeCapsuleABI, signer),
        );
      } catch (err) {
        console.error("Contract init failed:", err);
      }
    };
    initializeContracts();
  }
}, [account, isSepolia]);

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
      // IMPORTANT: For cross-chain operations, you must be on Sepolia (source chain)
      // The Nexus SDK will bridge tokens FROM Sepolia TO the target chain
      // After the transaction completes, switch to the target chain to view your capsule
      let chainId = await prov.send("eth_chainId", []);

      if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
        // Prevent multiple simultaneous chain switch requests
        if (isSwitchingChain.current) {
          console.log("⏳ Chain switch already in progress, waiting...");
          // Wait for the existing switch to complete
          while (isSwitchingChain.current) {
            await delay(100);
          }
          chainId = await prov.send("eth_chainId", []);
          if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
            setIsLoading(false);
            return;
          }
        } else {
          try {
            isSwitchingChain.current = true;
            console.log("🔄 Switching to Sepolia (required for cross-chain operations)...");
            console.log("ℹ️ Note: Cross-chain capsules are created on the target chain.");
            console.log("ℹ️ After creating, switch your wallet to the target chain to view it.");
            
            await prov.send("wallet_switchEthereumChain", [
              { chainId: SEPOLIA_CHAIN_ID_HEX },
            ]);
            await delay(700); // 700ms CRITICAL FIX: Wait for MetaMask state clearance
            chainId = await prov.send("eth_chainId", []);
          } catch (switchError: any) {
            if (switchError.code === 4001) {
              alert(
                "⚠️ Chain Switch Required\n\n" +
                "This app requires Sepolia network for cross-chain operations.\n\n" +
                "How it works:\n" +
                "1. Connect on Sepolia (source chain)\n" +
                "2. Select your target chain (e.g., Arbitrum Sepolia)\n" +
                "3. Create capsule - tokens bridge automatically\n" +
                "4. Switch to target chain to view your capsule\n\n" +
                "Please switch to Sepolia manually to continue."
              );
            } else if (switchError.code === -32002) {
              // Request already pending
              console.log("⏳ Chain switch request already pending, waiting...");
              await delay(1000);
              chainId = await prov.send("eth_chainId", []);
              if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
                setIsLoading(false);
                return;
              }
            } else {
              alert("Could not switch to Sepolia. Ensure it is configured.");
            }
            setIsLoading(false);
            return;
          } finally {
            isSwitchingChain.current = false;
          }
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
      // Mark SDK as initialized to prevent useEffect from also initializing
      try {
        await initNexus(window.ethereum);
        setSdkInitialized(true);
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
      setSdkInitialized(false);
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

      // Check current allowance first
      const currentAllowance = await pyusd.allowance(account, capsuleAddress);
      console.log("Current allowance:", currentAllowance.toString());
      
      // Only approve if allowance is insufficient
      if (currentAllowance < amount) {
        console.log("Approving tokens to capsule contract...");
        const approveTx = await pyusd.approve(capsuleAddress, amount);
        await approveTx.wait();
        console.log("✅ Approved capsule contract to spend tokens.");
      } else {
        console.log("✅ Sufficient allowance already exists.");
      }

      // Create capsule
      console.log("Creating capsule on Sepolia...");
      const tx = await capsule.createCapsule(
        amount,
        message,
        fileHash,
        unlockTime
      );
      const receipt = await tx.wait();
      console.log("✅ Capsule created! Transaction hash:", receipt.hash);

      alert("✅ Capsule created successfully on Sepolia!");
    } catch (err: any) {
      console.error("Create capsule error:", err);
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
    targetChainId: number,
    tokenSymbol: string
  ) => {
    if (!capsule || !account || !provider) return alert("Connect wallet first!");

    try {
      setIsLoading(true);
      if (!NEXUS_ROUTER_ADDRESS) {
        throw new Error("Missing VITE_NEXUS_ROUTER_ADDRESS env variable");
      }

      // Validate token symbol
      const tokenUpper = String(tokenSymbol).toUpperCase();
      const supportedTokens = ["ETH", "USDC", "USDT"];
      
      if (!supportedTokens.includes(tokenUpper)) {
        setIsLoading(false);
        alert(
          `❌ Token Not Supported for Cross-Chain Bridging\n\n` +
          `The token "${tokenSymbol}" is not supported by Nexus SDK for cross-chain bridging.\n\n` +
          `Supported tokens: ETH, USDC, USDT\n\n` +
          `Note: PYUSD can only be used for same-chain (Sepolia) capsules.`
        );
        return;
      }

      // Get token address and create contract instance
      const tokenAddress = TOKEN_ADDRESSES[tokenUpper];
      if (!tokenAddress) {
        throw new Error(`Token address not found for ${tokenSymbol}. Please configure it in environment variables.`);
      }

      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

      // Get token decimals (USDC/USDT use 6, ETH uses 18)
      let tokenDecimals = 18;
      try {
        tokenDecimals = await tokenContract.decimals();
      } catch (err) {
        console.warn("Could not fetch token decimals, defaulting to 18");
      }

      // Check balance
      const balance = await tokenContract.balanceOf(account);
      if (balance < amount) {
        setIsLoading(false);
        alert(
          `❌ Insufficient Balance\n\n` +
          `You have ${ethers.formatUnits(balance, tokenDecimals)} ${tokenUpper}, but need ${ethers.formatUnits(amount, tokenDecimals)} ${tokenUpper}.\n\n` +
          `Please get more ${tokenUpper} tokens on Sepolia testnet.\n\n` +
          `💡 Tip: Use a Sepolia faucet to get testnet ${tokenUpper}.`
        );
        return;
      }

      // 1. Approve the Nexus Router (the cross-chain bridge contract)
      console.log(`Approving ${tokenUpper} to Nexus Router...`);
      const currentAllowance = await tokenContract.allowance(account, NEXUS_ROUTER_ADDRESS);
      if (currentAllowance < amount) {
        const approveTx = await tokenContract.approve(NEXUS_ROUTER_ADDRESS, amount);
        await approveTx.wait();
        console.log(`✅ Approved ${tokenUpper} to Nexus Router.`);
      } else {
        console.log(`✅ Sufficient ${tokenUpper} allowance already exists.`);
      }

      // 2. Execute Cross-Chain Transaction...
      const capsuleAddress = await capsule.getAddress();
      const targetChainIdSDK = targetChainId as SUPPORTED_CHAINS_IDS;
      
      const amountString = amount.toString();
      console.log(
        `Executing Bridge: Token=${tokenUpper}, Amount=${amountString}, TargetChain=${targetChainIdSDK}`
      );

      const result = await executeCrossChain(
        capsuleAddress,
        timeCapsuleABI,
        "createCapsule",
        [amount.toString(), message, fileHash, unlockTime],
        targetChainIdSDK,
        tokenUpper as any, // Cast to SUPPORTED_TOKENS type
        amountString
      );
      
      // Get transaction hash from result (handle different possible structures)
      const txHash = result.executeTransactionHash || 
                     (result as any).transactionHash || 
                     (result as any).hash ||
                     (result as any).executeTxHash ||
                     (result as any).txHash;
      
      // Get chain name for better user feedback
      const chainNames: Record<number, string> = {
        11155111: "Sepolia",
        421614: "Arbitrum Sepolia",
        84532: "Base Sepolia",
        11155420: "Optimism Sepolia",
        80001: "Polygon Mumbai",
        97: "BSC Testnet",
      };
      const chainName = chainNames[targetChainId] || `Chain ${targetChainId}`;
      
      if (txHash) {
        alert(
          `✅ Cross-chain Capsule created successfully on ${chainName}!\n\n` +
          `Transaction Hash: ${txHash}\n\n` +
          `⚠️ Note: This capsule is on ${chainName}, not Sepolia. ` +
          `To view it, switch your wallet to ${chainName} network.`
        );
      } else {
        alert(
          `✅ Cross-chain Capsule creation initiated on ${chainName}!\n\n` +
          `⚠️ Important: This capsule is being created on ${chainName}, not Sepolia. ` +
          `To view it, switch your wallet to ${chainName} network.\n\n` +
          `Check your wallet for transaction status.`
        );
      }
    } catch (err: any) {
      console.error("Cross-chain execution failed:", err);
      
      // Provide specific error messages
      let errorMessage = err.message || "Unknown error occurred";
      
      if (errorMessage.includes("not supported") || errorMessage.includes("Token")) {
        errorMessage = 
          `❌ Token Bridge Error:\n\n` +
          `PYUSD is not directly supported by Nexus SDK for cross-chain bridging.\n\n` +
          `Nexus SDK only supports: ETH, USDC, or USDT.\n\n` +
          `Options:\n` +
          `1. Create capsule on Sepolia (same chain) - Select "Sepolia" as target chain\n` +
          `2. Use USDC/USDT for cross-chain capsules - You'll need USDC/USDT tokens\n` +
          `3. Deploy PYUSD contract on target chain separately`;
      } else if (errorMessage.includes("Bridge failed")) {
        errorMessage = 
          `❌ Bridge Failed:\n\n` +
          `${errorMessage}\n\n` +
          `Possible causes:\n` +
          `- Token not supported on target chain\n` +
          `- Insufficient balance\n` +
          `- Network issues\n\n` +
          `Try creating on Sepolia instead or check your token balance.`;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const transferCapsuleOwnership = async (id: number, newOwner: string) => {
    if (!capsule || !account) return alert("Connect wallet first!");
    try {
      setIsLoading(true);
      const tx = await capsule.transferCapsuleOwnership(id, newOwner);
      await tx.wait();
      alert("✅ Capsule ownership transferred");
    } catch (err: any) {
      console.error(err);
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawCapsule = async (id: number) => {
    if (!capsule || !pyusd || !account) return alert("Connect wallet first!");
    
    try {
      setIsLoading(true);
      
      // Check balance before withdrawal
      const balanceBefore = await pyusd.balanceOf(account);
      console.log("Balance before withdrawal:", ethers.formatEther(balanceBefore));
      
      // Get capsule details to verify amount
      const capsuleData = await capsule.getCapsule(id);
      const expectedAmount = BigInt(capsuleData.amount.toString());
      
      // Execute withdrawal
      const tx = await capsule.openCapsule(id);
      const receipt = await tx.wait();
      console.log("Withdrawal transaction:", receipt.hash);
      
      // Wait a moment for balance to update
      await delay(1000);
      
      // Verify balance after withdrawal
      const balanceAfter = await pyusd.balanceOf(account);
      console.log("Balance after withdrawal:", ethers.formatEther(balanceAfter));
      
      const received = balanceAfter - balanceBefore;
      
      if (received >= expectedAmount) {
        alert(`✅ Capsule withdrawn successfully! You received ${ethers.formatEther(received)} PYUSD`);
      } else {
        alert(`⚠️ Capsule opened but token balance didn't increase as expected. Check transaction: ${receipt.hash}`);
      }
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      if (err.message?.includes("Capsule locked")) {
        alert("❌ Capsule is still locked. Wait until the unlock time.");
      } else if (err.message?.includes("Not capsule owner")) {
        alert("❌ You are not the owner of this capsule.");
      } else if (err.message?.includes("already opened")) {
        alert("❌ This capsule has already been opened.");
      } else {
        alert(`Withdraw failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawCapsuleCrossChain = async (id: number, targetChainId: number) => {
    if (!capsule || !account) return alert("Connect wallet first!");
    try {
      setIsLoading(true);
      const capsuleAddress = await capsule.getAddress();
      const toChainId = targetChainId as SUPPORTED_CHAINS_IDS;
      // For withdrawal, no asset bridging is needed; execute the call on destination chain
      await executeOnChain(
        capsuleAddress,
        timeCapsuleABI,
        "openCapsule",
        [id],
        toChainId
      );
      alert("✅ Cross-chain withdrawal initiated! Check wallet/SDK status.");
    } catch (err: any) {
      console.error(err);
      alert(
        `❌ Cross-chain withdraw failed! Details: ${
          err.message || "Ensure SDK is initialized and you have gas."
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
        transferCapsuleOwnership,
        withdrawCapsule,
        withdrawCapsuleCrossChain,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => useContext(ContractContext);