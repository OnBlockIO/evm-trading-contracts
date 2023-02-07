// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../ExchangeV2.sol";

contract ExchangeV10 is ExchangeV2 {
    function getSomething() external pure returns (uint) {
        return 10;
    }
}
