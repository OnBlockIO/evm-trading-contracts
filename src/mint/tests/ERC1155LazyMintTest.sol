// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../ERC1155Upgradeable.sol";
import "../../interfaces/IERC1155LazyMint.sol";
import "../../librairies/LibERC1155LazyMint.sol";

contract ERC1155LazyMintTest is IERC1155LazyMint, ERC1155Upgradeable {
    function mintAndTransfer(
        LibERC1155LazyMint.Mint1155Data memory data,
        address to,
        uint256 _amount
    ) external override {
        _mint(to, data.tokenId, _amount, "");
    }

    function transferFromOrMint(
        LibERC1155LazyMint.Mint1155Data memory data,
        address from,
        address to,
        uint256 amount
    ) external override {
        uint256 balance = balanceOf(from, data.tokenId);
        if (balance != 0) {
            safeTransferFrom(from, to, data.tokenId, amount, "");
        } else {
            this.mintAndTransfer(data, to, amount);
        }
    }

    function encode(LibERC1155LazyMint.Mint1155Data memory data) external view returns (bytes memory) {
        return abi.encode(address(this), data);
    }
}
