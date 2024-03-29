// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../royalties/impl/RoyaltiesV2LegacyImpl.sol";

contract TestERC721RoyaltyV2Legacy is ERC721Upgradeable, RoyaltiesV2LegacyImpl {
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
