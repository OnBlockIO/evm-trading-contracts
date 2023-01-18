import {getSettings} from '../.config';
import hre, {deployments, getNamedAccounts} from 'hardhat';
import {ethers} from 'hardhat';
import {ERC721_LAZY, ERC1155_LAZY, COLLECTION, CRYPTO_PUNK} from '../test/utils/assets.js';

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
  const PUNK_TRANSFER_PROXY = getSettings(CHAIN).punk_transfer_proxy;
  if (!FEES || !TRANSFER_PROXY || !ERC20_TRANSFER_PROXY || !ROYALTIES_PROXY) return;

  console.log(`ExchangeV2 deployment on ${CHAIN} start`);

  const exchange_proxy = await deploy('ExchangeV2', {
    contract: 'RoyaltiesRegistry',
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
  });

  // add ExchangeV2 proxy address to the the allowed operators of transferProxy & erc20TransferProxy
  await TRANSFER_PROXY.addOperator(exchange_proxy.address);
  await ERC20_TRANSFER_PROXY.addOperator(exchange_proxy.address);

  // if required, set lazy mint proxies
  if (ERC721_LAZY_MINT_PROXY && ERC1155_LAZY_MINT_PROXY) {
    const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', exchange_proxy.address);
    await exchangeV2Contract.setTransferProxy(ERC721_LAZY, ERC721_LAZY_MINT_PROXY);
    await exchangeV2Contract.setTransferProxy(ERC1155_LAZY, ERC1155_LAZY_MINT_PROXY);
  }

  // if required, set collection asset matcher
  if (CUSTOM_MATCHER) {
    const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', exchange_proxy.address);
    await exchangeV2Contract.setAssetMatcher(COLLECTION, CUSTOM_MATCHER.address);
  }

  // if required, set punk transfer proxy
  if (PUNK_TRANSFER_PROXY) {
    const punkTransferProxyContract = await ethers.getContractAt('PunkTransferProxy', PUNK_TRANSFER_PROXY.address);
    const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', exchange_proxy.address);
    await exchangeV2Contract.setTransferProxy(CRYPTO_PUNK, punkTransferProxyContract.address);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
