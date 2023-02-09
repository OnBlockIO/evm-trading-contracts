import hre, {ethers} from 'hardhat';
import {getSettings} from '../.config';
import {ERC1155_LAZY, ERC721_LAZY} from '../test/utils/assets';

async function main() {
  const CHAIN = hre.network.name;
  const GHOSTMARKET = getSettings(CHAIN).exchange_proxy;
  const ERC721_LAZY_MINT_PROXY = getSettings(CHAIN).erc721LazyMintTransferProxy;
  const ERC1155_LAZY_MINT_PROXY = getSettings(CHAIN).erc1155LazyMintTransferProxy;
  if (!GHOSTMARKET || !ERC721_LAZY_MINT_PROXY || !ERC1155_LAZY_MINT_PROXY) return;

  console.log(`Setting lazy mint proxies on ${CHAIN} start`);

  const exchangeV2Contract = await ethers.getContractAt('ExchangeV2', GHOSTMARKET);
  await exchangeV2Contract.setTransferProxy(ERC721_LAZY, ERC721_LAZY_MINT_PROXY);
  await exchangeV2Contract.setTransferProxy(ERC1155_LAZY, ERC1155_LAZY_MINT_PROXY);
  console.log('Lazy mint proxies set');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
