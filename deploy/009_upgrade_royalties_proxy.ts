import hre, {deployments, getNamedAccounts} from 'hardhat';
import { getSettings } from '../.config';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;
  const ROYALTIES_PROXY = getSettings(CHAIN).royalties_proxy;
  if (!ROYALTIES_PROXY) return;
  
  console.log(`Royalties Proxy upgrade on ${CHAIN} start`);

  const royalties_proxy = await deploy('RoyaltiesRegistry', {
    contract: 'RoyaltiesRegistry',
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy'
    },
    log: true,
  });
  console.log('Royalties Proxy upgraded at: ', royalties_proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
