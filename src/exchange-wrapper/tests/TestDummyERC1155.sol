// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

contract TestDummyERC1155 is ERC1155Upgradeable {
    function mint(address to, uint tokenId, uint amount) external {
        _mint(to, tokenId, amount, "");
    }
}
