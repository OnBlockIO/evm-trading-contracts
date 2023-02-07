import hre, {deployments, getNamedAccounts} from 'hardhat';
import { getSettings } from '../.config';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;
  const WRAPPER = getSettings(CHAIN).exchange_wrapper_proxy;
  if (!WRAPPER) return;

  console.log(`ExchangeWrapper upgrade on ${CHAIN} start`);

  const exchange_wrapper_proxy = await deploy('ExchangeWrapper', {
    contract: 'ExchangeWrapper',
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
    },
    log: true,
  });
  console.log('ExchangeWrapper upgraded at: ', exchange_wrapper_proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
