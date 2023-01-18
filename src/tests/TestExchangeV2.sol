// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../ExchangeV2.sol";
import "../ExchangeV2Core.sol";
import "../GhostMarketTransferManager.sol";

contract TestExchangeV2 is ExchangeV2 {
    function matchAndTransferExternal(
        LibOrder.Order memory orderLeft,
        LibOrder.Order memory orderRight
    ) public payable {
        matchAndTransfer(orderLeft, orderRight);
    }

    uint256[50] private __gap;
}
