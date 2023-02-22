// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISwapRouterV3} from "../interfaces/ISwapRouterV3.sol";

contract MockUniswapV3Router is ISwapRouterV3 {
    using SafeERC20 for IERC20;

    function exactOutput(ExactOutputParams calldata params) external payable override returns (uint256 amountIn) {
        address tokenIn;
        address tokenOut;
        bytes memory _path = params.path;
        uint _start = _path.length - 20;
        assembly {
            tokenIn := div(mload(add(add(_path, 0x20), _start)), 0x1000000000000000000000000)
            tokenOut := div(mload(add(add(_path, 0x20), 0)), 0x1000000000000000000000000)
        }

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), params.amountInMaximum);
        IERC20(tokenOut).transfer(msg.sender, params.amountOut);

        return params.amountInMaximum;
    }

    function exactInput(ExactInputParams calldata) external payable override returns (uint256 amountIn) {
        return 0;
    }

    function uniswapV3SwapCallback(int256, int256, bytes calldata) external pure {
        return;
    }

    function refundETH() external payable override {
        return;
    }

    receive() external payable {}
}
