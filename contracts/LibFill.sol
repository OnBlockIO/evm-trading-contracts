// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./LibOrder.sol";



library LibFill {
    using SafeMathUpgradeable for uint;

    struct FillResult {
        uint makeValue;
        uint takeValue;
    }

    /**
     * @dev Should return filled values
     * @param leftOrder left order
     * @param rightOrder right order
     * @param leftOrderFill current fill of the left order (0 if order is unfilled)
     * @param rightOrderFill current fill of the right order (0 if order is unfilled)
     */
    function fillOrder(LibOrder.Order memory leftOrder, LibOrder.Order memory rightOrder, uint leftOrderFill, uint rightOrderFill) internal pure returns (FillResult memory) {
        (uint leftMakeValue, uint leftTakeValue) = LibOrder.calculateRemaining(leftOrder, leftOrderFill);
        (uint rightMakeValue, uint rightTakeValue) = LibOrder.calculateRemaining(rightOrder, rightOrderFill);

        //We have 3 cases here:
        if (rightTakeValue > leftMakeValue) { 
            /// 1st: left order should be fully filled
            return fillLeft(leftMakeValue, leftTakeValue, rightOrder.makeAsset.value, rightOrder.takeAsset.value);
        }
        /// 2nd: right order should be fully filled or 3rd: both should be fully filled if required values are the same
        return fillRight(leftOrder.makeAsset.value, leftOrder.takeAsset.value, rightMakeValue, rightTakeValue);
    }

    function fillRight(uint leftMakeValue, uint leftTakeValue, uint rightMakeValue, uint rightTakeValue) internal pure returns (FillResult memory result) {
        uint makerValue = LibMath.safeGetPartialAmountFloor(rightTakeValue, leftMakeValue, leftTakeValue);
        require(makerValue <= rightMakeValue, "fillRight: unable to fill");
        return FillResult(rightTakeValue, makerValue);
    }

    function fillLeft(uint leftMakeValue, uint leftTakeValue, uint rightMakeValue, uint rightTakeValue) internal pure returns (FillResult memory result) {
        uint rightTake = LibMath.safeGetPartialAmountFloor(leftTakeValue, rightMakeValue, rightTakeValue);
        require(rightTake <= leftMakeValue, "fillLeft: unable to fill");
        return FillResult(leftMakeValue, leftTakeValue);
    }
}
