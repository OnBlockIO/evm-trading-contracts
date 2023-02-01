import {getSettings} from '../.config';
import hre, {deployments, getNamedAccounts} from 'hardhat';
import { ZERO } from '../test/utils/assets';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;
  const GHOSTMARKET = getSettings(CHAIN).exchange_proxy;
  const RARIBLE = getSettings(CHAIN)?.rarible || ZERO;
  const WYVERN = getSettings(CHAIN)?.wyvernExchange || ZERO;
  const SEAPORT = getSettings(CHAIN)?.seaport || ZERO;
  const X2Y2 = getSettings(CHAIN)?.x2y2 || ZERO;
  const LOOKSRARE = getSettings(CHAIN)?.looksRare || ZERO;
  const SUDOSWAP = getSettings(CHAIN)?.sudoswap || ZERO;

  console.log(`Exchange Wrapper deployment on ${CHAIN} start`);

  const exchange_wrapper_proxy = await deploy('ExchangeWrapper', {
    contract: 'ExchangeWrapper',
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: '__ExchangeWrapper_init',
          args: [GHOSTMARKET, RARIBLE, WYVERN, SEAPORT, X2Y2, LOOKSRARE, SUDOSWAP],
        },
      },
    },
    log: true,
  });

  console.log('Exchange Wrapper deployed at: ', exchange_wrapper_proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});