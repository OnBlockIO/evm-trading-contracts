// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

library LibTransfer {
    function transferEth(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}("");
        require(success, "LibTransfer BaseCurrency transfer failed");
    }
}
