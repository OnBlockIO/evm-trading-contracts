// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../royalties/impl/RoyaltiesV2Impl.sol";
import "../../royalties/LibRoyaltiesV2.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TestERC721WithRoyaltiesV2OwnableUpgradeable is
    Initializable,
    RoyaltiesV2Impl,
    ERC721Upgradeable,
    OwnableUpgradeable
{
    /// @inheritdoc	ERC165Upgradeable
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable) returns (bool) {
        return interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }

    function initialize() public initializer {
        __Ownable_init_unchained();
    }

    function mint(address to, uint256 tokenId, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }
}
