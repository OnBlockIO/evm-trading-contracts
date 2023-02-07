import hre, {deployments, getNamedAccounts} from 'hardhat';

async function main() {
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;

  console.log(`AssetMatcherCollection deployment on ${CHAIN} start`);

  const assetMatcherCollection = await deploy('AssetMatcherCollection', {
    from: deployer,
    log: true,
  });

  console.log('AssetMatcherCollection deployed at: ', assetMatcherCollection.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
