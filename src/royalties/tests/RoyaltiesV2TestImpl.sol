// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../impl/RoyaltiesV2Impl.sol";

contract RoyaltiesV2TestImpl is RoyaltiesV2Impl {
    function saveRoyalties(uint256 id, LibPart.Part[] memory royalties) external {
        _saveRoyalties(id, royalties);
    }

    function updateAccount(uint256 id, address from, address to) external {
        _updateAccount(id, from, to);
    }
}
