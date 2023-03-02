import hre, {deployments, getNamedAccounts} from 'hardhat';
import {getSettings} from '../.config';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;
  const GHOSTMARKET = getSettings(CHAIN).exchange_proxy;
  if (!GHOSTMARKET) return;

  console.log(`ExchangeV2 upgrade on ${CHAIN} start`);

  const exchange_proxy = await deploy('ExchangeV2', {
    contract: 'ExchangeV2',
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
    },
    log: true,
  });
  console.log('ExchangeV2 upgraded at: ', exchange_proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
