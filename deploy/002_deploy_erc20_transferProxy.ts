import hre, {deployments, getNamedAccounts} from 'hardhat';

async function main() {
  const {deploy, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;

  console.log(`ERC20 TransferProxy deployment on ${CHAIN} start`);

  const erc20TransferProxy = await deploy('ERC20TransferProxy', {
    from: deployer,
    log: true,
  });

  await execute('ERC20TransferProxy', {from: deployer, log: true}, '__ERC20TransferProxy_init');

  console.log('ERC20 TransferProxy deployed at: ', erc20TransferProxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
