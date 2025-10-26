// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts...");

  // 1️⃣ Deploy MockERC20
  const Token = await ethers.getContractFactory("MockERC20");
  const token = await Token.deploy("Mock Token", "MOCK", 18);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ MockERC20 deployed to:", tokenAddress);

  // 2️⃣ Deploy SimpleStaking
  const Staking = await ethers.getContractFactory("SimpleStaking");
  const staking = await Staking.deploy(tokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ SimpleStaking deployed to:", stakingAddress);

  // 3️⃣ (optional) transfer initial tokens ke staking contract
  const mintTx = await token.mint(stakingAddress, ethers.parseUnits("100000", 18));
  await mintTx.wait();
  console.log("💰 Minted 100000 MOCK to staking contract");

  console.log("\n🎯 Deployment complete!");
  console.log("Mock Token:", tokenAddress);
  console.log("Simple Staking:", stakingAddress);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
