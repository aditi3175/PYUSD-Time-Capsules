⏳ PYUSD Time Capsule: Cross-Chain Digital Endowment

Status: ETHOnline 2025 Submission
Built for: Avail Nexus, PayPal USD (PYUSD), and Hardhat 3 Bounties

🚀 Project Overview

The PYUSD Time Capsule is a decentralized application that redefines digital payments and long-term savings by leveraging Chain Abstraction. It allows a user to lock a specific amount of PYUSD (and an optional private message/file hash) on a future date, and seamlessly deploy that logic onto any EVM chain—all in a single, simple transaction.

The Problem Solved

Traditional Web3 requires complex, multi-step user experience for cross-chain actions:

Connect to Source Chain (e.g., Sepolia).

Switch to Bridge dApp.

Bridge Token to Target Chain (e.g., Optimism).

Switch Wallet Network to Target Chain.

Execute Smart Contract.

The PYUSD Time Capsule eliminates all these friction points. The user simply selects the destination chain, and the transaction is handled instantly.

The Solution: One-Click Cross-Chain Execution

Our application uses the Avail Nexus SDK's Bridge & Execute functionality to perform the entire atomic operation:

User Action: Connects to Sepolia (Source Chain) and clicks "Bridge & Create Capsule" for Optimism (Target Chain).

Nexus Action: Automatically handles the logic to bridge the PYUSD (or proxy token like USDC) from Sepolia to Optimism, and then atomically executes the createCapsule function on Optimism.

The user never leaves Sepolia or switches wallets—a truly unchained experience.

✨ Compliance & Features

1. 🌊 Avail Nexus SDK (Bridge & Execute)

Our project is a core example of Chain Abstraction, directly meeting the General and DeFi Track requirements:

Meaningful Use: We use the Nexus Core SDK (initNexus, executeCrossChain) for headless, low-level transaction orchestration.

Cross-Chain Intent: The createCapsuleCrossChain function serves as the demonstration of a cross-chain intent, using the PYUSD amount as the liquidity to be moved.

Bonus Point Secured (Bridge & Execute): The application relies entirely on the sdk.bridgeAndExecute() flow (wrapped by our executeCrossChain function) to simultaneously move assets and deploy the timed lock logic.

2. 🐳 PayPal USD (PYUSD) Application

The PYUSD Time Capsule utilizes the stable and regulated nature of PYUSD for a novel financial primitive, strongly qualifying for the Grand Prize and Consumer Champion tracks:

Utilization: PYUSD is the core asset locked within the smart contract. (Deployed on Sepolia Testnet).

Payments Applicability: It transforms PYUSD into a Future-Dated Payment/Digital Endowment. This addresses real-world use cases like:

Structured Savings: Forcing yourself to save funds until a future date.

Digital Gifting: Sending a PYUSD fund that unlocks on a birthday or graduation, regardless of the recipient's home chain.

Novelty & UX: The combination of an immediate file hash lock and a time-gated stablecoin release creates an innovative, consumer-friendly product.

3. 👷 Hardhat 3 Tooling

The smart contract deployment and testing environment uses the latest tooling:

Version Used: Hardhat version 3.0.9.

Tooling: We leverage @nomicfoundation/hardhat-ignition for modern deployment and @nomicfoundation/hardhat-toolbox for robust testing against our TimeCapsule.sol contract.

🛠️ Tech Stack

Frontend: React, TypeScript (TSX), Tailwind CSS

Web3 Integration: Ethers v6, MetaMask/EIP-1193

Interoperability: Avail Nexus Core SDK (@avail-project/nexus-core)

Solidity/Tooling: Hardhat v3.x, Solidity v0.8.24

⚙️ Setup and Installation

Prerequisites

Node.js (v18+)

Yarn or npm

MetaMask installed and configured for Sepolia Testnet (Chain ID: 11155111).

Quick Start (Frontend)

Clone the repository:

git clone [YOUR_REPO_URL]
cd pyusd-capsule


Install dependencies:

npm install


Run the application:

npm run dev


(The application runs locally and connects to Sepolia/Avail Nexus.)

Quick Start (Smart Contracts)

Ensure you have Hardhat v3.0.9+ installed (verified via package.json).

Compile contracts:

npx hardhat compile


Main contract logic deployed on the source chain (Sepolia).

Note: This project demonstrates cross-chain functionality. Ensure your MetaMask wallet is connected to Sepolia (Chain ID 11155111) to begin the cross-chain transaction flow.