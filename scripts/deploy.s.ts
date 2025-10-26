
// import { network } from "hardhat";
// import type { Contract } from "ethers";

// async function main() {
//   // Connect to Hardhat network
//   const { ethers } = await network.connect({
//     network: "sepolia", // or "hardhatMainnet" if you prefer
//     chainType: "l1",
//   });

//   const [deployer] = await ethers.getSigners();
//   console.log("Deploying contracts with account:", deployer.address);
//   console.log(
//     "Account balance:",
//     (await ethers.provider.getBalance(deployer.address)).toString()
//   );

//   // Deploy MockPYUSD
//   console.log("\n📝 Deploying MockPYUSD...");
//   const MockPYUSDFactory = await ethers.getContractFactory("MockPYUSD");
//   const pyusd = await MockPYUSDFactory.deploy();
//   await pyusd.waitForDeployment();
//   const pyusdAddress = await pyusd.getAddress();
//   console.log("✅ MockPYUSD deployed to:", pyusdAddress);

//   // Deploy TimeCapsule
//   console.log("\n📝 Deploying TimeCapsule...");
//   const TimeCapsuleFactory = await ethers.getContractFactory("TimeCapsule");
//   const capsule = await TimeCapsuleFactory.deploy(pyusdAddress);
//   await capsule.waitForDeployment();
//   const capsuleAddress = await capsule.getAddress();
//   console.log("✅ TimeCapsule deployed to:", capsuleAddress);

//   // Verify deployments
//   console.log("\n🔍 Verifying deployments...");
//   const pyusdCode = await ethers.provider.getCode(pyusdAddress);
//   const capsuleCode = await ethers.provider.getCode(capsuleAddress);

//   if (pyusdCode !== "0x" && capsuleCode !== "0x") {
//     console.log("✅ Both contracts verified successfully");
//   } else {
//     console.error("❌ Deployment verification failed");
//     process.exitCode = 1;
//     return;
//   }

//   // Save deployment addresses
//   console.log("\n📋 Deployment Summary:");
//   console.log("====================");
//   console.log("MockPYUSD:", pyusdAddress);
//   console.log("TimeCapsule:", capsuleAddress);
//   console.log("====================");
//   console.log("\n✅ Deployment complete!");
// }

// main().catch((err) => {
//   console.error("\n❌ Deployment failed:");
//   console.error(err);
//   process.exitCode = 1;
// });

import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying from:", deployer.address);
  console.log(
    "💰 Balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  console.log("\n🪙 Deploying MockPYUSD...");
  const MockPYUSDFactory = await ethers.getContractFactory("MockPYUSD");
  const pyusd = await MockPYUSDFactory.deploy();
  await pyusd.waitForDeployment();
  const pyusdAddress = await pyusd.getAddress();
  console.log("✅ MockPYUSD at:", pyusdAddress);

  console.log("\n⏳ Deploying TimeCapsule...");
  const TimeCapsuleFactory = await ethers.getContractFactory("TimeCapsule");
  const capsule = await TimeCapsuleFactory.deploy(pyusdAddress);
  await capsule.waitForDeployment();
  const capsuleAddress = await capsule.getAddress();
  console.log("✅ TimeCapsule at:", capsuleAddress);

  console.log("\n📋 Summary:");
  console.log("MockPYUSD:", pyusdAddress);
  console.log("TimeCapsule:", capsuleAddress);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
