# Staking dApp

A decentralized staking application with epoch-based reward system and reward accrual mechanism.

## Features

- **Stake tokens** - Lock tokens to earn rewards
- **Epoch system** - Rewards halve every 7 days (similar to Bitcoin halving)
- **Per-user rewards** - Individual reward calculation and tracking
- **Exit function** - Unstake and claim rewards in one transaction
- **Testnet deployment** - Live on Sepolia

## Tech Stack

- **Smart Contracts:** Solidity
- **Frontend:** React
- **Web3 Library:** ethers.js
- **Network:** Ethereum Sepolia Testnet

## Core Mechanics

### Epoch System
- Rewards start at 1 token/second
- Every 7 days, rewards halve (1 → 0.5 → 0.25...)
- Prevents infinite inflation
- Total rewards capped at ~1.2M tokens

### Reward Accrual
- Each user has individual reward tracking
- Rewards calculated: `stakedAmount × rewardPerSecond × timeElapsed`
- Updates on every interaction (stake/unstake/claim)

## Functions

- `mint()` - Get test tokens
- `approve()` - Approve contract to spend tokens
- `stake(amount)` - Lock tokens and start earning
- `exit()` - Unstake tokens and claim rewards
- `updateEpoch()` - Update epoch if 7 days passed
- `fundContract()` - Add tokens to reward pool

## Getting Started

### Prerequisites
- MetaMask wallet
- Sepolia testnet ETH ([faucet](https://sepoliafaucet.com/))

### Installation
```bash
# Clone repo
git clone [your-repo-url]

# Install dependencies
npm install

# Run frontend
npm start
```

### Usage

1. Connect MetaMask to Sepolia testnet
2. Mint test tokens
3. Approve contract to spend tokens
4. Stake tokens
5. Wait and earn rewards
6. Exit to unstake and claim

## Contract Addresses (Sepolia)

- Staking Contract: `[your-contract-address]`
- Token Contract: `[your-token-address]`

## Learning Objectives

Built to understand:
- Staking mechanisms
- Epoch-based tokenomics
- Per-user reward accounting
- Gas optimization (exit = unstake + claim in one tx)
- Smart contract security patterns

## Status

✅ Core functionality working  
✅ Deployed to Sepolia testnet  
⏳ Additional features in progress  

## License

MIT

## Author

[BuildWithZith]

---

**Built as part of Web3 learning journey - Oct 2025**
