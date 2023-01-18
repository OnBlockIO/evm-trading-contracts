// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../librairies/LibPart.sol";

interface RoyaltiesGhostMarketV2 {
    function getGhostMarketV2Royalties(uint256 id) external view returns (LibPart.Part[] memory);
}
