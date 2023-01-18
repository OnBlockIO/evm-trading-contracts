// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../royalties/Royalties2981TestImpl.sol";
import "../../royalties/LibRoyalties2981.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TestERC721WithRoyaltyV2981 is Initializable, Royalties2981TestImpl, ERC721Upgradeable, OwnableUpgradeable {
    /// @inheritdoc	ERC165Upgradeable
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Upgradeable) returns (bool) {
        return interfaceId == LibRoyalties2981._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }

    function initialize() public initializer {
        __Ownable_init_unchained();
    }
}
