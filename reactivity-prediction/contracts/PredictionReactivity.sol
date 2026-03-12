// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { SomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

interface IERC20 {
    function transferFrom(address from,address to,uint256 amount) external returns (bool);
    function transfer(address to,uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PredictionMarket is SomniaEventHandler {

    IERC20 public immutable collateral;

    address public owner;
    address public resolver;

    uint256 public feeBps;
    uint256 constant FEE_DENOM = 10000;

    constructor(address _collateral,address _resolver,uint256 _feeBps){
        collateral = IERC20(_collateral);
        owner = msg.sender;
        resolver = _resolver;
        feeBps = _feeBps;
    }

    modifier onlyOwner(){
        require(msg.sender == owner,"Not owner");
        _;
    }

    struct Market{
        string question;
        uint256 yesReserve;
        uint256 noReserve;
        bool resolved;
        uint8 winningOutcome;
    }

    mapping(uint256 => Market) public markets;
    uint256 public marketCount;

    mapping(address => mapping(uint256 => mapping(uint8 => uint256))) public positions;

    // ------------------------------------------------
    // USER LEADERBOARD STATS
    // ------------------------------------------------

    struct UserStats{
        uint256 wins;
        uint256 losses;
        uint256 totalWon;
        uint256 totalLost;
    }

    mapping(address => UserStats) public userStats;

    // reward pending
    mapping(address => uint256) public pendingReward;

    address[] public traders;

    // ------------------------------------------------
    // EVENTS
    // ------------------------------------------------

    event MarketCreated(uint256 indexed marketId,string question);
    event LiquidityAdded(uint256 indexed marketId,uint256 amount);
    event Bought(uint256 indexed marketId,uint8 outcome,uint256 amountIn,uint256 sharesOut,address buyer);
    event Sold(uint256 indexed marketId,uint8 outcome,uint256 sharesIn,uint256 amountOut,address seller);
    event Resolved(uint256 indexed marketId,uint8 outcome);

    event SettlementProcessed(uint256 indexed marketId,address user,uint256 reward);

    event Redeemed(address indexed user,uint256 amount);

    // ------------------------------------------------
    // REACTIVITY SIGNATURE
    // ------------------------------------------------

    bytes32 constant MARKET_RESOLVE_SIG =
        keccak256("Resolved(uint256,uint8)");

    // ------------------------------------------------
    // CREATE MARKET
    // ------------------------------------------------

    function createMarket(string calldata question)
        external
        returns(uint256 marketId)
    {
        marketId = marketCount++;

        markets[marketId] = Market({
            question: question,
            yesReserve: 0,
            noReserve: 0,
            resolved: false,
            winningOutcome: 0
        });

        emit MarketCreated(marketId,question);
    }

    // ------------------------------------------------
    // ADD LIQUIDITY
    // ------------------------------------------------

    function addLiquidity(uint256 marketId,uint256 amount)
        external
    {
        Market storage m = markets[marketId];

        require(!m.resolved,"Market resolved");

        collateral.transferFrom(msg.sender,address(this),amount);

        m.yesReserve += amount;
        m.noReserve += amount;

        emit LiquidityAdded(marketId,amount);
    }

    // ------------------------------------------------
    // BUY OUTCOME
    // ------------------------------------------------

    function buyOutcome(
        uint256 marketId,
        uint8 outcome,
        uint256 amountIn,
        uint256 minSharesOut
    )
        external
        returns(uint256 sharesOut)
    {
        require(outcome <= 1,"Invalid outcome");

        Market storage m = markets[marketId];
        require(!m.resolved,"Market resolved");

        collateral.transferFrom(msg.sender,address(this),amountIn);

        uint256 fee = (amountIn * feeBps) / FEE_DENOM;
        uint256 amountAfterFee = amountIn - fee;

        uint256 rIn = outcome == 0 ? m.noReserve : m.yesReserve;
        uint256 rOut = outcome == 0 ? m.yesReserve : m.noReserve;

        sharesOut = _cpmmBuy(amountAfterFee,rIn,rOut);

        require(sharesOut >= minSharesOut,"Slippage");

        if(outcome == 0){
            m.yesReserve -= sharesOut;
            m.noReserve += amountAfterFee;
        } else {
            m.noReserve -= sharesOut;
            m.yesReserve += amountAfterFee;
        }

        positions[msg.sender][marketId][outcome] += sharesOut;

        traders.push(msg.sender);

        emit Bought(marketId,outcome,amountIn,sharesOut,msg.sender);
    }

    // ------------------------------------------------
    // SELL OUTCOME
    // ------------------------------------------------

    function sellOutcome(
        uint256 marketId,
        uint8 outcome,
        uint256 sharesIn,
        uint256 minAmountOut
    )
        external
        returns(uint256 amountOut)
    {
        require(outcome <= 1,"Invalid outcome");

        Market storage m = markets[marketId];
        require(!m.resolved,"Market resolved");

        require(
            positions[msg.sender][marketId][outcome] >= sharesIn,
            "Insufficient balance"
        );

        uint256 rIn = outcome == 0 ? m.yesReserve : m.noReserve;
        uint256 rOut = outcome == 0 ? m.noReserve : m.yesReserve;

        amountOut = _cpmmSell(sharesIn,rIn,rOut);

        uint256 fee = (amountOut * feeBps) / FEE_DENOM;

        amountOut -= fee;

        require(amountOut >= minAmountOut,"Slippage");

        if(outcome == 0){
            m.yesReserve += sharesIn;
            m.noReserve -= (amountOut + fee);
        } else {
            m.noReserve += sharesIn;
            m.yesReserve -= (amountOut + fee);
        }

        positions[msg.sender][marketId][outcome] -= sharesIn;

        collateral.transfer(msg.sender,amountOut);

        emit Sold(marketId,outcome,sharesIn,amountOut,msg.sender);
    }

    // ------------------------------------------------
    // RESOLVE MARKET
    // ------------------------------------------------

    function resolve(uint256 marketId,uint8 outcome)
        external
    {
        require(
            msg.sender == resolver || msg.sender == owner,
            "Unauthorized"
        );

        Market storage m = markets[marketId];

        require(!m.resolved,"Already resolved");
        require(outcome <= 1,"Invalid outcome");

        m.resolved = true;
        m.winningOutcome = outcome;

        emit Resolved(marketId,outcome);
    }

    // ------------------------------------------------
    // SOMNIA REACTIVITY
    // ------------------------------------------------

    function _onEvent(
        address,
        bytes32[] calldata topics,
        bytes calldata data
    )
        internal
        override
    {

        if(topics[0] == MARKET_RESOLVE_SIG){

            uint256 marketId = uint256(topics[1]);
            uint8 outcome = abi.decode(data,(uint8));

            Market storage m = markets[marketId];

            if(!m.resolved) return;

            uint8 losingOutcome = outcome == 0 ? 1 : 0;

            for(uint256 i=0;i<traders.length;i++){

                address user = traders[i];

                uint256 winShares =
                    positions[user][marketId][outcome];

                uint256 loseShares =
                    positions[user][marketId][losingOutcome];

                if(winShares > 0){

                    pendingReward[user] += winShares;

                    userStats[user].wins += 1;
                    userStats[user].totalWon += winShares;

                    emit SettlementProcessed(
                        marketId,
                        user,
                        winShares
                    );
                }

                if(loseShares > 0){

                    userStats[user].losses += 1;
                    userStats[user].totalLost += loseShares;
                }
            }
        }
    }

    // ------------------------------------------------
    // REDEEM WINNINGS
    // ------------------------------------------------

    function redeem()
        external
    {
        uint256 reward = pendingReward[msg.sender];

        require(reward > 0,"Nothing to redeem");

        pendingReward[msg.sender] = 0;

        collateral.transfer(msg.sender,reward);

        emit Redeemed(msg.sender,reward);
    }

    // ------------------------------------------------
    // VIEW FUNCTIONS
    // ------------------------------------------------

    function getUserStats(address user)
        external
        view
        returns(
            uint256 wins,
            uint256 losses,
            uint256 totalWon,
            uint256 totalLost
        )
    {
        UserStats memory s = userStats[user];

        return(
            s.wins,
            s.losses,
            s.totalWon,
            s.totalLost
        );
    }

    function getPendingReward(address user)
        external
        view
        returns(uint256)
    {
        return pendingReward[user];
    }

    function getTraderCount()
        external
        view
        returns(uint256)
    {
        return traders.length;
    }

    function getTraderByIndex(uint256 index)
        external
        view
        returns(address)
    {
        require(index < traders.length,"Out of bounds");
        return traders[index];
    }

    function getMarket(uint256 marketId)
        external
        view
        returns(
            string memory question,
            uint256 yesReserve,
            uint256 noReserve,
            bool resolved,
            uint8 winningOutcome
        )
    {
        Market memory m = markets[marketId];

        return(
            m.question,
            m.yesReserve,
            m.noReserve,
            m.resolved,
            m.winningOutcome
        );
    }

    function getYesProbability(uint256 marketId)
        external
        view
        returns(uint256)
    {
        Market storage m = markets[marketId];

        uint256 total =
            m.yesReserve + m.noReserve;

        if(total == 0) return 5000;

        return (m.yesReserve * 10000) / total;
    }

    // ------------------------------------------------
    // CPMM MATH
    // ------------------------------------------------

    function _cpmmBuy(
        uint256 amountIn,
        uint256 rIn,
        uint256 rOut
    )
        internal
        pure
        returns(uint256)
    {
        if(rIn == 0 || rOut == 0) return 0;

        return (rOut * amountIn) / (rIn + amountIn);
    }

    function _cpmmSell(
        uint256 amountIn,
        uint256 rIn,
        uint256 rOut
    )
        internal
        pure
        returns(uint256)
    {
        if(rIn == 0 || rOut == 0) return 0;

        return (rOut * amountIn) / (rIn + amountIn);
    }
}
