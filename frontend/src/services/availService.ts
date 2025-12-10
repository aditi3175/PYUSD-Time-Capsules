import { NexusSDK } from "@avail-project/nexus-core";
import type {
  ExecuteParams,
  ExecuteResult,
  BridgeAndExecuteParams,
  BridgeAndExecuteResult,
  SUPPORTED_CHAINS_IDS,
  SUPPORTED_TOKENS,
} from "@avail-project/nexus-core";

let sdk: NexusSDK | null = null;
let isInitializing = false;
let initializationPromise: Promise<NexusSDK> | null = null;

// Valid tokens supported by Nexus SDK for bridging
const VALID_BRIDGE_TOKENS: string[] = ["ETH", "USDC", "USDT"];

/**
 * Initialize Nexus SDK with the EIP-1193 provider (window.ethereum)
 * * @param evmProvider The EIP-1193 provider object (window.ethereum)
 */
export const initNexus = async (evmProvider: any) => {
  if (!evmProvider)
    throw new Error("EIP-1193 provider (window.ethereum) is required");

  // If SDK is already initialized, return it
  if (sdk) {
    console.log("✅ Nexus SDK already initialized, reusing instance");
    return sdk;
  }

  // If initialization is in progress, wait for it
  if (isInitializing && initializationPromise) {
    console.log("⏳ Nexus SDK initialization already in progress, waiting...");
    return await initializationPromise;
  }

  // Start new initialization
  isInitializing = true;
  initializationPromise = (async () => {
    try {
      // Initialize SDK
      sdk = new NexusSDK({ network: "testnet" });
      (sdk as any)._setEVMProvider(evmProvider);

      // Initialize the SDK with the provider, which handles setting up the wallet client.
      await sdk.initialize(evmProvider);

      // Setup hooks immediately after initialization
      setupIntentHook();
      setupAllowanceHook();

      console.log("✅ Nexus SDK initialized successfully");
      return sdk;
    } catch (error) {
      console.error("❌ Failed to initialize Nexus SDK:", error);
      // Reset state on error so we can retry
      sdk = null;
      throw error;
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
};

/**
 * Setup Intent Hook
 */
export const setupIntentHook = () => {
  if (!sdk) throw new Error("SDK not initialized");

  sdk.setOnIntentHook(({ intent, allow }) => {
    console.log("🪄 Intent received:", intent);
    allow();
  });
};

/**
 * Setup Allowance Hook
 */
export const setupAllowanceHook = () => {
  if (!sdk) throw new Error("SDK not initialized");

  sdk.setOnAllowanceHook(({ allow, sources }) => {
    console.log("💰 Allowances needed:", sources?.length || 0);
    // Allow for the minimum required sources
    allow(["min"]);
  });
};

/**
 * Execute on-chain smart contract call
 */
export const executeOnChain = async (
  contractAddress: string,
  contractAbi: any,
  functionName: string,
  functionParams: any[],
  chainId: SUPPORTED_CHAINS_IDS,
  value?: string
): Promise<ExecuteResult> => {
  if (!sdk) throw new Error("SDK not initialized");

  try {
    const params: ExecuteParams = {
      contractAddress,
      contractAbi,
      functionName,
      buildFunctionParams: () => ({ functionParams }),
      toChainId: chainId,
      value: value || "0",
    };

    console.log("🚀 Executing transaction...");
    const result = await sdk.execute(params);
    console.log(
      "✅ Transaction executed successfully:",
      result.transactionHash
    );
    return result;
  } catch (error) {
    console.error("❌ Transaction execution failed:", error);
    throw error;
  }
};

/**
 * Execute cross-chain smart contract call
 */
export const executeCrossChain = async (
  contractAddress: string,
  contractAbi: any,
  functionName: string,
  functionParams: any[],
  toChainId: SUPPORTED_CHAINS_IDS,
  token: SUPPORTED_TOKENS,
  amount: string,
  value?: string
): Promise<BridgeAndExecuteResult> => {
  if (!sdk) throw new Error("SDK not initialized");

  // Validate token is supported for bridging
  const tokenUpper = String(token).toUpperCase();
  if (!VALID_BRIDGE_TOKENS.includes(tokenUpper)) {
    throw new Error(
      `Token "${token}" is not supported for cross-chain bridging. ` +
      `Nexus SDK only supports: ${VALID_BRIDGE_TOKENS.join(", ")}. ` +
      `Please use one of these supported tokens.`
    );
  }

  try {
    const params: BridgeAndExecuteParams = {
      token,
      amount,
      toChainId,
      execute: {
        contractAddress,
        contractAbi,
        functionName,
        buildFunctionParams: () => ({ functionParams }),
        value: value || "0",
      },
    };

    console.log(
      `🌉 Executing bridge and execute transaction to ${toChainId}...`
    );
    const result = await sdk.bridgeAndExecute(params);
    
    // Log full result to debug structure
    console.log("📦 Full bridgeAndExecute result:", result);
    
    // Check if the operation was successful
    if ((result as any).success === false) {
      const errorMsg = (result as any).error || "Unknown bridge error";
      console.error("❌ Bridge operation failed:", errorMsg);
      
      // Provide specific error messages for common issues
      if (errorMsg.includes("Token") || errorMsg.includes("token")) {
        throw new Error(
          `Token "${token}" is not supported for bridging to chain ${toChainId}. ` +
          `Nexus SDK only supports: ETH, USDC, or USDT. ` +
          `Please use one of these supported tokens for cross-chain operations.`
        );
      }
      
      throw new Error(`Bridge failed: ${errorMsg}`);
    }
    
    // Handle different possible result structures
    const transactionHash = result.executeTransactionHash || 
                           (result as any).transactionHash || 
                           (result as any).hash ||
                           (result as any).executeTxHash ||
                           (result as any).txHash;
    
    if (transactionHash) {
      console.log(
        "✅ Cross-chain transaction executed successfully. Transaction hash:",
        transactionHash
      );
    } else if ((result as any).success !== false) {
      // Only warn if it's not a failure case (which we already handled above)
      console.warn(
        "⚠️ Cross-chain transaction executed but transaction hash not found in result:",
        result
      );
    }
    
    return result;
  } catch (error) {
    console.error("❌ Cross-chain execution failed:", error);
    throw error;
  }
};

/**
 * Get SDK instance
 */
export const getSdk = () => {
  if (!sdk) throw new Error("SDK not initialized");
  return sdk;
};

