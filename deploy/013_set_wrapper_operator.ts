import hre, {ethers} from 'hardhat';
import {getSettings} from '../.config';

async function main() {
  const CHAIN = hre.network.name;
  const ERC20_TRANSFER_PROXY = getSettings(CHAIN).erc20TransferProxy;
  const WRAPPER = getSettings(CHAIN).exchange_wrapper_proxy;
  if (!ERC20_TRANSFER_PROXY || !WRAPPER) return;

  console.log(`Setting wrapper proxies on ${CHAIN} start`);

  const proxyContract = await ethers.getContractAt('ERC20TransferProxy', ERC20_TRANSFER_PROXY);
  await proxyContract.addOperator(WRAPPER);
  console.log('Wrapper proxies set');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
