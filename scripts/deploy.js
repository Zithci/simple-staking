require("dotenv").config();

async function main() {
  // Debug
  console.log("RPC URL:", process.env.SEPOLIA_RPC_URL);
  console.log("Private key exists:", !!process.env.PRIVATE_KEY);
  console.log("Private key format OK:", process.env.PRIVATE_KEY?.startsWith("0x"));
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");
  
  console.log("Deploying MockERC20...");
  const Token = await ethers.getContractFactory("MockERC20");
  const token = await Token.deploy("Stake Token", "STK", 18);
  await token.deployed();
  console.log("✓ Token deployed:", token.address);
  
  console.log("\nDeploying SimpleEpochStaking...");
  const initialRewardPerSecond = ethers.utils.parseUnits("0.0001", 18);
  const Staking = await ethers.getContractFactory("SimpleEpochStaking");
  const staking = await Staking.deploy(token.address, initialRewardPerSecond);
  await staking.deployed();
  console.log("✓ Staking deployed:", staking.address);
  
  console.log("\n=== Deployment Complete ===");
  console.log("Token:", token.address);
  console.log("Staking:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });