// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./librairies/LibPart.sol";

library LibOrderDataV1 {
    bytes4 public constant V1 = bytes4(keccak256("V1"));

    struct DataV1 {
        LibPart.Part[] payouts;
        LibPart.Part[] originFees;
    }

    function decodeOrderDataV1(bytes memory data) internal pure returns (DataV1 memory orderData) {
        orderData = abi.decode(data, (DataV1));
    }
}
