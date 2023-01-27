import {getSettings} from '../.config';
import hre, {deployments, getNamedAccounts} from 'hardhat';

async function main() {
  const {deploy, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;
  const GHOSTMARKET = getSettings(CHAIN).exchange_proxy;
  const RARIBLE = getSettings(CHAIN).rarible;
  const WYVERN = getSettings(CHAIN).wyvernExchange;
  const SEAPORT = getSettings(CHAIN).seaport;
  const X2Y2 = getSettings(CHAIN).x2y2;
  const LOOKSRARE = getSettings(CHAIN).looksRare;
  const SUDOSWAP = getSettings(CHAIN).sudoswap;
  if (!GHOSTMARKET || !RARIBLE || !WYVERN || !SEAPORT || !X2Y2 || !LOOKSRARE || !SUDOSWAP) return;

  console.log(`Exchange Wrapper deployment on ${CHAIN} start`);

  const transferProxy = await deploy('TransferProxy', {
    from: deployer,
    log: true,
  });

  await execute('TransferProxy', {from: deployer, log: true}, '__TransferProxy_init');

  console.log('Exchange Wrapper deployed at: ', transferProxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
