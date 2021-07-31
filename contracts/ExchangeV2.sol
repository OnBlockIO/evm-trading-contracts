// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./GhostMarketTransferManager.sol";
import "./GhostAuction.sol";

contract ExchangeV2 is ExchangeV2Core, GhostMarketTransferManager, GhostAuction {

    using LibTransfer for address;

    /// All of the details of an auction's completion,
    event OrderFilledAuction(
        uint256 auctionId,
        address nftContractAddress,
        address winner,
        uint256 amount
    );
    
    /**
     * @dev initialize ExchangeV2
     *
     * @param _transferProxy address for proxy transfer contract that handles ERC721 & ERC1155 contracts
     * @param _erc20TransferProxy address for proxy transfer contract that handles ERC20 contracts
     * @param newProtocolFee address for protocol fee
     * @param newDefaultFeeReceiver address for protocol fee if fee by token type is not set (GhostMarketTransferManager.sol => function getFeeReceiver)
     * @param adminRecoveryAddress GhostAuction contract admin address
     */
    function __ExchangeV2_init(
        INftTransferProxy _transferProxy,
        IERC20TransferProxy _erc20TransferProxy,
        uint newProtocolFee,
        address newDefaultFeeReceiver,
        // GhostAuction init varibales
        address adminRecoveryAddress
    ) external initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
        __GhostMarketTransferManager_init_unchained(newProtocolFee, newDefaultFeeReceiver);
        __OrderValidator_init_unchained();
        __ReserveAuctionV3_init_unchained(adminRecoveryAddress);
    }
    /**
     * @dev end the auction by transfering the nft to the the winner and funds to the seller
     * delete the auction data from the contract storage
     */
    function endAuctionDoTransfer(        
        LibOrder.Order memory orderLeft, 
        LibOrder.Order memory orderRight,
        uint256 auctionId
        ) external payable
        nonReentrant
        whenNotPaused
        auctionComplete(auctionId) {
        address payable winner = auctions[auctionId].bidder;
        require(
            winner == msg.sender,
            "Auction can only be claimed by the address who won it"
        );
        uint256 amount = auctions[auctionId].amount;
        emit OrderFilledAuction(auctionId, auctions[auctionId].nftContract, winner, amount);
        matchAndTransferAuction(orderLeft, orderRight, amount);
        deleteAuction(auctionId);
    }
    
    /**
     * @dev modified matchAndTransfer method contracts/ExchangeV2Core.sol were the
     * base currency funds are transfered to orderRight.maker or the orderRight.taker
     */
    function matchAndTransferAuction(LibOrder.Order memory orderLeft, LibOrder.Order memory orderRight, uint amountFromAuction) internal {
        (LibAsset.AssetType memory makeMatch, LibAsset.AssetType memory takeMatch) = matchAssets(orderLeft, orderRight);
        bytes32 leftOrderKeyHash = LibOrder.hashKey(orderLeft);
        bytes32 rightOrderKeyHash = LibOrder.hashKey(orderRight);
        uint leftOrderFill = fills[leftOrderKeyHash];
        uint rightOrderFill = fills[rightOrderKeyHash];
        LibFill.FillResult memory fill = LibFill.fillOrder(orderLeft, orderRight, leftOrderFill, rightOrderFill);
        require(fill.takeValue > 0, "nothing to fill");
        (uint totalMakeValue, uint totalTakeValue) = doTransfers(makeMatch, takeMatch, fill, orderLeft, orderRight);
         if (makeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(amountFromAuction >= totalMakeValue, "makeMatch: not enough ETH");
            if (amountFromAuction > totalMakeValue) {
                address(msg.sender).transferEth(amountFromAuction - totalMakeValue);
            }
        } else if (takeMatch.assetClass == LibAsset.ETH_ASSET_CLASS) {
            require(amountFromAuction >= totalTakeValue, "takeMatch: not enough ETH");
            if (amountFromAuction > totalTakeValue) {
                address(msg.sender).transferEth(amountFromAuction - totalMakeValue);
            }
        }

        if (address(this) != orderLeft.maker) {
            fills[leftOrderKeyHash] = leftOrderFill + fill.takeValue;
        }
        if (address(this) != orderRight.maker) {
            fills[rightOrderKeyHash] = rightOrderFill + fill.makeValue;
        }
        emit OrderFilled(leftOrderKeyHash, rightOrderKeyHash, orderLeft.maker, orderRight.maker, fill.takeValue, fill.makeValue);
    }

    uint256[50] private __gap;
}
