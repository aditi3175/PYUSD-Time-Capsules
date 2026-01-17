import React, { createContext, useContext, useState, useRef } from "react";
import { ethers } from "ethers";
import { pyusdABI, timeCapsuleABI } from "../utils/contractABI";
import {
  initNexus,
  executeCrossChain,
  executeOnChain,
} from "../services/availService";
import type { SUPPORTED_CHAINS_IDS } from "@avail-project/nexus-core";

/* -------------------------------------------------- */
/* ENV + CONSTANTS                                    */
/* -------------------------------------------------- */

declare global {
  interface Window {
    ethereum?: any;
  }
}

const PYUSD_ADDRESS = import.meta.env.VITE_PYUSD_ADDRESS;
const TIME_CAPSULE_ADDRESS = import.meta.env.VITE_TIME_CAPSULE_ADDRESS;
const NEXUS_ROUTER_ADDRESS = import.meta.env.VITE_NEXUS_ROUTER_ADDRESS;

const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111

const TOKEN_ADDRESSES: Record<string, string> = {
  USDC:
    import.meta.env.VITE_USDC_ADDRESS ||
    "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
  USDT:
    import.meta.env.VITE_USDT_ADDRESS ||
    "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
};

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------- */
/* CONTEXT TYPES                                      */
/* -------------------------------------------------- */

interface ContractContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  pyusd: ethers.Contract | null;
  capsule: ethers.Contract | null;
  isLoading: boolean;

  connectWallet(): Promise<void>;
  disconnectWallet(): Promise<void>;

  mintTokens(amount: bigint): Promise<void>;
  createCapsule(
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number,
  ): Promise<void>;

  createCapsuleCrossChain(
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number,
    targetChainId: number,
    tokenSymbol: string,
  ): Promise<void>;

  withdrawCapsule(id: number): Promise<void>;
  withdrawCapsuleCrossChain(id: number, targetChainId: number): Promise<void>;
}

/* -------------------------------------------------- */
/* CONTEXT SETUP                                      */
/* -------------------------------------------------- */

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

  const sdkInitialized = useRef(false);

  /* -------------------------------------------------- */
  /* WALLET CONNECT (USER ACTION ONLY)                   */
  /* -------------------------------------------------- */

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected");
      return;
    }

    try {
      setIsLoading(true);

      const prov = new ethers.BrowserProvider(window.ethereum);

      const accounts = await prov.send("eth_requestAccounts", []);
      const chainId = await prov.send("eth_chainId", []);

      if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
        await prov.send("wallet_switchEthereumChain", [
          { chainId: SEPOLIA_CHAIN_ID_HEX },
        ]);
        await delay(600);
      }

      const signer = await prov.getSigner();

      setProvider(prov);
      setAccount(accounts[0]);

      setPyusd(new ethers.Contract(PYUSD_ADDRESS, pyusdABI, signer));
      setCapsule(
        new ethers.Contract(TIME_CAPSULE_ADDRESS, timeCapsuleABI, signer),
      );

      if (!sdkInitialized.current) {
        await initNexus(window.ethereum);
        sdkInitialized.current = true;
      }

      console.log("✅ Wallet connected:", accounts[0]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Wallet connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setAccount(null);
    setProvider(null);
    setPyusd(null);
    setCapsule(null);
    sdkInitialized.current = false;
  };

  /* -------------------------------------------------- */
  /* CORE FEATURES                                      */
  /* -------------------------------------------------- */

  const mintTokens = async (amount: bigint) => {
    if (!pyusd || !account) return;
    const tx = await pyusd.mint(account, amount);
    await tx.wait();
  };

  const createCapsule = async (
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number,
  ) => {
    if (!capsule || !pyusd || !account) return;

    const capsuleAddr = await capsule.getAddress();
    const allowance = await pyusd.allowance(account, capsuleAddr);

    if (allowance < amount) {
      const approveTx = await pyusd.approve(capsuleAddr, amount);
      await approveTx.wait();
    }

    const tx = await capsule.createCapsule(
      amount,
      message,
      fileHash,
      unlockTime,
    );
    await tx.wait();
  };

  /* -------------------------------------------------- */
  /* CROSS-CHAIN CREATE                                 */
  /* -------------------------------------------------- */

  const createCapsuleCrossChain = async (
    amount: bigint,
    message: string,
    fileHash: string,
    unlockTime: number,
    targetChainId: number,
    tokenSymbol: string,
  ) => {
    if (!provider || !account || !capsule) return;

    const token = tokenSymbol.toUpperCase();
    if (!["USDC", "USDT", "ETH"].includes(token)) {
      alert("Only USDC / USDT / ETH supported cross-chain");
      return;
    }

    const signer = await provider.getSigner();
    const tokenAddr = TOKEN_ADDRESSES[token];
    const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);

    const allowance = await tokenContract.allowance(
      account,
      NEXUS_ROUTER_ADDRESS,
    );

    if (allowance < amount) {
      const approveTx = await tokenContract.approve(
        NEXUS_ROUTER_ADDRESS,
        amount,
      );
      await approveTx.wait();
    }

    await executeCrossChain(
      await capsule.getAddress(),
      timeCapsuleABI,
      "createCapsule",
      [amount.toString(), message, fileHash, unlockTime],
      targetChainId as SUPPORTED_CHAINS_IDS,
      token as any,
      amount.toString(),
    );
  };

  /* -------------------------------------------------- */
  /* WITHDRAW                                           */
  /* -------------------------------------------------- */

  const withdrawCapsule = async (id: number) => {
    if (!capsule) return;
    const tx = await capsule.openCapsule(id);
    await tx.wait();
  };

  const withdrawCapsuleCrossChain = async (
    id: number,
    targetChainId: number,
  ) => {
    if (!capsule) return;

    await executeOnChain(
      await capsule.getAddress(),
      timeCapsuleABI,
      "openCapsule",
      [id],
      targetChainId as SUPPORTED_CHAINS_IDS,
    );
  };

  /* -------------------------------------------------- */
  /* PROVIDER                                           */
  /* -------------------------------------------------- */

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
        withdrawCapsule,
        withdrawCapsuleCrossChain,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => useContext(ContractContext);
