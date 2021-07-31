// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma abicoder v2;

import "../ExchangeV2.sol";
import "../ExchangeV2Core.sol";
import "../GhostMarketTransferManager.sol";
import "../GhostAuction.sol";

contract TestExchangeV2 is ExchangeV2 {

    /**
     * @dev modified matchAndTransfer method contracts/ExchangeV2Core.sol were the
     * base currency funds are transfered to orderRight.maker or the orderRight.taker
     */
    function matchAndTransferAuctionExternal(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight, uint amountFromAuction) public {
        matchAndTransferAuction(orderLeft, orderRight, amountFromAuction);
    }

    function matchAndTransferExternal(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight) public payable{
        matchAndTransfer(orderLeft, orderRight);
    }
    
    uint256[50] private __gap;
}
