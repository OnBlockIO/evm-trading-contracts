import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {ethers} from 'hardhat';
import {COLLECTION, CRYPTO_PUNKS} from '../test/assets.js';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, get} = deployments;
  const {deployer} = await getNamedAccounts();

  const [TransferProxy, ERC20TransferProxy, RoyaltiesRegistry, AssetMatcherCollection, PunkTransferProxy] =
    await Promise.all([
      get('TransferProxy'),
      get('ERC20TransferProxy'),
      get('RoyaltiesRegistry'),
      get('AssetMatcherCollection'),
      get('PunkTransferProxy'),
    ]);

  const transferProxyContract = await ethers.getContractAt('TransferProxy', TransferProxy.address);
  const erc20TransferProxyContract = await ethers.getContractAt('ERC20TransferProxy', ERC20TransferProxy.address);
  const royaltiesRegistryContract = await ethers.getContractAt('RoyaltiesRegistry', RoyaltiesRegistry.address);
  const assetMatcherCollectionContract = await ethers.getContractAt(
    'AssetMatcherCollection',
    AssetMatcherCollection.address
  );
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
            royaltiesRegistryContract.address,
          ],
        },
      },
    },
    log: true,
  });

  // add ExchangeV2 proxy address to the the allowed operators of transferProxy & erc20TransferProxy
  await transferProxyContract.addOperator(ExchangeV2_Proxy.address);
  await erc20TransferProxyContract.addOperator(ExchangeV2_Proxy.address);

  // set collection asset matcher
  const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', ExchangeV2_Proxy.address);
  await exchangeV2Contract.setAssetMatcher(COLLECTION, assetMatcherCollectionContract.address);

  // set punk transfer proxy
  const punkTransferProxyContract = await ethers.getContractAt('PunkTransferProxy', PunkTransferProxy.address);
  await exchangeV2Contract.setTransferProxy(CRYPTO_PUNKS, punkTransferProxyContract.address);

  console.log('deployer is: ', deployer);
  console.log('transferProxyContract deployed at: ', transferProxyContract.address);
  console.log('erc20TransferProxyContract deployed at: ', erc20TransferProxyContract.address);
  console.log('royaltiesRegistryContract deployed at: ', royaltiesRegistryContract.address);
  console.log('assetMatcherCollectionContract deployed at: ', assetMatcherCollectionContract.address);
  console.log('PunkTransferProxy deployed at: ', punkTransferProxyContract.address);
  console.log('exchangeV2Contract deployed at: ', exchangeV2Contract.address);
  console.log('exchangeFeeWallet is: ', deployer);
  console.log('fees value is: ', feesBP / 100 + '%');
};

export default func;
func.tags = ['ExchangeV2'];
module.exports.dependencies = [
  'TransferProxy',
  'ERC20TransferProxy',
  'RoyaltiesRegistry',
  'AssetMatcherCollection',
  'PunkTransferProxy',
];
