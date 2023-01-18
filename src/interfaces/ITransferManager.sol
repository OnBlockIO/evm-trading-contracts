// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../librairies/LibFill.sol";
import "../transfer-manager/TransferExecutor.sol";

abstract contract ITransferManager is ITransferExecutor {
    bytes4 public constant TO_MAKER = bytes4(keccak256("TO_MAKER"));
    bytes4 public constant TO_TAKER = bytes4(keccak256("TO_TAKER"));
    bytes4 public constant PROTOCOL = bytes4(keccak256("PROTOCOL"));
    bytes4 public constant ROYALTY = bytes4(keccak256("ROYALTY"));
    bytes4 public constant ORIGIN = bytes4(keccak256("ORIGIN"));
    bytes4 public constant PAYOUT = bytes4(keccak256("PAYOUT"));

    function doTransfers(
        LibAsset.AssetType memory makeMatch,
        LibAsset.AssetType memory takeMatch,
        LibFill.FillResult memory fill,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        LibOrderDataV2.DataV2 memory leftOrderData,
        LibOrderDataV2.DataV2 memory rightOrderData
    ) internal virtual returns (uint totalMakeValue, uint totalTakeValue);
}
