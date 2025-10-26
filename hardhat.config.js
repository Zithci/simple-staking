require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/7f22376b533b46c7a3f16a63bda9a42f", // Hardcode dulu
      accounts: ["0x7897943207f9766a1b42741f9369985fb9082c012689935379b9cd778e1335e4"], // Paste private key langsung (TEMPORARY)
    },
  },
};