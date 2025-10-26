📝 Developer Feedback for Avail Nexus SDK (ETHOnline 2025)

Project: PYUSD Time Capsules (A Cross-Chain Future-Dated Transfer/Lock Protocol)
Integration: nexus-core (Headless SDK) for Bridge & Execute functionality.

Overall, the core concept of chain abstraction provided by the Avail Nexus SDK is powerful and significantly simplifies cross-chain UX. Once the correct parameter structure was identified, the sdk.bridgeAndExecute() method was clean and intuitive.

However, during the implementation phase of building a modular TypeScript/React application, we encountered several friction points related to type visibility and tooling integration.

1. Type Visibility and Parameter Structuring

The single most confusing aspect was determining the correct TypeScript signature for cross-chain execution.

Problem A: ExecuteParams vs. BridgeAndExecuteParams

When trying to implement cross-chain execution (executeCrossChain), initial attempts failed because the local type definition for ExecuteParams does not accept the fromChainId parameter, even though this is logically required for a cross-chain view.

Recommendation:

API Naming: If the SDK uses one function (sdk.execute), the documentation/types should clearly illustrate that the presence of certain parameters (like token and amount when calling bridgeAndExecute) changes the expected type signature from ExecuteParams to BridgeAndExecuteParams.

Documentation: The API Reference should clearly show the full, required interface for BridgeAndExecuteParams (including the required nested execute object) right next to the ExecuteParams interface to prevent developers from incorrectly trying to merge the two.

Problem B: Strict Token Typing

The BridgeAndExecuteParams.token property requires a union type (SUPPORTED_TOKENS: "ETH" | "USDC" | "USDT"), which is correct for safety, but this type (SUPPORTED_TOKENS) was not imported in our initial files.

Recommendation:

Export Everything: Ensure all required helper types (like SUPPORTED_TOKENS) are explicitly and easily exportable from @avail-project/nexus-core.

Documentation: Highlight the strict typing requirements for token symbols in the parameters section of the documentation.

2. Environment and Tooling Integration (TypeScript/Ethers)

Building modular TypeScript applications presented two significant challenges that required workarounds:

Problem A: Local File Imports

The development environment struggled to resolve local file imports (e.g., import { useContracts } from "../context/ContractContext.tsx"), which forced us to co-locate mocks and logic into a single file. While this is an environment limitation, clear documentation that recommends either:

A single, consolidated file structure for hackathons.

Explicit instructions on mocking dependencies when files rely on each other (e.g., how to correctly mock a complex Ethers v6/v7 provider class).

Problem B: Ethers Provider Initialization

We encountered an error where the ethers.BrowserProvider mock lacked a construct signature, failing when instantiated with new. This highlights a slight complexity when integrating with Ethers v6+ types, which are sometimes difficult to mock as classes for TypeScript compliance.

Recommendation:

Provide a definitive, modern TypeScript code snippet (using Ethers v6/v7) showing the recommended structure for initializing the SDK and setting up the signer and provider, perhaps with a clear wrapper function that handles error checking for window.ethereum.

3. Feedback Summary

The developer experience is excellent once the correct parameters are known. The bridgeAndExecute feature is incredibly powerful. Focus on improving the discoverability of the exact type definitions needed for cross-chain actions and providing robust TypeScript examples for modern Ethers integration to reduce the initial setup friction.

I hope this detailed feedback helps the Avail Nexus team improve their documentation! Let me know if you need any other files reviewed or assistance with your project.