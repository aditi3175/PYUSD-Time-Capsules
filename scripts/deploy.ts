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
