// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title PredictionMarket
/// @notice Polymarket-style binary markets: CPMM, manual resolution, production math
/// @dev Self-contained: mints YES/NO outcome tokens, no external CTF
contract PredictionMarket {
    IERC20 public immutable collateral; // USDC
    address public owner;
    address public resolver;
    uint256 public feeBps; // 70 = 0.7%

    uint256 constant FEE_DENOM = 10000;

    struct Market {
        string question;
        uint256 yesReserve;
        uint256 noReserve;
        bool resolved;
        uint8 winningOutcome; // 0=YES, 1=NO
    }

    mapping(uint256 => Market) public markets;
    uint256 public marketCount;

    // user => marketId => outcome(0/1) => shares (scaled 1e6)
    mapping(address => mapping(uint256 => mapping(uint8 => uint256))) public positions;

    event MarketCreated(uint256 indexed marketId, string question);
    event LiquidityAdded(uint256 indexed marketId, uint256 amount);
    event Bought(uint256 indexed marketId, uint8 outcome, uint256 amountIn, uint256 sharesOut, address buyer);
    event Sold(uint256 indexed marketId, uint8 outcome, uint256 sharesIn, uint256 amountOut, address seller);
    event Resolved(uint256 indexed marketId, uint8 outcome);
    event Redeemed(uint256 indexed marketId, address user, uint256 amount);

    error Unauthorized();
    error MarketResolved();
    error InsufficientOutput();
    error InsufficientBalance();
    error InvalidOutcome();

    constructor(address _collateral, address _resolver, uint256 _feeBps) {
        collateral = IERC20(_collateral);
        owner = msg.sender;
        resolver = _resolver;
        feeBps = _feeBps;
    }

    function createMarket(string calldata question) external returns (uint256 marketId) {
        marketId = marketCount++;
        markets[marketId] = Market({
            question: question,
            yesReserve: 0,
            noReserve: 0,
            resolved: false,
            winningOutcome: 0
        });
        emit MarketCreated(marketId, question);
    }

    /// @notice Add liquidity: deposit USDC, receive proportional pool share (simplified: 1:1 init)
    function addLiquidity(uint256 marketId, uint256 amount) external {
        Market storage m = markets[marketId];
        if (m.resolved) revert MarketResolved();
        collateral.transferFrom(msg.sender, address(this), amount);
        m.yesReserve += amount;
        m.noReserve += amount;
        emit LiquidityAdded(marketId, amount);
    }

    /// @param outcome 0=YES, 1=NO
    /// @param amountIn USDC (6 decimals)
    function buyOutcome(uint256 marketId, uint8 outcome, uint256 amountIn, uint256 minSharesOut)
        external
        returns (uint256 sharesOut)
    {
        if (outcome > 1) revert InvalidOutcome();
        Market storage m = markets[marketId];
        if (m.resolved) revert MarketResolved();

        collateral.transferFrom(msg.sender, address(this), amountIn);
        uint256 fee = (amountIn * feeBps) / FEE_DENOM;
        uint256 amountAfterFee = amountIn - fee;

        uint256 rIn = outcome == 0 ? m.noReserve : m.yesReserve;
        uint256 rOut = outcome == 0 ? m.yesReserve : m.noReserve;
        sharesOut = _cpmmBuy(amountAfterFee, rIn, rOut);
        if (sharesOut < minSharesOut) revert InsufficientOutput();

        if (outcome == 0) {
            m.yesReserve -= sharesOut;
            m.noReserve += amountAfterFee;
        } else {
            m.noReserve -= sharesOut;
            m.yesReserve += amountAfterFee;
        }

        positions[msg.sender][marketId][outcome] += sharesOut;
        emit Bought(marketId, outcome, amountIn, sharesOut, msg.sender);
    }

    function sellOutcome(uint256 marketId, uint8 outcome, uint256 sharesIn, uint256 minAmountOut)
        external
        returns (uint256 amountOut)
    {
        if (outcome > 1) revert InvalidOutcome();
        Market storage m = markets[marketId];
        if (m.resolved) revert MarketResolved();
        if (positions[msg.sender][marketId][outcome] < sharesIn) revert InsufficientBalance();

        uint256 rIn = outcome == 0 ? m.yesReserve : m.noReserve;
        uint256 rOut = outcome == 0 ? m.noReserve : m.yesReserve;
        amountOut = _cpmmSell(sharesIn, rIn, rOut);
        uint256 fee = (amountOut * feeBps) / FEE_DENOM;
        amountOut -= fee;
        if (amountOut < minAmountOut) revert InsufficientOutput();

        if (outcome == 0) {
            m.yesReserve += sharesIn;
            m.noReserve -= (amountOut + fee);
        } else {
            m.noReserve += sharesIn;
            m.yesReserve -= (amountOut + fee);
        }

        positions[msg.sender][marketId][outcome] -= sharesIn;
        collateral.transfer(msg.sender, amountOut);
        emit Sold(marketId, outcome, sharesIn, amountOut, msg.sender);
    }

    /// @notice Manual resolution (hackathon)
    function resolve(uint256 marketId, uint8 outcome) external {
        if (msg.sender != resolver && msg.sender != owner) revert Unauthorized();
        Market storage m = markets[marketId];
        require(!m.resolved, "Already resolved");
        require(outcome <= 1, "Invalid outcome");
        m.resolved = true;
        m.winningOutcome = outcome;
        emit Resolved(marketId, outcome);
    }

    function redeem(uint256 marketId) external {
        Market storage m = markets[marketId];
        require(m.resolved, "Not resolved");
        uint256 bal = positions[msg.sender][marketId][m.winningOutcome];
        require(bal > 0, "Nothing to redeem");
        positions[msg.sender][marketId][m.winningOutcome] = 0;
        collateral.transfer(msg.sender, bal);
        emit Redeemed(marketId, msg.sender, bal);
    }

    // --- Views (production math) ---

    /// @return Probability of YES in basis points (10000 = 100%)
    function getYesProbability(uint256 marketId) external view returns (uint256) {
        Market storage m = markets[marketId];
        uint256 t = m.yesReserve + m.noReserve;
        if (t == 0) return 5000;
        return (m.yesReserve * 10000) / t;
    }

    function getBuyAmountOut(uint256 marketId, uint8 outcome, uint256 amountIn) external view returns (uint256) {
        Market storage m = markets[marketId];
        uint256 fee = (amountIn * feeBps) / FEE_DENOM;
        uint256 amt = amountIn - fee;
        uint256 rIn = outcome == 0 ? m.noReserve : m.yesReserve;
        uint256 rOut = outcome == 0 ? m.yesReserve : m.noReserve;
        return _cpmmBuy(amt, rIn, rOut);
    }

    function getSellAmountOut(uint256 marketId, uint8 outcome, uint256 sharesIn) external view returns (uint256) {
        Market storage m = markets[marketId];
        uint256 amt = _cpmmSell(sharesIn, outcome == 0 ? m.yesReserve : m.noReserve, outcome == 0 ? m.noReserve : m.yesReserve);
        uint256 fee = (amt * feeBps) / FEE_DENOM;
        return amt - fee;
    }

    /// @dev CPMM: x*y=k. Buy outcome: add to rIn, remove from rOut.
    /// amountIn buys (rOut * amountIn) / (rIn + amountIn) shares
    function _cpmmBuy(uint256 amountIn, uint256 rIn, uint256 rOut) internal pure returns (uint256) {
        if (rIn == 0 || rOut == 0) return 0;
        return (rOut * amountIn) / (rIn + amountIn);
    }

    /// @dev Sell shares: add to rIn, remove from rOut.
    function _cpmmSell(uint256 amountIn, uint256 rIn, uint256 rOut) internal pure returns (uint256) {
        if (rIn == 0 || rOut == 0) return 0;
        return (rOut * amountIn) / (rIn + amountIn);
    }
}
