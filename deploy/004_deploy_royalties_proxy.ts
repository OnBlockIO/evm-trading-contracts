import hre, {deployments, getNamedAccounts} from 'hardhat';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;

  console.log(`Royalties Proxy deployment on ${CHAIN} start`);

  const royalties_proxy = await deploy('RoyaltiesRegistry', {
    contract: 'RoyaltiesRegistry',
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: '__RoyaltiesRegistry_init',
          args: [],
        },
      },
    },
    log: true,
    skipIfAlreadyDeployed: false,
    deterministicDeployment: false,
    estimatedGasLimit: 10000000,
    estimateGasExtra: 10000000,
  });
  console.log('Royalties Proxy deployed at: ', royalties_proxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
