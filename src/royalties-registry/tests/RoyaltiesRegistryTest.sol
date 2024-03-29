// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../../interfaces/IRoyaltiesProvider.sol";
import "../../librairies/LibPart.sol";

contract RoyaltiesRegistryTest {
    event GetRoyaltiesTest(LibPart.Part[] royalties);

    function _getRoyalties(address royaltiesTest, address token, uint256 tokenId) external {
        IRoyaltiesProvider withRoyalties = IRoyaltiesProvider(royaltiesTest);
        LibPart.Part[] memory royalties = withRoyalties.getRoyalties(token, tokenId);
        emit GetRoyaltiesTest(royalties);
    }
}
