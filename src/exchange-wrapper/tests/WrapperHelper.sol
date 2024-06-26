// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

import {IExchangeV2} from "../interfaces/IExchangeV2.sol";
import {LibOrder} from "../ExchangeWrapper.sol";
import {LibDirectTransfer} from "../ExchangeWrapper.sol";

import {LibSeaPort} from "../librairies/LibSeaPort.sol";
import {ISeaPort} from "../interfaces/ISeaPort.sol";
import {Ix2y2} from "../interfaces/Ix2y2.sol";
import {LibLooksRare} from "../librairies/LibLooksRare.sol";
import {ILooksRare} from "../interfaces/ILooksRare.sol";
import {ILSSVMRouter} from "../interfaces/ILSSVMRouter.sol";
import {IBlur} from "../interfaces/IBlurExchange.sol";

interface IERC1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    function transferFrom(address from, address to, uint256 tokenId) external;

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}

contract WrapperHelper {
    struct AdditionalData {
        bytes data;
        uint[] additionalRoyalties;
    }

    function encodeOriginFeeIntoUint(address account, uint96 value) external pure returns (uint) {
        return (uint(value) << 160) + uint(uint160(account));
    }

    function getDataDirectPurchase(LibDirectTransfer.Purchase memory data) external pure returns (bytes memory result) {
        result = abi.encodeWithSelector(IExchangeV2.directPurchase.selector, data);
    }

    function getDataSeaPortFulfillAdvancedOrder(
        LibSeaPort.AdvancedOrder memory _advancedOrder,
        LibSeaPort.CriteriaResolver[] memory _criteriaResolvers,
        bytes32 _fulfillerConduitKey,
        address _recipient
    ) external pure returns (bytes memory _data) {
        _data = abi.encodeWithSelector(
            ISeaPort.fulfillAdvancedOrder.selector,
            _advancedOrder,
            _criteriaResolvers,
            _fulfillerConduitKey,
            _recipient
        );
    }

    function getDataSeaPortFulfillAvailableAdvancedOrders(
        LibSeaPort.AdvancedOrder[] memory _orders,
        LibSeaPort.CriteriaResolver[] memory _criteriaResolvers,
        LibSeaPort.FulfillmentComponent[][] memory _offerFulfillments,
        LibSeaPort.FulfillmentComponent[][] memory _considerationFulfillments,
        bytes32 _fulfillerConduitKey,
        address _recipient,
        uint256 _maximumFulfilled
    ) external pure returns (bytes memory _data) {
        _data = abi.encodeWithSelector(
            ISeaPort.fulfillAvailableAdvancedOrders.selector,
            _orders,
            _criteriaResolvers,
            _offerFulfillments,
            _considerationFulfillments,
            _fulfillerConduitKey,
            _recipient,
            _maximumFulfilled
        );
    }

    function getDataSeaPortBasic(
        LibSeaPort.BasicOrderParameters calldata seaPortBasic,
        bytes4 typeNft
    ) external pure returns (bytes memory _data) {
        _data = abi.encode(seaPortBasic, typeNft);
    }

    function encodeData(Ix2y2.Pair721[] calldata data) external pure returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeData1155(Ix2y2.Pair1155[] calldata data) external pure returns (bytes memory) {
        return abi.encode(data);
    }

    function hashItem(Ix2y2.Order memory order, Ix2y2.OrderItem memory item) external pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    order.salt,
                    order.user,
                    order.network,
                    order.intent,
                    order.delegateType,
                    order.deadline,
                    order.currency,
                    order.dataMask,
                    item
                )
            );
    }

    function encodeX2Y2Call(Ix2y2.RunInput calldata data) external pure returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeFees(uint first, uint second) external pure returns (uint) {
        return (uint(uint16(first)) << 16) + uint(uint16(second));
    }

    function encodeFeesPlusDataType(uint dataType, uint first, uint second) external pure returns (uint) {
        return (uint(uint16(dataType)) << 32) + (uint(uint16(first)) << 16) + uint(uint16(second));
    }

    function encodeCurrencyAndDataTypeAndFees(
        uint currency,
        uint dataType,
        uint first,
        uint second
    ) external pure returns (uint) {
        return
            (uint(uint16(currency)) << 48) +
            (uint(uint16(dataType)) << 32) +
            (uint(uint16(first)) << 16) +
            uint(uint16(second));
    }

    function encodeDataPlusRoyalties(AdditionalData calldata data) external pure returns (bytes memory) {
        return abi.encode(data);
    }

    function encodeBpPlusAccount(uint bp, address account) external pure returns (uint) {
        return (uint(bp) << 160) + uint(uint160(account));
    }

    function decodeFees(uint data) external pure returns (uint, uint) {
        uint first = uint(uint16(data >> 16));
        uint second = uint(uint16(data));
        return (first, second);
    }

    function encodeSudoSwapCall(
        ILSSVMRouter.PairSwapSpecific[] calldata swapList,
        address payable ethRecipient,
        address nftRecipient,
        uint256 deadline
    ) external pure returns (bytes memory _data) {
        _data = abi.encodeWithSelector(
            ILSSVMRouter.swapETHForSpecificNFTs.selector,
            swapList,
            ethRecipient,
            nftRecipient,
            deadline
        );
    }

    function encodeLooksRareV2Call(
        LibLooksRare.Taker calldata takerBid,
        LibLooksRare.Maker calldata makerAsk,
        bytes calldata makerSignature,
        LibLooksRare.MerkleTree calldata merkleTree,
        address affiliate
    ) external pure returns (bytes memory _data) {
        _data = abi.encodeWithSelector(
            ILooksRare.executeTakerBid.selector,
            takerBid,
            makerAsk,
            makerSignature,
            merkleTree,
            affiliate
        );
    }

    function encodeDataBlur(
        IBlur.Input memory sell,
        IBlur.Input memory buy,
        bytes4 typeNft
    ) external pure returns (bytes memory _data) {
        _data = abi.encode(sell, buy, typeNft);
    }
}
