import { network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const { ethers } = await network.connect({
    network: "sepolia",
    chainType: "l1",
  });

  const [user] = await ethers.getSigners();
  console.log("👤 Using account:", user.address);
  console.log(
    "💰 ETH balance:",
    (await ethers.provider.getBalance(user.address)).toString()
  );

  // ----------------- Load from .env -----------------
  const pyusdAddress = process.env.PYUSD_ADDRESS!;
  const capsuleAddress = process.env.TIME_CAPSULE_ADDRESS!;

  if (!pyusdAddress || !capsuleAddress) {
    throw new Error(
      "❌ Missing addresses in .env — please set PYUSD_ADDRESS and TIME_CAPSULE_ADDRESS"
    );
  }

  console.log("\n🔗 Using existing deployed contracts:");
  console.log("MockPYUSD:", pyusdAddress);
  console.log("TimeCapsule:", capsuleAddress);

  // ----------------- Connect to contracts -----------------
  const pyusd = await ethers.getContractAt("MockPYUSD", pyusdAddress);
  const capsule = await ethers.getContractAt("TimeCapsule", capsuleAddress);

  // ----------------- Mint tokens -----------------
  const mintAmount = 1000n * 10n ** 18n;
  console.log(
    `\n🪙 Minting ${ethers.formatEther(mintAmount)} mPYUSD to ${
      user.address
    }...`
  );
  const mintTx = await pyusd.mint(user.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Mint successful! Tx hash:", mintTx.hash);

  // ----------------- Approve TimeCapsule -----------------
  const approveAmount = 100n * 10n ** 18n;
  console.log(
    `\n✍️ Approving ${ethers.formatEther(
      approveAmount
    )} mPYUSD for TimeCapsule...`
  );
  const approveTx = await pyusd.approve(capsuleAddress, approveAmount);
  await approveTx.wait();
  console.log("✅ Approval successful! Tx hash:", approveTx.hash);

  // ----------------- Create Capsule -----------------
  const unlockTime = Math.floor(Date.now() / 1000) + 60; // 1 min from now
  console.log(`\n📦 Creating a time capsule (unlocks in 60 seconds)...`);
  const createTx = await capsule.createCapsule(
    approveAmount,
    "Hello future Aditi!",
    "QmExampleHash123456789",
    unlockTime
  );
  await createTx.wait();
  console.log("✅ Capsule created successfully! Tx hash:", createTx.hash);

  // ----------------- Fetch Capsule Details -----------------
  const capsuleId = await capsule.capsuleCount();
  const capsuleData = await capsule.getCapsule(capsuleId);

  console.log("\n📋 Capsule Details:");
  console.log("=========================");
  console.log("ID:", capsuleId.toString());
  console.log("Owner:", capsuleData.owner);
  console.log("Amount:", ethers.formatEther(capsuleData.amount), "mPYUSD");
  console.log("Message:", capsuleData.message);
  console.log("File Hash:", capsuleData.fileHash);
  console.log(
    "Unlock Time:",
    new Date(Number(capsuleData.unlockTime) * 1000).toLocaleString()
  );
  console.log("Opened:", capsuleData.opened);
  console.log("=========================");

  // ----------------- Done -----------------
  console.log("\n✅ All interactions completed successfully!");
  console.log(
    `💡 Wait 60 seconds, then you can open the capsule:\n   await capsule.openCapsule(${capsuleId})`
  );
}

main().catch((err) => {
  console.error("\n❌ Interaction failed:");
  console.error(err);
  process.exitCode = 1;
});
