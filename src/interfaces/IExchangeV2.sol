// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

abstract contract IExchangeV2 {
    function setAssetMatcher(bytes4 assetType, address matcher) external virtual;
}
