// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISwapRouterV2} from "../interfaces/ISwapRouterV2.sol";

contract MockUniswapV2Router is ISwapRouterV2 {
    using SafeERC20 for IERC20;

    function swapExactTokensForTokens(
        uint,
        uint,
        address[] calldata,
        address,
        uint
    ) external pure returns (uint[] memory amounts) {
        uint[] memory amts = new uint[](1);
        amts[0] = 0;

        return amts;
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMaximum,
        address[] calldata path,
        address,
        uint
    ) external virtual returns (uint[] memory amounts) {
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountInMaximum);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        uint[] memory amts = new uint[](1);
        amts[0] = amountInMaximum;

        return amts;
    }

    function swapExactETHForTokens(
        uint,
        address[] calldata,
        address,
        uint
    ) external payable override returns (uint[] memory amounts) {
        uint[] memory amts = new uint[](1);
        amts[0] = 0;

        return amts;
    }

    function swapTokensForExactETH(
        uint amountOut,
        uint amountInMaximum,
        address[] calldata path,
        address,
        uint
    ) external override returns (uint[] memory amounts) {
        address tokenIn = path[0];
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountInMaximum);
        msg.sender.call{value: amountOut}("");
        uint[] memory amts = new uint[](1);
        amts[0] = amountInMaximum;

        return amts;
    }

    function swapExactTokensForETH(
        uint,
        uint,
        address[] calldata,
        address,
        uint
    ) external pure returns (uint[] memory amounts) {
        uint[] memory amts = new uint[](1);
        amts[0] = 0;

        return amts;
    }

    function swapETHForExactTokens(
        uint amountOut,
        address[] calldata path,
        address,
        uint
    ) external payable override returns (uint[] memory amounts) {
        address tokenOut = path[path.length - 1];
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        uint[] memory amts = new uint[](1);
        amts[0] = amountOut;

        return amts;
    }

    // avalanche
    function swapExactTokensForTokens(
        uint,
        uint,
        uint[] calldata,
        address[] calldata,
        address,
        uint
    ) external pure returns (uint[] memory amounts) {
        uint[] memory amts = new uint[](1);
        amts[0] = 0;

        return amts;
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMaximum,
        uint[] calldata,
        address[] calldata path,
        address,
        uint
    ) external override returns (uint[] memory amounts) {
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountInMaximum);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        uint[] memory amts = new uint[](1);
        amts[0] = amountInMaximum;

        return amts;
    }

    function swapExactAVAXForTokens(
        uint,
        uint[] calldata,
        address[] calldata,
        address,
        uint
    ) external payable override returns (uint[] memory amounts) {
        uint[] memory amts = new uint[](1);
        amts[0] = 0;

        return amts;
    }

    function swapTokensForExactAVAX(
        uint amountOut,
        uint amountInMaximum,
        uint[] calldata,
        address[] calldata path,
        address,
        uint
    ) external override returns (uint[] memory amounts) {
        address tokenIn = path[0];
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountInMaximum);
        msg.sender.call{value: amountOut}("");
        uint[] memory amts = new uint[](1);
        amts[0] = amountInMaximum;

        return amts;
    }

    function swapExactTokensForAVAX(
        uint,
        uint,
        uint[] calldata,
        address[] calldata,
        address,
        uint
    ) external pure returns (uint[] memory amounts) {
        uint[] memory amts = new uint[](1);
        amts[0] = 0;

        return amts;
    }

    function swapAVAXForExactTokens(
        uint amountOut,
        uint[] calldata,
        address[] calldata path,
        address,
        uint
    ) external payable override returns (uint[] memory amounts) {
        address tokenOut = path[path.length - 1];
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        uint[] memory amts = new uint[](1);
        amts[0] = amountOut;

        return amts;
    }

    receive() external payable {}
}
