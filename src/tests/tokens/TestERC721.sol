// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestERC721 is ERC721Upgradeable {
    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
