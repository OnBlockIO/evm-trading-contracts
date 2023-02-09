import {getSettings} from '../.config';
import hre, {deployments, getNamedAccounts} from 'hardhat';
import {ZERO} from '../test/utils/assets';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;
  const GHOSTMARKET = getSettings(CHAIN).exchange_proxy;
  const RARIBLE = getSettings(CHAIN)?.rarible || ZERO;
  const WYVERN = getSettings(CHAIN)?.wyvern || ZERO;
  const SEAPORT = getSettings(CHAIN)?.seaport || ZERO;
  const X2Y2 = getSettings(CHAIN)?.x2y2 || ZERO;
  const LOOKSRARE = getSettings(CHAIN)?.looksrare || ZERO;
  const SUDOSWAP = getSettings(CHAIN)?.sudoswap || ZERO;
  const BLUR = getSettings(CHAIN)?.blur || ZERO;
  if (!GHOSTMARKET) return;

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
          args: [GHOSTMARKET, RARIBLE, WYVERN, SEAPORT, X2Y2, LOOKSRARE, SUDOSWAP, BLUR],
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
