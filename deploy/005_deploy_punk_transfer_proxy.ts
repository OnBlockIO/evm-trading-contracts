import hre, {deployments, getNamedAccounts} from 'hardhat';

async function main() {
  const {deploy, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;

  console.log(`Punk Transfer Proxy deployment on ${CHAIN} start`);

  const punk_transfer_proxy = await deploy('PunkTransferProxy', {
    from: deployer,
    log: true,
  });

  await execute('PunkTransferProxy', {from: deployer, log: true}, '__OperatorRole_init');

  console.log('Punk Transfer Proxy deployed at: ', punk_transfer_proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
