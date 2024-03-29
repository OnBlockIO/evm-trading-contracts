// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "../TransferExecutor.sol";

contract TransferExecutorTest is Initializable, OwnableUpgradeable, TransferExecutor {
    function __TransferExecutorTest_init(address _transferProxy, address _erc20TransferProxy) external initializer {
        __Ownable_init_unchained();
        __TransferExecutor_init_unchained(_transferProxy, _erc20TransferProxy);
    }

    function transferTest(LibAsset.Asset calldata asset, address from, address to) external payable {
        TransferExecutor.transfer(asset, from, to, proxies[asset.assetType.assetClass]);
    }
}
