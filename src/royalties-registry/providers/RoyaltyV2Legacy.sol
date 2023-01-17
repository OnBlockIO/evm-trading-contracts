// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "../../lib/LibPart.sol";

interface RoyaltyV2Legacy {
    event RoyaltiesSet(uint256 tokenId, LibPart.Part[] royalties);

    function getRoyalties(uint256 id) external view returns (LibPart.Part[] memory);
}
