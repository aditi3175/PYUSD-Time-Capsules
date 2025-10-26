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

/**
 * Initialize Nexus SDK with the EIP-1193 provider (window.ethereum)
 * * @param evmProvider The EIP-1193 provider object (window.ethereum)
 */
export const initNexus = async (evmProvider: any) => {
  if (!evmProvider)
    throw new Error("EIP-1193 provider (window.ethereum) is required");

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
    throw error;
  }
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
    console.log(
      "✅ Cross-chain transaction executed:",
      result.executeTransactionHash
    );
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

