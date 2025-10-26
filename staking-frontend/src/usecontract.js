import { ethers } from "ethers";
import tokenAbi from "./abis/MockERC20.json";
import stakingAbi from "./abis/SimpleEpochStaking.json";
import { TOKEN_ADDRESS, STAKING_ADDRESS } from "./config.js";

export async function getContracts() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner(); // wajib pakai await

  //chcek network - if not localhost, set warning to user
  const network = await provider.getNetwork();
  console.log("Connected To Network",network.chainId);

  const token = new ethers.Contract(TOKEN_ADDRESS, tokenAbi.abi, signer);
  const staking = new ethers.Contract(STAKING_ADDRESS, stakingAbi.abi, signer);
  console.log("staking runner:", staking.runner);

  return { token, staking };
}
