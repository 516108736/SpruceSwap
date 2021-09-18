// SPDX-License-Identifier: MIT
// P1 - P3: OK
pragma solidity ^0.6.0;

import "./libraries/BoringMath.sol";
import "./libraries/BoringERC20.sol";

import "./interfaces/IUniswapV2ERC20.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";

import "./BoringOwnable.sol";

// SpruceMaker is FarmPool's left hand and kinda a wizard. He can mint Spruce from pretty much anything!
// This contract handles "serving up" rewards for xSpruce holders by trading tokens collected from fees for Spruce.

// T1 - T4: OK
contract SPRUCEMaker is BoringOwnable {
    using BoringMath for uint256;
    using BoringERC20 for IERC20;

    // V1 - V5: OK
    IUniswapV2Factory public immutable factory;

    address private immutable treasuryA;

    // V1 - V5: OK
    address public immutable treasuryB;

    // x%
    uint private rateTreasuryA;

    // V1 - V5: OK
    address private immutable spruce;
    // V1 - V5: OK
    address private immutable wokt;

    // V1 - V5: OK
    mapping(address => address) internal _bridges;

    // E1: OK
    event LogBridgeSet(address indexed token, address indexed bridge);
    // E1: OK
    event LogConvert(address indexed server, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, uint256 amountSPRUCE, uint256 amountSPRUCETreasuryA);


    constructor (address _factory, address _spruce, address _wokt, address _treasuryA, address _treasuryB) public {
        factory = IUniswapV2Factory(_factory);
        spruce = _spruce;
        wokt = _wokt;
        treasuryA = _treasuryA;
        treasuryB = _treasuryB;
        rateTreasuryA = 67;
    }

    function setRateTreasuryA(uint _rateTreasuryA) external onlyOwner {
        require(_rateTreasuryA <= 100, "invalid _rateTreasuryA");
        rateTreasuryA = _rateTreasuryA;
    }


    // F1 - F10: OK
    // C1 - C24: OK
    function bridgeFor(address token) public view returns (address bridge) {
        bridge = _bridges[token];
        if (bridge == address(0)) {
            bridge = wokt;
        }
    }

    // F1 - F10: OK
    // C1 - C24: OK
    function setBridge(address token, address bridge) external onlyOwner {
        // Checks
        require(token != spruce && token != wokt && token != bridge, "SpruceMaker: Invalid bridge");

        // Effects
        _bridges[token] = bridge;
        emit LogBridgeSet(token, bridge);
    }

    // M1 - M5: OK
    // C1 - C24: OK
    // C6: It's not a fool proof solution, but it prevents flash loans, so here it's ok to use tx.origin
    modifier onlyEOA() {
        // Try to make flash-loan exploit harder to do.
        require(msg.sender == tx.origin, "SpruceMaker: must use EOA");
        _;
    }

    // F1 - F10: OK
    // F3: _convert is separate to save gas by only checking the 'onlyEOA' modifier once in case of convertMultiple
    // F6: There is an exploit to add lots of SPRUCE to the bar, run convert, then remove the SPRUCE again.
    //     As the size of the SpruceBar has grown, this requires large amounts of funds and isn't super profitable anymore
    //     The onlyEOA modifier prevents this being done with a flash loan.
    // C1 - C24: OK
    function convert(address token0, address token1) external onlyEOA() {
        _convert(token0, token1);
    }

    // F1 - F10: OK, see convert
    // C1 - C24: OK
    // C3: Loop is under control of the caller
    function convertMultiple(address[] calldata token0, address[] calldata token1) external onlyEOA() {
        // TODO: This can be optimized a fair bit, but this is safer and simpler for now
        uint256 len = token0.length;
        for (uint256 i = 0; i < len; i++) {
            _convert(token0[i], token1[i]);
        }
    }

    // F1 - F10: OK
    // C1- C24: OK
    function _convert(address token0, address token1) internal {
        // Interactions
        // S1 - S4: OK
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(token0, token1));
        require(address(pair) != address(0), "SpruceMaker: Invalid pair");
        // balanceOf: S1 - S4: OK
        // transfer: X1 - X5: OK
        IERC20(address(pair)).safeTransfer(address(pair), pair.balanceOf(address(this)));
        // X1 - X5: OK
        (uint256 amount0, uint256 amount1) = pair.burn(address(this));
        if (token0 != pair.token0()) {
            (amount0, amount1) = (amount1, amount0);
        }
        uint256 spruceOut = _convertStep(token0, token1, amount0, amount1);
        uint256 spruceTreasuryA = spruceOut * rateTreasuryA / 100;
        uint256 spruceTreasuryB = spruceOut - spruceTreasuryA;
        IERC20(spruce).safeTransfer(treasuryA, spruceTreasuryA);
        IERC20(spruce).safeTransfer(treasuryB, spruceTreasuryB);
        emit LogConvert(msg.sender, token0, token1, amount0, amount1, spruceOut, spruceTreasuryA);
    }

    // F1 - F10: OK
    // C1 - C24: OK
    // All safeTransfer, _swap, _toSPRUCE, _convertStep: X1 - X5: OK
    function _convertStep(address token0, address token1, uint256 amount0, uint256 amount1) internal returns (uint256 spruceOut) {
        // Interactions
        if (token0 == token1) {
            uint256 amount = amount0.add(amount1);
            if (token0 == spruce) {
                spruceOut = amount;
            } else if (token0 == wokt) {
                spruceOut = _toSPRUCE(wokt, amount);
            } else {
                address bridge = bridgeFor(token0);
                amount = _swap(token0, bridge, amount, address(this));
                spruceOut = _convertStep(bridge, bridge, amount, 0);
            }
        } else if (token0 == spruce) {// eg. SPRUCE - ETH
            spruceOut = _toSPRUCE(token1, amount1).add(amount0);
        } else if (token1 == spruce) {// eg. USDT - SPRUCE
            spruceOut = _toSPRUCE(token0, amount0).add(amount1);
        } else if (token0 == wokt) {// eg. ETH - USDC
            spruceOut = _toSPRUCE(wokt, _swap(token1, wokt, amount1, address(this)).add(amount0));
        } else if (token1 == wokt) {// eg. USDT - ETH
            spruceOut = _toSPRUCE(wokt, _swap(token0, wokt, amount0, address(this)).add(amount1));
        } else {// eg. MIC - USDT
            address bridge0 = bridgeFor(token0);
            address bridge1 = bridgeFor(token1);
            if (bridge0 == token1) {// eg. MIC - USDT - and bridgeFor(MIC) = USDT
                spruceOut = _convertStep(bridge0, token1,
                    _swap(token0, bridge0, amount0, address(this)),
                    amount1
                );
            } else if (bridge1 == token0) {// eg. WBTC - DSD - and bridgeFor(DSD) = WBTC
                spruceOut = _convertStep(token0, bridge1,
                    amount0,
                    _swap(token1, bridge1, amount1, address(this))
                );
            } else {
                spruceOut = _convertStep(bridge0, bridge1, // eg. USDT - DSD - and bridgeFor(DSD) = WBTC
                    _swap(token0, bridge0, amount0, address(this)),
                    _swap(token1, bridge1, amount1, address(this))
                );
            }
        }
    }

    // F1 - F10: OK
    // C1 - C24: OK
    // All safeTransfer, swap: X1 - X5: OK
    function _swap(address fromToken, address toToken, uint256 amountIn, address to) internal returns (uint256 amountOut) {
        // Checks
        // X1 - X5: OK
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(fromToken, toToken));
        require(address(pair) != address(0), "SpruceMaker: Cannot convert");

        // Interactions
        // X1 - X5: OK
        (uint256 reserve0, uint256 reserve1,) = pair.getReserves();
        uint256 amountInWithFee = amountIn.mul(997);
        if (fromToken == pair.token0()) {
            amountOut = amountIn.mul(997).mul(reserve1) / reserve0.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(0, amountOut, to, new bytes(0));
            // TODO: Add maximum slippage?
        } else {
            amountOut = amountIn.mul(997).mul(reserve0) / reserve1.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(amountOut, 0, to, new bytes(0));
            // TODO: Add maximum slippage?
        }
    }

    // F1 - F10: OK
    // C1 - C24: OK
    function _toSPRUCE(address token, uint256 amountIn) internal returns (uint256 amountOut) {
        // X1 - X5: OK
        amountOut = _swap(token, spruce, amountIn, address(this));
    }
}