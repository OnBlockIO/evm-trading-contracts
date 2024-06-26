import {getSettings} from '../.config';
import hre, {deployments, getNamedAccounts} from 'hardhat';
import {ethers} from 'hardhat';
import {ERC721_LAZY, ERC1155_LAZY, COLLECTION} from '../test/utils/assets';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;
  const FEES = getSettings(CHAIN).fees;
  const TRANSFER_PROXY = getSettings(CHAIN).transferProxy;
  const ERC20_TRANSFER_PROXY = getSettings(CHAIN).erc20TransferProxy;
  const ERC721_LAZY_MINT_PROXY = getSettings(CHAIN).erc721LazyMintTransferProxy;
  const ERC1155_LAZY_MINT_PROXY = getSettings(CHAIN).erc1155LazyMintTransferProxy;
  const ROYALTIES_PROXY = getSettings(CHAIN).royalties_proxy;
  const CUSTOM_MATCHER = getSettings(CHAIN).customMatcher;
  if (!TRANSFER_PROXY || !ERC20_TRANSFER_PROXY || !ROYALTIES_PROXY) return;

  console.log(`ExchangeV2 deployment on ${CHAIN} start`);

  const exchange_proxy = await deploy('ExchangeV2', {
    contract: 'ExchangeV2',
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: '__ExchangeV2_init',
          args: [TRANSFER_PROXY, ERC20_TRANSFER_PROXY, FEES, deployer, ROYALTIES_PROXY],
        },
      },
    },
    log: true,
    skipIfAlreadyDeployed: false,
    deterministicDeployment: false,
    estimatedGasLimit: 10000000,
    estimateGasExtra: 10000000,
  });

  // add ExchangeV2 proxy address to the the allowed operators of transferProxy & erc20TransferProxy
  const proxyNFTContract = await ethers.getContractAt('TransferProxy', TRANSFER_PROXY);
  await proxyNFTContract.addOperator(exchange_proxy.address);
  const proxyERC20Contract = await ethers.getContractAt('ERC20TransferProxy', ERC20_TRANSFER_PROXY);
  await proxyERC20Contract.addOperator(exchange_proxy.address);

  // if required, set lazy mint proxies
  if (ERC721_LAZY_MINT_PROXY && ERC1155_LAZY_MINT_PROXY) {
    const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', exchange_proxy.address);
    await exchangeV2Contract.setTransferProxy(ERC721_LAZY, ERC721_LAZY_MINT_PROXY);
    await exchangeV2Contract.setTransferProxy(ERC1155_LAZY, ERC1155_LAZY_MINT_PROXY);
  }

  // if required, set collection asset matcher
  if (CUSTOM_MATCHER) {
    const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', exchange_proxy.address);
    await exchangeV2Contract.setAssetMatcher(COLLECTION, CUSTOM_MATCHER);
  }

  console.log('ExchangeV2 deployed at: ', exchange_proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
