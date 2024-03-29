// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../ERC721Upgradeable.sol";
import "../../interfaces/IERC721LazyMint.sol";

contract ERC721LazyMintTest is IERC721LazyMint, ERC721Upgradeable {
    function mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to) external override {
        _mint(to, data.tokenId);
    }

    function transferFromOrMint(LibERC721LazyMint.Mint721Data memory data, address from, address to) external override {
        if (_exists(data.tokenId)) {
            safeTransferFrom(from, to, data.tokenId);
        } else {
            this.mintAndTransfer(data, to);
        }
    }

    function encode(LibERC721LazyMint.Mint721Data memory data) external view returns (bytes memory) {
        return abi.encode(address(this), data);
    }
}
