// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

library BpLibrary {
    using SafeMathUpgradeable for uint256;

    /**
     * @dev calculate the percentage amount of the given value
     */
    function bp(uint256 value, uint256 bpValue) internal pure returns (uint256) {
        return value.mul(bpValue).div(10000);
    }
}
