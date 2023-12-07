import hre, {deployments, getNamedAccounts} from 'hardhat';

async function main() {
  const {deploy, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;

  console.log(`TransferProxy deployment on ${CHAIN} start`);

  const transferProxy = await deploy('TransferProxy', {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: false,
    deterministicDeployment: false,
    estimatedGasLimit: 10000000,
    estimateGasExtra: 10000000,
  });

  await execute('TransferProxy', {from: deployer, log: true}, '__TransferProxy_init');

  console.log('TransferProxy deployed at: ', transferProxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
