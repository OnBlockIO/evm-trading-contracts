// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "../../src/OperatorRole.sol";

contract OperatorRoleTest is OperatorRole {
    function __OperatorRoleTest_init() external initializer {
        __Ownable_init();
    }

    function getSomething() external view onlyOperator returns (uint256) {
        return 10;
    }
}
