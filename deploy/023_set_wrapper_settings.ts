import hre, {ethers} from 'hardhat';
import {getSettings} from '../.config';
import {
  MARKET_ID_GHOSTMARKET,
  MARKET_ID_RARIBLE,
  MARKET_ID_SEAPORT_1_5,
  MARKET_ID_SEAPORT_1_6,
  MARKET_ID_LOOKSRARE,
  MARKET_ID_X2Y2,
} from '../test/utils/constants';

async function main() {
  const CHAIN = hre.network.name;
  const ERC20_TRANSFER_PROXY = getSettings(CHAIN).erc20TransferProxy;
  const WRAPPER = getSettings(CHAIN).exchange_wrapper_proxy;
  const WRAPPED_TOKEN = getSettings(CHAIN).wrapped;
  // const RARIBLE_ERC20_TRANSFER_PROXY = ZERO; // CUSTOM ERC20 PROXY
  const OPENSEA_1_5_ERC20_TRANSFER_PROXY = getSettings(CHAIN).seaport_1_5;
  const OPENSEA_1_6_ERC20_TRANSFER_PROXY = getSettings(CHAIN).seaport_1_6;
  // const LOOKSRARE_ERC20_TRANSFER_PROXY = getSettings(CHAIN).looksrare;
  // const X2Y2_ERC20_TRANSFER_PROXY = getSettings(CHAIN).x2y2;
  // const UNISWAP_V2 = getSettings(CHAIN).uniswapV2;
  // const UNISWAP_V3 = getSettings(CHAIN).uniswapV3;
  if (!ERC20_TRANSFER_PROXY || !WRAPPER || !WRAPPED_TOKEN) return;

  console.log(`Setting wrapper settings on ${CHAIN} start`);

  const proxyContract = await ethers.getContractAt('ERC20TransferProxy', ERC20_TRANSFER_PROXY);
  // set wrapper as an operator
  await proxyContract.addOperator(WRAPPER);

  const wrapperContract = await ethers.getContractAt('ExchangeWrapper', WRAPPER);
  // set wrapped token on wrapper
  // await wrapperContract.setWrapped(WRAPPED_TOKEN);
  // set erc20 transfer proxy for wrapper
  // await wrapperContract.setTransferProxy(ERC20_TRANSFER_PROXY);
  // set ghostmarket erc20 transfer proxy on wrapper
  // await wrapperContract.setMarketProxy(MARKET_ID_GHOSTMARKET, ERC20_TRANSFER_PROXY);

  // set other erc20 transfer proxy on wrapper
  // await wrapperContract.setMarketProxy(MARKET_ID_RARIBLE, RARIBLE_ERC20_TRANSFER_PROXY);
  await wrapperContract.setMarketProxy(MARKET_ID_SEAPORT_1_5, OPENSEA_1_5_ERC20_TRANSFER_PROXY);
  await wrapperContract.setMarketProxy(MARKET_ID_SEAPORT_1_6, OPENSEA_1_6_ERC20_TRANSFER_PROXY);
  // await wrapperContract.setMarketProxy(MARKET_ID_LOOKSRARE, LOOKSRARE_ERC20_TRANSFER_PROXY);
  // await wrapperContract.setMarketProxy(MARKET_ID_X2Y2, X2Y2_ERC20_TRANSFER_PROXY);

  await wrapperContract.setSeaport16(getSettings(CHAIN).seaport_1_6);
  await wrapperContract.setSeaport15(getSettings(CHAIN).seaport_1_5);

  // set uniswap config on wrapper
  //await wrapperContract.setUniswapV2(UNISWAP_V2);
  //await wrapperContract.setUniswapV3(UNISWAP_V3);

  console.log('Wrapper settings set');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
