// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../../librairies/LibPart.sol";

abstract contract RoyaltyArtBlocks {
    function getRoyaltyData(
        uint256 _tokenId
    )
        external
        view
        virtual
        returns (
            address artistAddress,
            address additionalPayee,
            uint256 additionalPayeePercentage,
            uint256 royaltyFeeByID
        );
}
