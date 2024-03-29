// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../../librairies/LibERC721LazyMint.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

contract ERC721Test is EIP712Upgradeable {
    using AddressUpgradeable for address;
    using ECDSAUpgradeable for bytes32;

    function __ERC721Test_init() external initializer {
        __EIP712_init("Mint721", "1");
    }

    function recover(
        LibERC721LazyMint.Mint721Data memory data,
        bytes memory signature
    ) external view returns (address) {
        bytes32 structHash = LibERC721LazyMint.hash(data);
        bytes32 hash = _hashTypedDataV4(structHash);
        return hash.recover(signature);
    }
}
