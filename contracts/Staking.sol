// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Staking dengan epoch-based reward decay.
/// - rewardPerSecond (scaled 1e18) turun tiap epoch
/// - accrual per-user, jadi perubahan rate tidak merusak reward historis
contract SimpleEpochStaking {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                              TOKEN & STATE
    //////////////////////////////////////////////////////////////*/
    IERC20 public immutable stakingToken;

    // jumlah token per detik per 1 token staked (scaled 1e18)
    uint256 public rewardPerSecond; // contoh awal: 1e14 = 0.0001 token / token / detik

    // Epoch config
    uint256 public constant EPOCH_DURATION = 7 days;    // ubah kalau mau
    uint256 public constant DECAY_BPS      = 5000;      // 50% (basis 10000)
    uint256 public constant BPS_DENOM      = 10000;

    uint256 public currentEpoch;
    uint256 public lastEpochUpdate; // timestamp anchor

    // user accounting
    mapping(address => uint256) public staked;         // jumlah token yang distake pengguna
    mapping(address => uint256) public lastUpdate;     // timestamp accrual terakhir per user
    mapping(address => uint256) public accruedReward;  // reward tersimpan (belum di-claim)

    /*//////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount);
    event EpochAdvanced(uint256 indexed newEpoch, uint256 newRewardPerSecond);

    /*//////////////////////////////////////////////////////////////
                                CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    /// @param _token address token ERC20 yang di-stake
    /// @param _initialRewardPerSecond nilai awal rewardPerSecond (scaled 1e18)
    constructor(address _token, uint256 _initialRewardPerSecond) {
        require(_token != address(0), "ZERO_TOKEN");
        stakingToken = IERC20(_token);
        rewardPerSecond = _initialRewardPerSecond;
        lastEpochUpdate = block.timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                              INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/
    // Turunkan rewardPerSecond sesuai jumlah epoch yang lewat, EPOCH(cycle)
    function updateEpoch() internal {
        if (block.timestamp < lastEpochUpdate + EPOCH_DURATION) return;d // check condtion

        uint256 epochsPassed = (block.timestamp - lastEpochUpdate) / EPOCH_DURATION;
        // advance anchor tepat ke batas epoch terakhir supaya deterministik
        lastEpochUpdate += epochsPassed * EPOCH_DURATION;

        // decay bertahap per epoch (step halving 50% default)
        for (uint256 i = 0; i < epochsPassed; i++) {
            rewardPerSecond = (rewardPerSecond * DECAY_BPS) / BPS_DENOM;
            currentEpoch += 1;
        }
        emit EpochAdvanced(currentEpoch, rewardPerSecond);
    }

    // Hitung dan simpan reward user sampai sekarang pakai rate saat-itu
    function _accrue(address user) internal {
        uint256 lu = lastUpdate[user];
        if (lu == 0) {
            // first touch, set baseline
            lastUpdate[user] = block.timestamp;
            return;
        }
        uint256 bal = staked[user];
        if (bal == 0) {
            lastUpdate[user] = block.timestamp;
            return;
        }
        uint256 dt = block.timestamp - lu;
        if (dt > 0) {
            // reward = staked * rps * dt / 1e18
            uint256 add = (bal * rewardPerSecond * dt) / 1e18;
            accruedReward[user] += add;
            lastUpdate[user] = block.timestamp;
        }
    }

    /*//////////////////////////////////////////////////////////////
                                USER ACTIONS
    //////////////////////////////////////////////////////////////*/
    function stake(uint256 amount) external {
        require(amount > 0, "ZERO_AMOUNT");
        updateEpoch();
        _accrue(msg.sender);

        staked[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // set timestamp kalau pertama kali
        if (lastUpdate[msg.sender] == 0) lastUpdate[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "ZERO_AMOUNT");
        require(staked[msg.sender] >= amount, "NOT_ENOUGH_STAKE");

        updateEpoch();
        _accrue(msg.sender);

        staked[msg.sender] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    // claim semua reward yang sudah terakumulasi
    function claim() public {
        updateEpoch();
        _accrue(msg.sender);

        uint256 r = accruedReward[msg.sender];
        require(r > 0, "NO_REWARD");
        accruedReward[msg.sender] = 0;
        stakingToken.safeTransfer(msg.sender, r);
        emit Claimed(msg.sender, r);
    }

    // convenience: unstake semua + claim sekali jalan
    function exit() external {
        updateEpoch();
        _accrue(msg.sender);

        uint256 principal = staked[msg.sender];
        uint256 r = accruedReward[msg.sender];

        require(principal > 0 || r > 0, "NOTHING_TO_EXIT");

        staked[msg.sender] = 0;
        accruedReward[msg.sender] = 0;

        if (principal > 0) stakingToken.safeTransfer(msg.sender, principal);
        if (r > 0)        stakingToken.safeTransfer(msg.sender, r);

        emit Unstaked(msg.sender, principal);
        if (r > 0) emit Claimed(msg.sender, r);
    }

    /*/////////////////////////////////////////
                               VIEW HELPERS
////////////////////*/
    // preview reward up-to-now tanpa mengubah state
    function pendingReward(address user) external view returns (uint256) {
        uint256 lu = lastUpdate[user];
        uint256 extra;
        if (lu != 0 && staked[user] > 0) {
            uint256 dt = block.timestamp - lu;
            extra = (staked[user] * rewardPerSecond * dt) / 1e18;
        }
        return accruedReward[user] + extra;
    }
}
