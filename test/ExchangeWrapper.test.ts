/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {
  ERC20TransferProxy,
  TransferProxy,
  ExchangeV2,
  RoyaltiesRegistry,
  TestERC20,
  GhostMarketERC1155,
  TestERC721RoyaltiesV2,
  TestERC1155RoyaltiesV2,
  TestHelper,
} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Asset, Order} from './utils/order';
import EIP712 from './utils/EIP712';
import {
  ZERO,
  ORDER_DATA_V1,
  ORDER_DATA_V2,
  ORDER_DATA_V3_SELL,
  ORDER_DATA_V3_BUY,
  ERC721,
  ERC1155,
  ERC20,
  ETH,
  enc,
} from './utils/assets';
import {ethers, upgrades} from 'hardhat';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL, DATA} from './utils/constants';
import {getLastTokenID, verifyBalanceChange} from './utils/helpers';

describe('Exchange Test', async function () {
  let addOperator = false;
  let exchangeV2Proxy: ExchangeV2;
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let ghostERC1155: GhostMarketERC1155;
  let royaltiesRegistryProxy: RoyaltiesRegistry;
  let testHelper: TestHelper;
  let testERC20: TestERC20;
  let t1: TestERC20;
  let t2: TestERC20;
  let erc721WithRoyalties: TestERC721RoyaltiesV2;
  let erc1155WithRoyalties: TestERC1155RoyaltiesV2;
  let wallet0: SignerWithAddress;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;
  let wallet4: SignerWithAddress;
  let wallet5: SignerWithAddress;
  let wallet6: SignerWithAddress;
  let wallet7: SignerWithAddress;
  let protocol: SignerWithAddress;
  let community: SignerWithAddress;
  let makerLeft: SignerWithAddress;
  let makerRight: SignerWithAddress;
  const MARKET_MARKER_SELL = '0x67686f73746d61726b65745f76335f73656c6c00000000000000000000000000'; // ghostmarket_v3_sell
  const MARKET_MARKER_BUY = '0x67686f73746d61726b65745f76335f6275790000000000000000000000000000'; // ghostmarket_v3_buy
  const erc721TokenId1 = '53';
  const erc1155TokenId1 = '54';

  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    wallet0 = accounts[0];
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    wallet4 = accounts[4];
    wallet5 = accounts[5];
    wallet6 = accounts[6];
    wallet7 = accounts[7];
    community = accounts[8];
    protocol = accounts[9];
    makerLeft = accounts[1];
    makerRight = accounts[2];
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const ExchangeV2Test = await ethers.getContractFactory('ExchangeV2');
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    const TestERC721V1 = await ethers.getContractFactory('GhostMarketERC721');
    const TestGhostERC1155 = await ethers.getContractFactory('GhostMarketERC1155');
    const ERC721WithRoyalties = await ethers.getContractFactory('TestERC721RoyaltiesV2');
    const ERC1155WithRoyalties = await ethers.getContractFactory('TestERC1155RoyaltiesV2');
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    const TestHelper = await ethers.getContractFactory('TestHelper');

    addOperator = true;

    transferProxy = await TransferProxyTest.deploy();
    await transferProxy.__TransferProxy_init();

    erc20TransferProxy = await ERC20TransferProxyTest.deploy();
    await erc20TransferProxy.__ERC20TransferProxy_init();

    royaltiesRegistryProxy = await RoyaltiesRegistry.deploy();
    await royaltiesRegistryProxy.__RoyaltiesRegistry_init();

    exchangeV2Proxy = <ExchangeV2>(
      await upgrades.deployProxy(
        ExchangeV2Test,
        [transferProxy.address, erc20TransferProxy.address, 300, protocol.address, royaltiesRegistryProxy.address],
        {initializer: '__ExchangeV2_init'}
      )
    );
    t1 = await TestERC20.deploy();
    t2 = await TestERC20.deploy();

    await upgrades.deployProxy(TestERC721V1, [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI], {
      initializer: 'initialize',
      unsafeAllowCustomTypes: true,
    });

    ghostERC1155 = <GhostMarketERC1155>await upgrades.deployProxy(
      TestGhostERC1155,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    );

    await transferProxy.addOperator(exchangeV2Proxy.address);
    await erc20TransferProxy.addOperator(exchangeV2Proxy.address);

    erc721WithRoyalties = await ERC721WithRoyalties.deploy();
    erc1155WithRoyalties = await ERC1155WithRoyalties.deploy();

    if (addOperator) {
      await transferProxy.addOperator(exchangeV2Proxy.address);
      await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    }

    testHelper = await TestHelper.deploy();
  });
});
