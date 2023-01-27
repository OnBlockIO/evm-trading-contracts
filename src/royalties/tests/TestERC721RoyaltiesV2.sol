// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../impl/RoyaltiesV2Impl.sol";
import "../LibRoyaltiesV2.sol";

contract TestERC721RoyaltiesV2 is RoyaltiesV2Impl, ERC721Upgradeable {
    function initialize() public initializer {
        // _registerInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES);
    }

    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }

    /// @inheritdoc	ERC165Upgradeable
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable) returns (bool) {
        return interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }
}
