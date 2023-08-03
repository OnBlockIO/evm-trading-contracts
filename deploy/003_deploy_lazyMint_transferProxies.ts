import hre, {deployments, getNamedAccounts} from 'hardhat';

async function main() {
  const {deploy, execute} = deployments;
  const {deployer} = await getNamedAccounts();

  const CHAIN = hre.network.name;

  console.log(`ERC721 Lazy Mint Proxy deployment on ${CHAIN} start`);

  const erc721LazyMintTransferProxy = await deploy('ERC721LazyMintTransferProxy', {
    from: deployer,
    log: true,
  });

  await execute('ERC721LazyMintTransferProxy', {from: deployer, log: true}, '__OperatorRole_init');

  console.log('ERC721 Lazy Mint Proxy deployed at: ', erc721LazyMintTransferProxy.address);

  console.log(`ERC1155 Lazy Mint Proxy deployment on ${CHAIN} start`);

  const erc1155LazyMintTransferProxy = await deploy('ERC1155LazyMintTransferProxy', {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: false,
    deterministicDeployment: false,
    estimatedGasLimit: 10000000,
    estimateGasExtra: 10000000
  });

  await execute('ERC1155LazyMintTransferProxy', {from: deployer, log: true}, '__OperatorRole_init');

  console.log('ERC1155 Lazy Mint Proxy deployed at: ', erc1155LazyMintTransferProxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
