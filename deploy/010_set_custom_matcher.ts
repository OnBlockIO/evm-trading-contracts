import hre, { ethers } from 'hardhat';
import { getSettings } from '../.config';
import { COLLECTION } from '../test/utils/assets';

async function main() {
  const CHAIN = hre.network.name;
  const GHOSTMARKET = getSettings(CHAIN).exchange_proxy;
  const CUSTOM_MATCHER = getSettings(CHAIN).customMatcher;
  if (!GHOSTMARKET || !CUSTOM_MATCHER) return;

  console.log(`Setting custom matcher on ${CHAIN} start`);

  const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', GHOSTMARKET);
  await exchangeV2Contract.setAssetMatcher(COLLECTION, CUSTOM_MATCHER);
  console.log('Custom matcher set');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
