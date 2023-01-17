// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "../../royalties/IRoyaltiesProvider.sol";
import "../../librairies/LibPart.sol";

contract RoyaltiesRegistryTest {
    event getRoyaltiesTest(LibPart.Part[] royalties);

    function _getRoyalties(address royaltiesTest, address token, uint256 tokenId) external {
        IRoyaltiesProvider withRoyalties = IRoyaltiesProvider(royaltiesTest);
        LibPart.Part[] memory royalties = withRoyalties.getRoyalties(token, tokenId);
        emit getRoyaltiesTest(royalties);
    }
}
