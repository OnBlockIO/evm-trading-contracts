// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

abstract contract IExchangeV2 {
    function setAssetMatcher(bytes4 assetType, address matcher) external virtual;
}
