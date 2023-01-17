// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./RoyaltiesArtBlocksImpl.sol";

contract TestERC721ArtBlocks is ERC721Upgradeable, RoyaltiesArtBlocksImpl {
    function mint(address to, uint256 tokenId) external {
        projects[tokenId].artistAddress = to;
        _mint(to, tokenId);
    }
}
