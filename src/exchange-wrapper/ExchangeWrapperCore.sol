// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../librairies/LibTransfer.sol";
import "../librairies/BpLibrary.sol";
import "../librairies/LibPart.sol";

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/IWyvernExchange.sol";
import "./interfaces/IExchangeV2.sol";
import "./interfaces/ISeaPort.sol";
import "./interfaces/Ix2y2.sol";
import "./interfaces/ILooksRare.sol";
import "./interfaces/IBlurExchange.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {ISwapRouterV3} from "./interfaces/ISwapRouterV3.sol";
// import {ISwapRouterV2} from "./interfaces/ISwapRouterV3.sol";

abstract contract ExchangeWrapperCore is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ERC721Holder,
    ERC1155Holder
{
    using LibTransfer for address;
    using BpLibrary for uint;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address internal exchangeV2;
    address internal rarible;
    address internal wyvern;
    address internal seaport;
    address internal x2y2;
    address internal looksrare;
    address internal sudoswap;
    address internal blur;
    address internal wethToken;
    ISwapRouterV3 internal uniswapRouterV3;
    address internal erc20TransferProxy;
    // ISwapRouterV2 internal uniswapRouterV2;

    event Execution(bool result, address indexed sender);

    enum Markets {
        Rarible,
        Wyvern,
        SeaPort,
        X2Y2,
        LooksRare,
        SudoSwap,
        ExchangeV2,
        Blur
    }

    enum AdditionalDataTypes {
        NoAdditionalData,
        RoyaltiesAdditionalData
    }

    /**
        @notice struct for the purchase data
        @param marketId - market key from Markets enum (what market to use)
        @param amount - eth price (amount of eth that needs to be send to the marketplace)
        @param fees - 2 fees (in base points) that are going to be taken on top of order amount encoded in 1 uint256
                        bytes (27,28) used for dataType
                        bytes (29,30) used for the first value (goes to feeRecipientFirst)
                        bytes (31,32) are used for the second value (goes to feeRecipientSecond)
        @param data - data for market call
     */
    struct PurchaseDetails {
        Markets marketId;
        uint256 amount;
        uint fees;
        bytes data;
    }

    /**
        @notice struct for the data with additional Ddta
        @param data - data for market call
        @param additionalRoyalties - array additional Royalties (in base points plus address Royalty recipient)
     */
    struct AdditionalData {
        bytes data;
        uint[] additionalRoyalties;
    }

    /**
        @notice struct for the swap in data
        @param tokenIn - tokenIn
        @param tokenOut - tokenOut
        @param amountOut - amountOut
        @param amountInMaximum - amountInMaximum
        @param unwrap - unwrap
     */
    struct SwapDetailsIn {
        address tokenIn;
        address tokenOut;
        uint256 amountOut;
        uint256 amountInMaximum;
        bool unwrap;
    }

    /**
        @notice struct for the swap out data
        @param tokenIn - tokenIn
        @param tokenOut - tokenOut
        @param amountIn - amountOut
        @param amountOutMinimum - amountOutMinimum
     */
    struct SwapDetailsOut {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMinimum;
        bool wrap;
    }

    function __ExchangeWrapper_init_unchained(
        address _exchangeV2,
        address _rarible,
        address _wyvern,
        address _seaport,
        address _x2y2,
        address _looksrare,
        address _sudoswap,
        address _blur,
        address _wethToken,
        ISwapRouterV3 _uniswapRouterV3,
        address _erc20TransferProxy
        // ISwapRouterV2 _uniswapRouterV2,
    ) internal {
        exchangeV2 = _exchangeV2;
        rarible = _rarible;
        wyvern = _wyvern;
        seaport = _seaport;
        x2y2 = _x2y2;
        looksrare = _looksrare;
        sudoswap = _sudoswap;
        blur = _blur;
        wethToken = _wethToken;
        uniswapRouterV3 = _uniswapRouterV3;
        erc20TransferProxy = _erc20TransferProxy;
        // uniswapRouterV2 = _uniswapRouterV2;
    }

    /// @notice Pause the contract
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() public onlyOwner {
        _unpause();
    }

    /// temp for upgrade - to remove once initialized
    function setTransferProxy(address _erc20TransferProxy) external onlyOwner {
        erc20TransferProxy = _erc20TransferProxy;
    }

    function setRarible(address _rarible) external onlyOwner {
        rarible = _rarible;
    }

    function setBlur(address _blur) external onlyOwner {
        blur = _blur;
    }

    function setWeth(address _wethToken) external onlyOwner {
        wethToken = _wethToken;
    }

    function setUniswapV3(ISwapRouterV3 _uniswapRouterV3) external onlyOwner {
        uniswapRouterV3 = _uniswapRouterV3;
    }

    /*function setUniswapV2(ISwapRouterV2 _uniswapRouterV2) external onlyOwner {
        uniswapRouterV2 = _uniswapRouterV2;
    }*/
    /// temp for upgrade - to remove once initialized

    /**
        @notice executes a single purchase
        @param purchaseDetails - details about the purchase (more info in PurchaseDetails struct)
        @param feeRecipientFirst - address of the first fee recipient
        @param feeRecipientSecond - address of the second fee recipient
     */
    function singlePurchase(
        PurchaseDetails memory purchaseDetails,
        address feeRecipientFirst,
        address feeRecipientSecond,
        SwapDetailsIn memory swapDetails
    ) external payable whenNotPaused {

        if (swapDetails.tokenIn != address(0))
        {
            bool isSwapExecuted = swapTokensForETHOrWETH(swapDetails);
            require(isSwapExecuted, "swap not successful");
        }

        (bool success, uint feeAmountFirst, uint feeAmountSecond) = purchase(purchaseDetails, false);
        emit Execution(success, _msgSender());

        transferFee(feeAmountFirst, feeRecipientFirst);
        transferFee(feeAmountSecond, feeRecipientSecond);

        transferChange();
    }

    /**
        @notice executes an array of purchases
        @param purchaseDetails - array of details about the purchases (more info in PurchaseDetails struct)
        @param feeRecipientFirst - address of the first fee recipient
        @param feeRecipientSecond - address of the second fee recipient
        @param allowFail - true if fails while executing orders are allowed, false if fail of a single order means fail of the whole batch
     */

    function bulkPurchase(
        PurchaseDetails[] memory purchaseDetails,
        address feeRecipientFirst,
        address feeRecipientSecond,
        bool allowFail,
        SwapDetailsIn memory swapDetails

    ) external payable whenNotPaused {
        uint sumFirstFees = 0;
        uint sumSecondFees = 0;
        bool result = false;

        if (swapDetails.tokenIn != address(0))
        {
            bool isSwapExecuted = swapTokensForETHOrWETH(swapDetails);
            require(isSwapExecuted, "swap not successful");
        }

        uint length = purchaseDetails.length;
        for (uint i; i < length; ++i) {
            (bool success, uint firstFeeAmount, uint secondFeeAmount) = purchase(purchaseDetails[i], allowFail);

            result = result || success;
            emit Execution(success, _msgSender());

            sumFirstFees = sumFirstFees + (firstFeeAmount);
            sumSecondFees = sumSecondFees + (secondFeeAmount);
        }

        require(result, "no successful executions");

        transferFee(sumFirstFees, feeRecipientFirst);
        transferFee(sumSecondFees, feeRecipientSecond);

        transferChange();
    }

    /**
        @notice executes one purchase
        @param purchaseDetails - details about the purchase
        @param allowFail - true if errors are handled, false if revert on errors
        @return result false if execution failed, true if succeded
        @return firstFeeAmount amount of the first fee of the purchase, 0 if failed
        @return secondFeeAmount amount of the second fee of the purchase, 0 if failed
     */
    function purchase(PurchaseDetails memory purchaseDetails, bool allowFail) internal returns (bool, uint, uint) {
        (bytes memory marketData, uint[] memory additionalRoyalties) = getDataAndAdditionalData(
            purchaseDetails.data,
            purchaseDetails.fees,
            purchaseDetails.marketId
        );
        uint paymentAmount = purchaseDetails.amount;
        if (purchaseDetails.marketId == Markets.SeaPort) {
            (bool success, ) = address(seaport).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase Seaport failed");
            }
        } else if (purchaseDetails.marketId == Markets.Wyvern) {
            (bool success, ) = address(wyvern).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase Wyvern failed");
            }
        } else if (purchaseDetails.marketId == Markets.ExchangeV2) {
            (bool success, ) = address(exchangeV2).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase GhostMarket failed");
            }
        } else if (purchaseDetails.marketId == Markets.Rarible) {
            (bool success, ) = address(rarible).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase Rarible failed");
            }
        } else if (purchaseDetails.marketId == Markets.X2Y2) {
            Ix2y2.RunInput memory input = abi.decode(marketData, (Ix2y2.RunInput));

            if (allowFail) {
                try Ix2y2(x2y2).run{value: paymentAmount}(input) {} catch {
                    return (false, 0, 0);
                }
            } else {
                Ix2y2(x2y2).run{value: paymentAmount}(input);
            }

            // for every element in input.details[] getting
            // order = input.details[i].orderIdx
            // and from that order getting item = input.details[i].itemId
            uint length = input.details.length;
            for (uint i; i < length; ++i) {
                uint orderId = input.details[i].orderIdx;
                uint itemId = input.details[i].itemIdx;
                bytes memory data = input.orders[orderId].items[itemId].data;
                {
                    if (input.orders[orderId].dataMask.length > 0 && input.details[i].dataReplacement.length > 0) {
                        _arrayReplace(data, input.details[i].dataReplacement, input.orders[orderId].dataMask);
                    }
                }

                // 1 = erc-721
                if (input.orders[orderId].delegateType == 1) {
                    Ix2y2.Pair721[] memory pairs = abi.decode(data, (Ix2y2.Pair721[]));

                    for (uint256 j = 0; j < pairs.length; j++) {
                        Ix2y2.Pair721 memory p = pairs[j];
                        IERC721Upgradeable(address(p.token)).safeTransferFrom(address(this), _msgSender(), p.tokenId);
                    }
                } else if (input.orders[orderId].delegateType == 2) {
                    // 2 = erc-1155
                    Ix2y2.Pair1155[] memory pairs = abi.decode(data, (Ix2y2.Pair1155[]));

                    for (uint256 j = 0; j < pairs.length; j++) {
                        Ix2y2.Pair1155 memory p = pairs[j];
                        IERC1155Upgradeable(address(p.token)).safeTransferFrom(
                            address(this),
                            _msgSender(),
                            p.tokenId,
                            p.amount,
                            ""
                        );
                    }
                } else {
                    revert("unknown delegateType x2y2");
                }
            }
        } else if (purchaseDetails.marketId == Markets.LooksRare) {
            (LibLooksRare.TakerOrder memory takerOrder, LibLooksRare.MakerOrder memory makerOrder, bytes4 typeNft) = abi
                .decode(marketData, (LibLooksRare.TakerOrder, LibLooksRare.MakerOrder, bytes4));
            if (allowFail) {
                try
                    ILooksRare(looksrare).matchAskWithTakerBidUsingETHAndWETH{value: paymentAmount}(
                        takerOrder,
                        makerOrder
                    )
                {} catch {
                    return (false, 0, 0);
                }
            } else {
                ILooksRare(looksrare).matchAskWithTakerBidUsingETHAndWETH{value: paymentAmount}(takerOrder, makerOrder);
            }
            if (typeNft == LibAsset.ERC721_ASSET_CLASS) {
                IERC721Upgradeable(makerOrder.collection).safeTransferFrom(
                    address(this),
                    _msgSender(),
                    makerOrder.tokenId
                );
            } else if (typeNft == LibAsset.ERC1155_ASSET_CLASS) {
                IERC1155Upgradeable(makerOrder.collection).safeTransferFrom(
                    address(this),
                    _msgSender(),
                    makerOrder.tokenId,
                    makerOrder.amount,
                    ""
                );
            } else {
                revert("Unknown token type");
            }
        } else if (purchaseDetails.marketId == Markets.SudoSwap) {
            (bool success, ) = address(sudoswap).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase SudoSwap failed");
            }
        } else if (purchaseDetails.marketId == Markets.Blur) {
            (bool success, ) = address(blur).call{value: paymentAmount}(marketData);
            if (allowFail) {
                if (!success) {
                    return (false, 0, 0);
                }
            } else {
                require(success, "Purchase blurio failed");
            }
        } else {
            revert("Unknown purchase details");
        }

        //transferring royalties
        transferAdditionalRoyalties(additionalRoyalties, purchaseDetails.amount);

        (uint firstFeeAmount, uint secondFeeAmount) = getFees(purchaseDetails.fees, purchaseDetails.amount);
        return (true, firstFeeAmount, secondFeeAmount);
    }

    /**
        @notice transfers fee to feeRecipient
        @param feeAmount - amount to be transfered
        @param feeRecipient - address of the recipient
     */
    function transferFee(uint feeAmount, address feeRecipient) internal {
        if (feeAmount > 0 && feeRecipient != address(0)) {
            LibTransfer.transferEth(feeRecipient, feeAmount);
        }
    }

    /**
        @notice transfers change back to sender
     */
    function transferChange() internal {
        uint ethAmount = address(this).balance;
        if (ethAmount > 0) {
            address(msg.sender).transferEth(ethAmount);
        }
    }

    /**
        @notice parses fees in base points from one uint and calculates real amount of fees
        @param fees two fees encoded in one uint, 29 and 30 bytes are used for the first fee, 31 and 32 bytes for second fee
        @param amount price of the order
        @return firstFeeAmount real amount for the first fee
        @return secondFeeAmount real amount for the second fee
     */
    function getFees(uint fees, uint amount) internal pure returns (uint, uint) {
        uint firstFee = uint(uint16(fees >> 16));
        uint secondFee = uint(uint16(fees));
        return (amount.bp(firstFee), amount.bp(secondFee));
    }

    /**
        @notice parses _data to data for market call and additionalData
        @param feesAndDataType 27 and 28 bytes for dataType
        @return marketData data for market call
        @return additionalRoyalties array uint256, (base point + address)
     */
    function getDataAndAdditionalData(
        bytes memory _data,
        uint feesAndDataType,
        Markets marketId
    ) internal pure returns (bytes memory, uint[] memory) {
        AdditionalDataTypes dataType = AdditionalDataTypes(uint16(feesAndDataType >> 32));
        uint[] memory additionalRoyalties;

        //return no royalties if wrong data type
        if (dataType == AdditionalDataTypes.NoAdditionalData) {
            return (_data, additionalRoyalties);
        }

        if (dataType == AdditionalDataTypes.RoyaltiesAdditionalData) {
            AdditionalData memory additionalData = abi.decode(_data, (AdditionalData));

            //return no royalties if market doesn't support royalties
            if (supportsRoyalties(marketId)) {
                return (additionalData.data, additionalData.additionalRoyalties);
            } else {
                return (additionalData.data, additionalRoyalties);
            }
        }

        revert("unknown additionalDataType");
    }

    /**
        @notice transfer additional royalties
        @param _additionalRoyalties array uint256 (base point + royalty recipient address)
     */
    function transferAdditionalRoyalties(uint[] memory _additionalRoyalties, uint amount) internal {
        uint length = _additionalRoyalties.length;
        for (uint i; i < length; ++i) {
            if (_additionalRoyalties[i] > 0) {
                address payable account = payable(address(uint160(_additionalRoyalties[i])));
                uint basePoint = uint(_additionalRoyalties[i] >> 160);
                uint value = amount.bp(basePoint);
                transferFee(value, account);
            }
        }
    }

    // modifies `src`
    function _arrayReplace(bytes memory src, bytes memory replacement, bytes memory mask) internal view virtual {
        require(src.length == replacement.length);
        require(src.length == mask.length);

        uint256 length = src.length;
        for (uint256 i; i < length; ++i) {
            if (mask[i] != 0) {
                src[i] = replacement[i];
            }
        }
    }

    /**
        @notice returns true if this contract supports additional royalties for the marketpale
        now royalties support only for marketId = sudoswap
    */
    function supportsRoyalties(Markets marketId) internal pure returns (bool) {
        if (marketId == Markets.SudoSwap || marketId == Markets.LooksRare) {
            return true;
        }

        return false;
    }

    /**
        * @notice swaps tokenIn for ETH or WETH
        * @param swapDetails swapDetails required
     */
    function swapTokensForETHOrWETH(SwapDetailsIn memory swapDetails) internal returns (bool) {

        // Move tokenIn to contract
        IERC20TransferProxy(erc20TransferProxy).erc20safeTransferFrom(IERC20Upgradeable(swapDetails.tokenIn), _msgSender(), address(this), swapDetails.amountInMaximum);

        // Approve tokenIn on uniswap
        uint256 allowance = IERC20Upgradeable(swapDetails.tokenIn).allowance(address(uniswapRouterV3), address(this));
        if (allowance < swapDetails.amountInMaximum)
        {
            IERC20Upgradeable(swapDetails.tokenIn).approve(address(uniswapRouterV3), type(uint256).max);
        }

        // Set the order parameters
        ISwapRouterV3.ExactOutputSingleParams memory params = ISwapRouterV3.ExactOutputSingleParams(
            address(swapDetails.tokenIn), // tokenIn
            address(wethToken), // tokenOut
            3000, // fee
            address(this), // recipient
            block.timestamp, // deadline
            swapDetails.amountOut, // amountOut
            swapDetails.amountInMaximum, // amountInMaximum
            0 // sqrtPriceLimitX96
        );

        // Swap
        try uniswapRouterV3.exactOutputSingle(params) returns (uint256) {} catch {
            return false;
        }
        // Refund ETH from swap if any
        uniswapRouterV3.refundETH();

        // Unwrap if required
        if (swapDetails.unwrap)
        {
            IWETH(wethToken).withdraw(swapDetails.amountOut);
        }

        // Refund tokenIn left if any
        uint256 amountLeft = IERC20Upgradeable(swapDetails.tokenIn).balanceOf(address(this));
        if (amountLeft > 0)
        {
            IERC20Upgradeable(swapDetails.tokenIn).transfer(_msgSender(), amountLeft);
        }
       
        return true;
    }

    /**
        * @notice swaps ETH or WETH for tokenOut
        * @param swapDetails swapDetails required
     */
    function swapETHOrWethForTokens(SwapDetailsOut memory swapDetails) internal returns (bool) {

       // Move tokenIn to contract if ERC20
        if (!swapDetails.wrap)
        {
            IERC20TransferProxy(erc20TransferProxy).erc20safeTransferFrom(IERC20Upgradeable(swapDetails.tokenIn), _msgSender(), address(this), swapDetails.amountIn);
        }

        // Approve tokenIn on uniswap
        uint256 allowance = IERC20Upgradeable(wethToken).allowance(address(uniswapRouterV3), address(this));
        if (allowance < swapDetails.amountIn)
        {
            IERC20Upgradeable(wethToken).approve(address(uniswapRouterV3), type(uint256).max);
        }

        // Set the order parameters
        ISwapRouterV3.ExactInputSingleParams memory params = ISwapRouterV3.ExactInputSingleParams(
            address(wethToken), // tokenIn
            address(swapDetails.tokenOut), // tokenOut
            3000, // fee
            address(this), // recipient
            block.timestamp, // deadline
            swapDetails.amountIn, // amountIn
            swapDetails.amountOutMinimum, // amountOutMinimum
            0 // sqrtPriceLimitX96
        );

        // Swap
        try uniswapRouterV3.exactInputSingle(params) returns (uint256) {} catch {
            return false;
        }
        // Refund ETH from swap if any
        uniswapRouterV3.refundETH();

        return true;
    }

    receive() external payable {}
}