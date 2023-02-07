// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../LibOrder.sol";
import "../LibFill.sol";

contract LibFillTest {
    function fillOrder(
        LibOrder.Order calldata leftOrder,
        LibOrder.Order calldata rightOrder,
        uint leftOrderFill,
        uint rightOrderFill,
        bool leftIsMakeFill,
        bool rightIsMakeFill
    ) external pure returns (LibFill.FillResult memory) {
        return LibFill.fillOrder(leftOrder, rightOrder, leftOrderFill, rightOrderFill, leftIsMakeFill, rightIsMakeFill);
    }
}
