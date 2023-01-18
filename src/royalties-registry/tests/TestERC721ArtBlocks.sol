// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../providers/RoyaltiesArtBlocksImpl.sol";

contract TestERC721ArtBlocks is ERC721Upgradeable, RoyaltiesArtBlocksImpl {
    function mint(address to, uint256 tokenId) external {
        projects[tokenId].artistAddress = to;
        _mint(to, tokenId);
    }
}
