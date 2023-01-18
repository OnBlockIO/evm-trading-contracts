// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../../royalties/IRoyaltiesProvider.sol";
import "../../librairies/LibPart.sol";

contract RoyaltiesProviderTest is IRoyaltiesProvider {
    mapping(address => mapping(uint256 => LibPart.Part[])) internal royaltiesTest;

    function initializeProvider(address token, uint256 tokenId, LibPart.Part[] memory royalties) public {
        delete royaltiesTest[token][tokenId];
        uint256 length = royalties.length;
        for (uint256 i; i < length; ++i) {
            royaltiesTest[token][tokenId].push(royalties[i]);
        }
    }

    function getRoyalties(address token, uint256 tokenId) external view override returns (LibPart.Part[] memory) {
        return royaltiesTest[token][tokenId];
    }
}
