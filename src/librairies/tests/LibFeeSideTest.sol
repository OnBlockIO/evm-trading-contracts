// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../LibFeeSide.sol";

contract LibFeeSideTest {
    function getFeeSideTest(bytes4 maker, bytes4 taker) external pure returns (LibFeeSide.FeeSide) {
        return LibFeeSide.getFeeSide(maker, taker);
    }
}
