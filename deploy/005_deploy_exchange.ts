import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {ethers} from 'hardhat';

import {COLLECTION} from '../test/assets.js';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const transferProxyContract = await ethers.getContract('TransferProxy');
  const erc20TransferProxyContract = await ethers.getContract(
    'ERC20TransferProxy'
  );
  const royaltiesRegistryContract = await ethers.getContract('RoyaltiesRegistry');
  const assetMatcherCollectionContract = await ethers.getContract('AssetMatcherCollection');
  const feesBP = 200;

  const ExchangeV2_Proxy = await deploy('ExchangeV2', {
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: '__ExchangeV2_init',
          args: [
            transferProxyContract.address,
            erc20TransferProxyContract.address,
            feesBP,
            deployer,
            royaltiesRegistryContract.address
          ],
        },
      },
    },
    log: true,
  });

  //add ExchangeV2 proxy address to the the allowed operators of transferProxy & erc20TransferProxy
  await transferProxyContract.addOperator(ExchangeV2_Proxy.address);
  await erc20TransferProxyContract.addOperator(ExchangeV2_Proxy.address);

  //set initial asset matcher collection
  const exchangeV2Contract = await ethers.getContract('ExchangeV2');
  await exchangeV2Contract.setAssetMatcher(COLLECTION, assetMatcherCollectionContract.address);

  console.log('transferProxyContract deployed at: ', transferProxyContract.address);
  console.log('erc20TransferProxyContract deployed at: ', erc20TransferProxyContract.address);
  console.log('royaltiesRegistryContract deployed at: ', royaltiesRegistryContract.address);
  console.log('exchangeFeeWallet is: ', deployer);
  console.log('fees value is: ', feesBP / 100 + '%');
};
export default func;
func.tags = ['ExchangeV2'];
module.exports.dependencies = ['TransferProxy', 'ERC20TransferProxy', 'RoyaltiesRegistry', 'AssetMatcherCollection'];
