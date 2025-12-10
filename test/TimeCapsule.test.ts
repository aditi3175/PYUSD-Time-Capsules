import { expect } from "chai";
import { network } from "hardhat";

describe("TimeCapsule", function () {
  it("creates and opens a capsule", async function () {
    const { ethers } = await network.connect({ network: "hardhat", chainType: "l1" });
    const [owner, user] = await ethers.getSigners();

    const MockPYUSD = await ethers.getContractFactory("MockPYUSD");
    const pyusd = await MockPYUSD.deploy();
    await pyusd.waitForDeployment();

    const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
    const capsule = await TimeCapsule.deploy(await pyusd.getAddress());
    await capsule.waitForDeployment();

    // Mint to user and approve
    const mintAmount = 1000n * 10n ** 18n;
    await (await pyusd.mint(user.address, mintAmount)).wait();
    const approveAmount = 100n * 10n ** 18n;

    const capsuleAsUser = capsule.connect(user);
    const pyusdAsUser = pyusd.connect(user);

    await (await pyusdAsUser.approve(await capsule.getAddress(), approveAmount)).wait();

    const now = Math.floor(Date.now() / 1000);
    const unlockTime = now + 60; // 1 minute

    await (await capsuleAsUser.createCapsule(
      approveAmount,
      "hello",
      "hash",
      unlockTime
    )).wait();

    const id = await capsule.capsuleCount();
    const stored = await capsule.getCapsule(id);
    expect(stored.owner).to.equal(user.address);
    expect(stored.amount).to.equal(approveAmount);
    expect(stored.opened).to.equal(false);

    // too early
    await expect(capsuleAsUser.openCapsule(id)).to.be.rejectedWith(
      "Capsule locked until unlock time"
    );

    // advance time and open
    await ethers.provider.send("evm_setNextBlockTimestamp", [unlockTime + 1]);
    await ethers.provider.send("evm_mine", []);

    const balBefore = await pyusd.balanceOf(user.address);
    await (await capsuleAsUser.openCapsule(id)).wait();
    const balAfter = await pyusd.balanceOf(user.address);
    expect(balAfter - balBefore).to.equal(approveAmount);

    const after = await capsule.getCapsule(id);
    expect(after.opened).to.equal(true);
  });

  it("owner cannot emergencyWithdraw escrow token", async function () {
    const { ethers } = await network.connect({ network: "hardhat", chainType: "l1" });
    const [owner] = await ethers.getSigners();

    const MockPYUSD = await ethers.getContractFactory("MockPYUSD");
    const pyusd = await MockPYUSD.deploy();
    await pyusd.waitForDeployment();

    const TimeCapsule = await ethers.getContractFactory("TimeCapsule");
    const capsule = await TimeCapsule.deploy(await pyusd.getAddress());
    await capsule.waitForDeployment();

    await expect(
      capsule.emergencyWithdraw(await pyusd.getAddress(), 1)
    ).to.be.rejectedWith("Cannot withdraw escrow token");
  });
});


