// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../OrderValidator.sol";

contract OrderValidatorTest is OrderValidator {
    function __OrderValidatorTest_init() external initializer {
        __OrderValidator_init_unchained();
    }

    function validateOrderTest(LibOrder.Order calldata order, bytes calldata signature) external view {
        return validate(order, signature);
    }
}
