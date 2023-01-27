// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract TestDummyERC721 is ERC721Upgradeable {
    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }
}
