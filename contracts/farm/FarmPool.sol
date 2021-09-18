pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20WithMint is IERC20 {
    function mint(address to, uint256 value) external returns (bool);
}

// FarmPool is the master of Spruce. He can make Spruce and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once SPRUCE is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract FarmPool is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for IERC20WithMint;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of SPRUCEs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accSprucePerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accSprucePerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. SPRUCEs to distribute per block.
        uint256 lastRewardBlock;  // Last block number that SPRUCEs distribution occurs.
        uint256 accSprucePerShare; // Accumulated SPRUCEs per share, times 1e12. See below.
    }

    // The SPRUCE TOKEN!
    IERC20WithMint public token;
    // Dev address.
    address public devaddr;
    // SPRUCE tokens created per block.
    uint256 public sprucePerBlock;
    // Bonus muliplier for early spruce makers.
    uint256 public BONUS_MULTIPLIER = 1;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Total amount of deposited token
    mapping (uint256 => uint256) public poolLpSupply;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when SPRUCE mining starts.
    uint256 public startBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event UpdateMultiplier(uint256 multiplierNumber);

    constructor(
        IERC20WithMint _token,
        address _devaddr,
        uint256 _sprucePerBlock
    ) public {
        token = _token;
        devaddr = _devaddr;
        sprucePerBlock = _sprucePerBlock;
        startBlock = uint256(-1);

        // staking pool
        poolInfo.push(PoolInfo({
            lpToken: _token,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accSprucePerShare: 0
        }));

        totalAllocPoint = 1000;

    }

    function updateMultiplier(uint256 multiplierNumber) public onlyOwner {
        require(multiplierNumber <= 10,"too big multiplier number");
        BONUS_MULTIPLIER = multiplierNumber;
        emit UpdateMultiplier(multiplierNumber);
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) public onlyOwner {
        require(startBlock != uint256(-1), "farm has not been started");
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accSprucePerShare: 0
        }));
        updateStakingPool();
    }

    // Update the given pool's SPRUCE allocation point. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(_allocPoint);
            updateStakingPool();
        }
    }

    function updateStakingPool() internal {
        uint256 length = poolInfo.length;
        uint256 points = 0;
        for (uint256 pid = 1; pid < length; ++pid) {
            points = points.add(poolInfo[pid].allocPoint);
        }
        if (points != 0) {
            points = points.mul(45).div(55);
            totalAllocPoint = totalAllocPoint.sub(poolInfo[0].allocPoint).add(points);
            poolInfo[0].allocPoint = points;
        }
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return _to.sub(_from).mul(BONUS_MULTIPLIER);
    }

    // View function to see pending SPRUCEs on frontend.
    function pendingSpruce(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accSprucePerShare = pool.accSprucePerShare;
        uint256 lpSupply = poolLpSupply[_pid];
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 spruceReward = multiplier.mul(sprucePerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accSprucePerShare = accSprucePerShare.add(spruceReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accSprucePerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = poolLpSupply[_pid];
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 spruceReward = multiplier.mul(sprucePerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        token.mint(devaddr, spruceReward.div(5));
        token.mint(address(this), spruceReward);
        pool.accSprucePerShare = pool.accSprucePerShare.add(spruceReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to FarmPool for SPRUCE allocation.
    function deposit(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'deposit SPRUCE by staking');

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accSprucePerShare).div(1e12).sub(user.rewardDebt);
            if(pending > 0) {
                token.safeTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
            poolLpSupply[_pid] = poolLpSupply[_pid].add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accSprucePerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from FarmPool.
    function withdraw(uint256 _pid, uint256 _amount) public {

        require (_pid != 0, 'withdraw SPRUCE by unstaking');
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");

        updatePool(_pid);
        uint256 pending = user.amount.mul(pool.accSprucePerShare).div(1e12).sub(user.rewardDebt);
        if(pending > 0) {
            token.safeTransfer(msg.sender, pending);
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            poolLpSupply[_pid] = poolLpSupply[_pid].sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accSprucePerShare).div(1e12);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Stake SPRUCE tokens to FarmPool
    function enterStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        updatePool(0);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accSprucePerShare).div(1e12).sub(user.rewardDebt);
            if(pending > 0) {
                token.safeTransfer(msg.sender, pending);
            }
        }
        if(_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
            poolLpSupply[0] = poolLpSupply[0].add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accSprucePerShare).div(1e12);

        emit Deposit(msg.sender, 0, _amount);
    }

    // Withdraw SPRUCE tokens from STAKING.
    function leaveStaking(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(0);
        uint256 pending = user.amount.mul(pool.accSprucePerShare).div(1e12).sub(user.rewardDebt);
        if(pending > 0) {
            token.safeTransfer(msg.sender, pending);
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            poolLpSupply[0] = poolLpSupply[0].sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accSprucePerShare).div(1e12);

        emit Withdraw(msg.sender, 0, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
        poolLpSupply[_pid] = poolLpSupply[_pid].sub(user.amount);
    }

    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }

    function setStartBlock(uint256 _startBlock) public onlyOwner {
        require(poolInfo.length == 1, "farm has been started: poolInfo.length > 1");
        require(startBlock == uint256(-1), "farm has been started: startBlock can only be set once");
        startBlock = _startBlock;
        poolInfo[0].lastRewardBlock = startBlock;
    }
}
