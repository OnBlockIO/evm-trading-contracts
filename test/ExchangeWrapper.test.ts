/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {
  ERC20TransferProxy,
  TransferProxy,
  ExchangeV2,
  ExchangeWrapper,
  RoyaltiesRegistry,
  TestDummyERC20,
  TestDummyERC721,
  TestDummyERC1155,
  TestHelper,
  MockUniswapV2Router,
  MockUniswapV3Router,
  WrapperHelper,
  LooksRareTestHelper,
} from '../typechain';
// seaport
import SeaportArtifact from '../src/exchange-wrapper/artifacts/Seaport.json';
import ConduitControllerArtifact from '../src/exchange-wrapper/artifacts/ConduitController.json';
// looksrare
import LooksRareProtocolArtifact from '../src/exchange-wrapper/artifacts/LooksRareProtocol.json';
import WETH9Artifact from '../src/exchange-wrapper/artifacts/WETH9.json';
import TransferManagerArtifact from '../src/exchange-wrapper/artifacts/TransferManager.json';
import StrategyCollectionOfferArtifact from '../src/exchange-wrapper/artifacts/StrategyCollectionOffer.json';
// x2y2
import ERC721DelegateArtifact from '../src/exchange-wrapper/artifacts/ERC721Delegate.json';
import ERC1155DelegateArtifact from '../src/exchange-wrapper/artifacts/ERC1155Delegate.json';
import X2Y2_r1Artifact from '../src/exchange-wrapper/artifacts/X2Y2_r1.json';
// sudoswap
import LSSVMPairEnumerableERC20Artifact from '../src/exchange-wrapper/artifacts/LSSVMPairEnumerableERC20.json';
import LSSVMPairEnumerableETHArtifact from '../src/exchange-wrapper/artifacts/LSSVMPairEnumerableETH.json';
import LSSVMPairMissingEnumerableERC20Artifact from '../src/exchange-wrapper/artifacts/LSSVMPairMissingEnumerableERC20.json';
import LSSVMPairMissingEnumerableETHArtifact from '../src/exchange-wrapper/artifacts/LSSVMPairMissingEnumerableETH.json';
import LSSVMPairFactoryArtifact from '../src/exchange-wrapper/artifacts/LSSVMPairFactory.json';
import LSSVMRouterArtifact from '../src/exchange-wrapper/artifacts/LSSVMRouter.json';
import LinearCurveArtifact from '../src/exchange-wrapper/artifacts/LinearCurve.json';
import ExponentialCurveArtifact from '../src/exchange-wrapper/artifacts/ExponentialCurve.json';
// blur
import BlurExchangeArtifact from '../src/exchange-wrapper/artifacts/BlurExchange.json';
import ExecutionDelegateArtifact from '../src/exchange-wrapper/artifacts/ExecutionDelegate.json';
import PolicyManagerArtifact from '../src/exchange-wrapper/artifacts/PolicyManager.json';
import StandardPolicyERC721Artifact from '../src/exchange-wrapper/artifacts/StandardPolicyERC721.json';

import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
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
import {verifyBalanceChange, verifyBalanceChangeReturnTx} from './utils/helpers';
import {
  MARKET_ID_GHOSTMARKET,
  MARKET_ID_LOOKSRARE,
  MARKET_ID_RARIBLE,
  MARKET_ID_SEAPORT_1_5,
  MARKET_ID_X2Y2,
  MARKET_ID_SUDOSWAP,
  MARKET_ID_BLUR,
} from './utils/constants';

describe('ExchangeWrapper Test', async function () {
  let rarible: ExchangeV2;
  let exchangeV2Proxy: ExchangeV2;
  let bulkExchange: ExchangeWrapper;
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let erc20: TestDummyERC20;
  let erc202: TestDummyERC20;
  let erc721: TestDummyERC721;
  let erc1155: TestDummyERC1155;
  let royaltiesRegistryProxy: RoyaltiesRegistry;
  let testHelper: TestHelper;
  let wrapperHelper: WrapperHelper;
  let seaport_1_5: any;
  let seaport_1_6: any;
  let conduitController: any;
  let strategyCollectionOffer: any;
  let transferManager: any;
  let looksRareExchange: any;
  let weth: any;
  let strategy: any;
  let erc721Delegate: any;
  let erc1155Delegate: any;
  let x2y2: any;
  let factorySudo: any;
  let routerSudo: any;
  let linSudo: any;
  let expSudo: any;
  let _enumerableETHTemplate: any;
  let _missingEnumerableETHTemplate: any;
  let _enumerableERC20Template: any;
  let _missingEnumerableERC20Template: any;
  let blurExchange: any;
  let executionDelegate: any;
  let policyManager: any;
  let standardPolicyERC721: any;
  let uniswapV2Router: any;
  let uniswapV3Router: any;
  let wallet0: SignerWithAddress;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;
  let wallet4: SignerWithAddress;
  let wallet5: SignerWithAddress;
  let wallet6: SignerWithAddress;
  let wallet7: SignerWithAddress;
  let wallet8: SignerWithAddress;
  let wallet9: SignerWithAddress;
  let feeRecipienterUP: SignerWithAddress;
  let lrProtocolFeeRecipient: SignerWithAddress;
  let makerLeft: SignerWithAddress;
  let makerRight: SignerWithAddress;
  const MARKET_MARKER_SELL = '0x67686f73746d61726b65745f76335f73656c6c00000000000000000000000000'; // ghostmarket_v3_sell
  const MARKET_MARKER_BUY = '0x67686f73746d61726b65745f76335f6275790000000000000000000000000000'; // ghostmarket_v3_buy
  const tokenId = '12345';
  const tokenId2 = '123456';
  const erc721TokenId1 = '55';
  const erc721TokenId2 = '56';
  const erc721TokenId3 = '57';
  const erc721TokenId4 = '58';
  const erc721TokenId5 = '59';
  const erc1155TokenId1 = '55';
  const erc1155TokenId2 = '56';
  const erc1155TokenId3 = '57';

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
    wallet8 = accounts[8];
    wallet9 = accounts[9];
    feeRecipienterUP = wallet6;
    lrProtocolFeeRecipient = wallet3;
    const MockUniswapV2Router = await ethers.getContractFactory('MockUniswapV2Router');
    const MockUniswapV3Router = await ethers.getContractFactory('MockUniswapV3Router');
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const ExchangeV2Test = await ethers.getContractFactory('ExchangeV2');
    const BulkExchange = await ethers.getContractFactory('ExchangeWrapper');
    const TestERC20 = await ethers.getContractFactory('TestDummyERC20');
    const TestERC721 = await ethers.getContractFactory('TestDummyERC721');
    const TestERC1155 = await ethers.getContractFactory('TestDummyERC1155');
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    const TestHelper = await ethers.getContractFactory('TestHelper');
    const WrapperHelper = await ethers.getContractFactory('WrapperHelper');
    const LooksRareTestHelper = await ethers.getContractFactory('LooksRareTestHelper');
    const Seaport = await ethers.getContractFactory(SeaportArtifact.abi, SeaportArtifact.bytecode);
    const ConduitController = await ethers.getContractFactory(
      ConduitControllerArtifact.abi,
      ConduitControllerArtifact.bytecode
    );
    const LooksRareExchange = await ethers.getContractFactory(
      LooksRareProtocolArtifact.abi,
      LooksRareProtocolArtifact.bytecode
    );
    const WETH = await ethers.getContractFactory(WETH9Artifact.abi, WETH9Artifact.bytecode);
    const TransferManager = await ethers.getContractFactory(
      TransferManagerArtifact.abi,
      TransferManagerArtifact.bytecode
    );
    const StrategyCollectionOffer = await ethers.getContractFactory(
      StrategyCollectionOfferArtifact.abi,
      StrategyCollectionOfferArtifact.bytecode
    );
    const ERC721Delegate = await ethers.getContractFactory(ERC721DelegateArtifact.abi, ERC721DelegateArtifact.bytecode);
    const ERC1155Delegate = await ethers.getContractFactory(
      ERC1155DelegateArtifact.abi,
      ERC1155DelegateArtifact.bytecode
    );
    const X2Y2_r1 = await ethers.getContractFactory(X2Y2_r1Artifact.abi, X2Y2_r1Artifact.bytecode);

    const LSSVMPairEnumerableERC20 = await ethers.getContractFactory(
      LSSVMPairEnumerableERC20Artifact.abi,
      LSSVMPairEnumerableERC20Artifact.bytecode
    );
    const LSSVMPairEnumerableETH = await ethers.getContractFactory(
      LSSVMPairEnumerableETHArtifact.abi,
      LSSVMPairEnumerableETHArtifact.bytecode
    );
    const LSSVMPairMissingEnumerableERC20 = await ethers.getContractFactory(
      LSSVMPairMissingEnumerableERC20Artifact.abi,
      LSSVMPairMissingEnumerableERC20Artifact.bytecode
    );
    const LSSVMPairMissingEnumerableETH = await ethers.getContractFactory(
      LSSVMPairMissingEnumerableETHArtifact.abi,
      LSSVMPairMissingEnumerableETHArtifact.bytecode
    );
    const LSSVMPairFactory = await ethers.getContractFactory(
      LSSVMPairFactoryArtifact.abi,
      LSSVMPairFactoryArtifact.bytecode
    );
    const LSSVMRouter = await ethers.getContractFactory(LSSVMRouterArtifact.abi, LSSVMRouterArtifact.bytecode);
    const LinearCurve = await ethers.getContractFactory(LinearCurveArtifact.abi, LinearCurveArtifact.bytecode);
    const ExponentialCurve = await ethers.getContractFactory(
      ExponentialCurveArtifact.abi,
      ExponentialCurveArtifact.bytecode
    );

    const BlurExchange = await ethers.getContractFactory(BlurExchangeArtifact.abi, BlurExchangeArtifact.bytecode);
    const ExecutionDelegate = await ethers.getContractFactory(
      ExecutionDelegateArtifact.abi,
      ExecutionDelegateArtifact.bytecode
    );
    const PolicyManager = await ethers.getContractFactory(PolicyManagerArtifact.abi, PolicyManagerArtifact.bytecode);
    const StandardPolicyERC721 = await ethers.getContractFactory(
      StandardPolicyERC721Artifact.abi,
      StandardPolicyERC721Artifact.bytecode
    );

    transferProxy = await TransferProxyTest.deploy();
    await transferProxy.__TransferProxy_init();

    erc20TransferProxy = await ERC20TransferProxyTest.deploy();
    await erc20TransferProxy.__ERC20TransferProxy_init();

    royaltiesRegistryProxy = await RoyaltiesRegistry.deploy();
    await royaltiesRegistryProxy.__RoyaltiesRegistry_init();

    exchangeV2Proxy = <ExchangeV2>(
      (<unknown>(
        await upgrades.deployProxy(
          ExchangeV2Test,
          [
            await transferProxy.getAddress(),
            await erc20TransferProxy.getAddress(),
            300,
            ZERO,
            await royaltiesRegistryProxy.getAddress(),
          ],
          {initializer: '__ExchangeV2_init'}
        )
      ))
    );

    rarible = <ExchangeV2>(
      (<unknown>(
        await upgrades.deployProxy(
          ExchangeV2Test,
          [
            await transferProxy.getAddress(),
            await erc20TransferProxy.getAddress(),
            300,
            ZERO,
            await royaltiesRegistryProxy.getAddress(),
          ],
          {initializer: '__ExchangeV2_init'}
        )
      ))
    );

    conduitController = await ConduitController.deploy();
    seaport_1_5 = await Seaport.deploy(await conduitController.getAddress());
    seaport_1_6 = await Seaport.deploy(await conduitController.getAddress());

    weth = await WETH.deploy();
    transferManager = await TransferManager.deploy(await wallet0.getAddress());
    strategyCollectionOffer = await StrategyCollectionOffer.deploy();
    looksRareExchange = await LooksRareExchange.deploy(
      await wallet0.getAddress(),
      await lrProtocolFeeRecipient.getAddress(),
      await transferManager.getAddress(),
      await weth.getAddress()
    );
    await transferManager.allowOperator(await looksRareExchange.getAddress());
    await looksRareExchange.updateCurrencyStatus(ZERO, true);
    await looksRareExchange.updateCurrencyStatus(await weth.getAddress(), true);
    await looksRareExchange.addStrategy(50, 50, 200, '0x84ad8c47', true, await strategyCollectionOffer.getAddress());
    await looksRareExchange.addStrategy(50, 50, 200, '0x7e897147', true, await strategyCollectionOffer.getAddress());

    x2y2 = await X2Y2_r1.deploy();
    await x2y2.initialize(120000, await weth.getAddress());

    erc721Delegate = await ERC721Delegate.deploy();
    await erc721Delegate.grantRole(
      '0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331',
      await x2y2.getAddress()
    );
    await x2y2.updateDelegates([await erc721Delegate.getAddress()], []);
    erc1155Delegate = await ERC1155Delegate.deploy();
    await erc1155Delegate.grantRole(
      '0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331',
      await x2y2.getAddress()
    );
    await x2y2.updateDelegates([await erc1155Delegate.getAddress()], []);

    _enumerableETHTemplate = await LSSVMPairEnumerableETH.deploy();
    _missingEnumerableETHTemplate = await LSSVMPairMissingEnumerableETH.deploy();
    _enumerableERC20Template = await LSSVMPairEnumerableERC20.deploy();
    _missingEnumerableERC20Template = await LSSVMPairMissingEnumerableERC20.deploy();
    factorySudo = await LSSVMPairFactory.deploy(
      await _enumerableETHTemplate.getAddress(),
      await _missingEnumerableETHTemplate.getAddress(),
      await _enumerableERC20Template.getAddress(),
      await _missingEnumerableERC20Template.getAddress(),
      await wallet9.getAddress(),
      '5000000000000000'
    );
    routerSudo = await LSSVMRouter.deploy(await factorySudo.getAddress());
    await factorySudo.setRouterAllowed(await routerSudo.getAddress(), true);
    expSudo = await ExponentialCurve.deploy();
    linSudo = await LinearCurve.deploy();
    await factorySudo.setBondingCurveAllowed(await expSudo.getAddress(), true);
    await factorySudo.setBondingCurveAllowed(await linSudo.getAddress(), true);

    standardPolicyERC721 = await StandardPolicyERC721.deploy();
    policyManager = await PolicyManager.deploy();
    await policyManager.addPolicy(await standardPolicyERC721.getAddress());
    executionDelegate = await ExecutionDelegate.deploy();
    blurExchange = await BlurExchange.deploy();
    blurExchange.initialize(await executionDelegate.getAddress(), await policyManager.getAddress(), ZERO, 50);
    await executionDelegate.approveContract(await blurExchange.getAddress());

    await transferProxy.addOperator(await exchangeV2Proxy.getAddress());
    await erc20TransferProxy.addOperator(await exchangeV2Proxy.getAddress());
    await transferProxy.addOperator(await rarible.getAddress());
    await erc20TransferProxy.addOperator(await rarible.getAddress());

    testHelper = await TestHelper.deploy();
    wrapperHelper = await WrapperHelper.deploy();

    erc20 = await TestERC20.deploy();
    erc202 = await TestERC20.deploy();
    erc721 = await TestERC721.deploy();
    erc1155 = await TestERC1155.deploy();

    uniswapV2Router = await MockUniswapV2Router.deploy();
    uniswapV3Router = await MockUniswapV3Router.deploy();

    bulkExchange = <ExchangeWrapper>(
      (<unknown>(
        await upgrades.deployProxy(
          BulkExchange,
          [
            await exchangeV2Proxy.getAddress(),
            await rarible.getAddress(),
            await seaport_1_6.getAddress(),
            await seaport_1_5.getAddress(),
            await x2y2.getAddress(),
            await looksRareExchange.getAddress(),
            await routerSudo.getAddress(),
            await blurExchange.getAddress(),
          ],
          {initializer: '__ExchangeWrapper_init'}
        )
      ))
    );
  });

  describe('basic', () => {
    it('is pausable', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(0, 1500), dataForExchCall1);

      //error when called not from owner
      await expect(bulkExchange.connect(wallet5).pause({from: await wallet5.getAddress()})).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );

      await bulkExchange.pause();

      //contract is paused
      await expect(
        bulkExchange.connect(buyer).singlePurchase(tradeData1, ZERO, await feeRecipienterUP.getAddress(), {
          from: await buyer.getAddress(),
          value: 400,
          gasPrice: 0,
        })
      ).to.be.revertedWith('Pausable: paused');

      await bulkExchange.unpause();

      expect(await bulkExchange.paused()).to.equal(false);

      await bulkExchange.connect(buyer).singlePurchase(tradeData1, ZERO, await feeRecipienterUP.getAddress(), {
        from: await buyer.getAddress(),
        value: 400,
        gasPrice: 0,
      });
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('transfer ownership of contract', async function () {
      await bulkExchange.transferOwnership(await wallet1.getAddress());
      expect(await bulkExchange.owner()).to.equal(await wallet1.getAddress());
    });
  });

  describe('GhostMarket orders', () => {
    it('Test singlePurchase ExchangeV2 - V2 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(0, 1500), dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, await feeRecipienterUP.getAddress(), {
          from: await buyer.getAddress(),
          value: 400,
          gasPrice: 0,
        });
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase ExchangeV2 - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, await erc20TransferProxy.getAddress());

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '1000', await erc20.getAddress(), '0', dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, ZERO, {from: await buyer.getAddress(), value: 0, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(1000));
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase ExchangeV2 - V3 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(0, 1500), dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, await feeRecipienterUP.getAddress(), {
          from: await buyer.getAddress(),
          value: 400,
          gasPrice: 0,
        });
      const receipt = await tx.wait();
      // console.log('V3 721 1 order 1 commission:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase ExchangeV2 - V3 order, ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(await seller1.getAddress(), erc1155TokenId1, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(0, 1500), dataForExchCall1);

      await verifyBalanceChange(await buyer.getAddress(), 100, async () =>
        verifyBalanceChange(await seller1.getAddress(), -100, async () =>
          verifyBalanceChange(await feeRecipienterUP.getAddress(), 0, async () =>
            bulkExchange.connect(buyer).singlePurchase(tradeData1, await feeRecipienterUP.getAddress(), ZERO, {
              from: await buyer.getAddress(),
              value: 400,
              gasPrice: 0,
            })
          )
        )
      );

      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenId1)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await buyer.getAddress(), erc1155TokenId1)).to.equal(BigInt(10));
    });

    it('Test singlePurchase ExchangeV2 - V3 order, ERC1155<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(await seller1.getAddress(), erc1155TokenId1, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, await erc20TransferProxy.getAddress());

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId1), '10'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '1000', await erc20.getAddress(), '0', dataForExchCall1);

      await bulkExchange.connect(buyer).singlePurchase(tradeData1, await feeRecipienterUP.getAddress(), ZERO, {
        from: await buyer.getAddress(),
        value: 0,
        gasPrice: 0,
      });

      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(1000));
      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenId1)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await buyer.getAddress(), erc1155TokenId1)).to.equal(BigInt(10));
    });

    it('Test bulkPurchase ExchangeV2 (num orders = 3, type = V2/V1), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});
      await erc721.mint(await seller2.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});
      await erc721.mint(await seller3.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller3)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller3.getAddress()});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[await buyer.getAddress(), 10000]], []]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        await seller3.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await exchangeV2Proxy.getAddress());
      const signatureLeft3 = await getSignature(left3, await seller3.getAddress(), await exchangeV2Proxy.getAddress());
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(1500), dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(1500), dataForExchCall2);

      const directPurchaseParams3 = {
        sellOrderMaker: await seller3.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRightV1,
      };

      const dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(1500), dataForExchCall3);

      await verifyBalanceChange(await buyer.getAddress(), 345, async () =>
        verifyBalanceChange(await seller1.getAddress(), -100, async () =>
          verifyBalanceChange(await seller2.getAddress(), -100, async () =>
            verifyBalanceChange(await seller3.getAddress(), -100, async () =>
              verifyBalanceChange(await feeRecipienterUP.getAddress(), -45, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    await feeRecipienterUP.getAddress(),
                    ZERO,
                    false,
                    {
                      from: await buyer.getAddress(),
                      value: 400,
                      gasPrice: 0,
                    }
                  )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller3.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await wallet2.getAddress())).to.equal(BigInt(3));
    });

    it('Test bulkPurchase ExchangeV2 (num orders = 3, type = V2/V1), ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc1155.mint(await seller1.getAddress(), erc1155TokenId1, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});
      await erc1155.mint(await seller2.getAddress(), erc1155TokenId2, 10);
      await erc1155
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});
      await erc1155.mint(await seller3.getAddress(), erc1155TokenId3, 10);
      await erc1155
        .connect(seller3)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller3.getAddress()});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[await buyer.getAddress(), 10000]], []]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        await seller3.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId3), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await exchangeV2Proxy.getAddress());
      const signatureLeft3 = await getSignature(left3, await seller3.getAddress(), await exchangeV2Proxy.getAddress());
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 6,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '60', ZERO, await encodeFees(1500), dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 8,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_GHOSTMARKET, '80', ZERO, await encodeFees(1500), dataForExchCall2);

      const directPurchaseParams3 = {
        sellOrderMaker: await seller3.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRightV1,
      };

      const dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(1500), dataForExchCall3);

      await verifyBalanceChange(await buyer.getAddress(), 276, async () =>
        verifyBalanceChange(await seller1.getAddress(), -60, async () =>
          verifyBalanceChange(await seller2.getAddress(), -80, async () =>
            verifyBalanceChange(await seller3.getAddress(), -100, async () =>
              verifyBalanceChange(await feeRecipienterUP.getAddress(), -36, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    await feeRecipienterUP.getAddress(),
                    ZERO,
                    false,
                    {
                      from: await buyer.getAddress(),
                      value: 400,
                      gasPrice: 0,
                    }
                  )
              )
            )
          )
        )
      );
      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenId1)).to.equal(BigInt(4));
      expect(await erc1155.balanceOf(await seller2.getAddress(), erc1155TokenId2)).to.equal(BigInt(2));
      expect(await erc1155.balanceOf(await seller3.getAddress(), erc1155TokenId3)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId1)).to.equal(BigInt(6));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId2)).to.equal(BigInt(8));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId3)).to.equal(BigInt(10));
    });

    it('Test bulkPurchase ExchangeV2 (num orders = 3, type = V2/V1), ERC721<->ETH and ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});
      await erc721.mint(await seller2.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});
      await erc721.mint(await seller3.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller3)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller3.getAddress()});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, await erc20TransferProxy.getAddress());

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[await buyer.getAddress(), 10000]], []]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        await seller3.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await exchangeV2Proxy.getAddress());
      const signatureLeft3 = await getSignature(left3, await seller3.getAddress(), await exchangeV2Proxy.getAddress());
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '1000', await erc20.getAddress(), '0', dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(1500), dataForExchCall2);

      const directPurchaseParams3 = {
        sellOrderMaker: await seller3.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRightV1,
      };

      const dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(1500), dataForExchCall3);

      await verifyBalanceChange(await buyer.getAddress(), 230, async () =>
        verifyBalanceChange(await seller1.getAddress(), 0, async () =>
          verifyBalanceChange(await seller2.getAddress(), -100, async () =>
            verifyBalanceChange(await seller3.getAddress(), -100, async () =>
              verifyBalanceChange(await feeRecipienterUP.getAddress(), -30, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    await feeRecipienterUP.getAddress(),
                    ZERO,
                    false,
                    {
                      from: await buyer.getAddress(),
                      value: 300,
                      gasPrice: 0,
                    }
                  )
              )
            )
          )
        )
      );
      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(1000));
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller3.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await wallet2.getAddress())).to.equal(BigInt(3));
    });
  });

  describe('Rarible orders', () => {
    it('Test singlePurchase Rarible - V2 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(0, 1500), dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, await feeRecipienterUP.getAddress(), {
          from: await buyer.getAddress(),
          value: 400,
          gasPrice: 0,
        });
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase Rarible - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, await erc20TransferProxy.getAddress());

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '1000', await erc20.getAddress(), '0', dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, ZERO, {from: await buyer.getAddress(), value: 0, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(1000));
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase Rarible - V3 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(0, 1500), dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, await feeRecipienterUP.getAddress(), {
          from: await buyer.getAddress(),
          value: 400,
          gasPrice: 0,
        });
      const receipt = await tx.wait();
      // console.log('V3 721 1 order 1 commission:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase Rarible - V3 order, ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(await seller1.getAddress(), erc1155TokenId1, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(0, 1500), dataForExchCall1);

      await verifyBalanceChange(await buyer.getAddress(), 100, async () =>
        verifyBalanceChange(await seller1.getAddress(), -100, async () =>
          verifyBalanceChange(await feeRecipienterUP.getAddress(), 0, async () =>
            bulkExchange.connect(buyer).singlePurchase(tradeData1, await feeRecipienterUP.getAddress(), ZERO, {
              from: await buyer.getAddress(),
              value: 400,
              gasPrice: 0,
            })
          )
        )
      );

      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenId1)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await buyer.getAddress(), erc1155TokenId1)).to.equal(BigInt(10));
    });

    it('Test singlePurchase Rarible - V3 order, ERC1155<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(await seller1.getAddress(), erc1155TokenId1, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, await erc20TransferProxy.getAddress());

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId1), '10'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '1000', await erc20.getAddress(), '0', dataForExchCall1);

      await bulkExchange.connect(buyer).singlePurchase(tradeData1, await feeRecipienterUP.getAddress(), ZERO, {
        from: await buyer.getAddress(),
        value: 0,
        gasPrice: 0,
      });

      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(1000));
      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenId1)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await buyer.getAddress(), erc1155TokenId1)).to.equal(BigInt(10));
    });

    it('Test bulkPurchase Rarible (num orders = 3, type = V2/V1), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});
      await erc721.mint(await seller2.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});
      await erc721.mint(await seller3.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller3)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller3.getAddress()});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[await buyer.getAddress(), 10000]], []]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        await seller3.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await rarible.getAddress());
      const signatureLeft3 = await getSignature(left3, await seller3.getAddress(), await rarible.getAddress());
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(1500), dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(1500), dataForExchCall2);

      const directPurchaseParams3 = {
        sellOrderMaker: await seller3.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRightV1,
      };

      const dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(1500), dataForExchCall3);

      await verifyBalanceChange(await buyer.getAddress(), 345, async () =>
        verifyBalanceChange(await seller1.getAddress(), -100, async () =>
          verifyBalanceChange(await seller2.getAddress(), -100, async () =>
            verifyBalanceChange(await seller3.getAddress(), -100, async () =>
              verifyBalanceChange(await feeRecipienterUP.getAddress(), -45, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    await feeRecipienterUP.getAddress(),
                    ZERO,
                    false,
                    {
                      from: await buyer.getAddress(),
                      value: 400,
                      gasPrice: 0,
                    }
                  )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller3.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await wallet2.getAddress())).to.equal(BigInt(3));
    });

    it('Test bulkPurchase Rarible (num orders = 3, type = V2/V1), ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc1155.mint(await seller1.getAddress(), erc1155TokenId1, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});
      await erc1155.mint(await seller2.getAddress(), erc1155TokenId2, 10);
      await erc1155
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});
      await erc1155.mint(await seller3.getAddress(), erc1155TokenId3, 10);
      await erc1155
        .connect(seller3)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller3.getAddress()});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[await buyer.getAddress(), 10000]], []]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        await seller3.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId3), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await rarible.getAddress());
      const signatureLeft3 = await getSignature(left3, await seller3.getAddress(), await rarible.getAddress());
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 6,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '60', ZERO, await encodeFees(1500), dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 8,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_RARIBLE, '80', ZERO, await encodeFees(1500), dataForExchCall2);

      const directPurchaseParams3 = {
        sellOrderMaker: await seller3.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 10,
        buyOrderData: encDataRightV1,
      };

      const dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(1500), dataForExchCall3);

      await verifyBalanceChange(await buyer.getAddress(), 276, async () =>
        verifyBalanceChange(await seller1.getAddress(), -60, async () =>
          verifyBalanceChange(await seller2.getAddress(), -80, async () =>
            verifyBalanceChange(await seller3.getAddress(), -100, async () =>
              verifyBalanceChange(await feeRecipienterUP.getAddress(), -36, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    await feeRecipienterUP.getAddress(),
                    ZERO,
                    false,
                    {
                      from: await buyer.getAddress(),
                      value: 400,
                      gasPrice: 0,
                    }
                  )
              )
            )
          )
        )
      );
      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenId1)).to.equal(BigInt(4));
      expect(await erc1155.balanceOf(await seller2.getAddress(), erc1155TokenId2)).to.equal(BigInt(2));
      expect(await erc1155.balanceOf(await seller3.getAddress(), erc1155TokenId3)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId1)).to.equal(BigInt(6));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId2)).to.equal(BigInt(8));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId3)).to.equal(BigInt(10));
    });

    it('Test bulkPurchase Rarible (num orders = 3, type = V2/V1), ERC721<->ETH and ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});
      await erc721.mint(await seller2.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});
      await erc721.mint(await seller3.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller3)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller3.getAddress()});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, await erc20TransferProxy.getAddress());

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[await buyer.getAddress(), 10000]], []]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        await seller3.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await rarible.getAddress());
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await rarible.getAddress());
      const signatureLeft3 = await getSignature(left3, await seller3.getAddress(), await rarible.getAddress());
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '1000', await erc20.getAddress(), '0', dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(1500), dataForExchCall2);

      const directPurchaseParams3 = {
        sellOrderMaker: await seller3.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V1,
        sellOrderData: encDataLeftV1,
        sellOrderSignature: signatureLeft3,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRightV1,
      };

      const dataForExchCall3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(1500), dataForExchCall3);

      await verifyBalanceChange(await buyer.getAddress(), 230, async () =>
        verifyBalanceChange(await seller1.getAddress(), 0, async () =>
          verifyBalanceChange(await seller2.getAddress(), -100, async () =>
            verifyBalanceChange(await seller3.getAddress(), -100, async () =>
              verifyBalanceChange(await feeRecipienterUP.getAddress(), -30, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData1, tradeData2, tradeData3],
                    await feeRecipienterUP.getAddress(),
                    ZERO,
                    false,
                    {
                      from: await buyer.getAddress(),
                      value: 300,
                      gasPrice: 0,
                    }
                  )
              )
            )
          )
        )
      );

      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(1000));
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller3.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await wallet2.getAddress())).to.equal(BigInt(3));
    });
  });

  describe('Seaport orders', () => {
    it('Test singlePurchase Seaport - fulfillAdvancedOrder through data selector, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = buyerLocal1;

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        await _recipient.getAddress()
      );
      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_5, '100', ZERO, '0', dataForSeaportWithSelector);

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: await buyerLocal1.getAddress(), value: 100});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(await seller.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase Seaport - fulfillAdvancedOrder through data selector, ERC721<->ERC20', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const erc20 = await prepareERC20(buyerLocal1, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_SEAPORT_1_5, await seaport_1_5.getAddress());

      const considerationItemLeft = {
        itemType: 1,
        token: await erc20.getAddress(),
        identifierOrCriteria: 0,
        startAmount: 1000,
        endAmount: 1000,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = buyerLocal1;

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        await _recipient.getAddress()
      );
      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_5,
        '1000',
        await erc20.getAddress(),
        '0',
        dataForSeaportWithSelector
      );

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: await buyerLocal1.getAddress(), value: 0});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(await seller.getAddress())).to.equal(BigInt(1000));
      expect(await erc721.balanceOf(await seller.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase Seaport - fulfillAvailableAdvancedOrders through data selector, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _advancedOrders = [_advancedOrder];
      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = await buyerLocal1.getAddress();
      const _maximumFulfilled = 1;

      const offerFulfillments = [[{orderIndex: 0, itemIndex: 0}]];

      const considerationFulfillments = [[{orderIndex: 0, itemIndex: 0}]];

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAvailableAdvancedOrders(
        _advancedOrders,
        _criteriaResolvers,
        offerFulfillments,
        considerationFulfillments,
        _fulfillerConduitKey,
        _recipient,
        _maximumFulfilled
      );

      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_5, '100', ZERO, '0', dataForSeaportWithSelector);

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: await buyerLocal1.getAddress(), value: 100});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAvailableAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(await seller.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase Seaport - fulfillAvailableAdvancedOrders through data selector, ERC721<->ERC20', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const erc20 = await prepareERC20(buyerLocal1, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_SEAPORT_1_5, await seaport_1_5.getAddress());

      const considerationItemLeft = {
        itemType: 1,
        token: await erc20.getAddress(),
        identifierOrCriteria: 0,
        startAmount: 1000,
        endAmount: 1000,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _advancedOrders = [_advancedOrder];
      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = await buyerLocal1.getAddress();
      const _maximumFulfilled = 1;

      const offerFulfillments = [[{orderIndex: 0, itemIndex: 0}]];

      const considerationFulfillments = [[{orderIndex: 0, itemIndex: 0}]];

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAvailableAdvancedOrders(
        _advancedOrders,
        _criteriaResolvers,
        offerFulfillments,
        considerationFulfillments,
        _fulfillerConduitKey,
        _recipient,
        _maximumFulfilled
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_5,
        '1000',
        await erc20.getAddress(),
        '0',
        dataForSeaportWithSelector
      );

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: await buyerLocal1.getAddress(), value: 0});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAvailableAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(await seller.getAddress())).to.equal(BigInt(1000));
      expect(await erc721.balanceOf(await seller.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(1));
    });
  });

  describe('X2Y2 orders', () => {
    it('Test singlePurchase X2Y2, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await erc721Delegate.getAddress(), true, {from: await seller.getAddress()});

      const orderItem = await generateItemX2Y2(tokenId, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData, ZERO, ZERO, {from: await buyer.getAddress(), value: 1000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it('Test singlePurchase X2Y2, ERC1155<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      const amount = 5;
      await erc1155.mint(await seller.getAddress(), tokenId, amount),
        await erc1155
          .connect(seller)
          .setApprovalForAll(await erc1155Delegate.getAddress(), true, {from: await seller.getAddress()});

      const tokenDataToEncode = [
        {
          token: await erc1155.getAddress(),
          tokenId: tokenId,
          amount: amount,
        },
      ];

      const data = await wrapperHelper.encodeData1155(tokenDataToEncode);
      const orderItem = {
        price: 1000,
        data: data,
      };

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '2',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc1155Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData, ZERO, ZERO, {from: await buyer.getAddress(), value: 1000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc1155.balanceOf(await buyer.getAddress(), tokenId)).to.equal(BigInt(amount));
    });

    it('Test singlePurchase X2Y2, advanced ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await erc721Delegate.getAddress(), true, {from: await seller.getAddress()});

      const orderItem = await generateItemX2Y2(tokenId, '1000');

      const notRealItem0 = await generateItemX2Y2('1234560', '100000');
      const notRealItem2 = await generateItemX2Y2('1234562', '100000');
      const notRealItem3 = await generateItemX2Y2('1234563', '100000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [notRealItem0, orderItem, notRealItem2, notRealItem3],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '1',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData, ZERO, ZERO, {from: await buyer.getAddress(), value: 1000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it('Test bulkPurchase X2Y2 (num orders = 2), ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721.mint(await seller.getAddress(), tokenId2);
      await erc721
        .connect(seller)
        .setApprovalForAll(await erc721Delegate.getAddress(), true, {from: await seller.getAddress()});

      const orderItem = await generateItemX2Y2(tokenId, '1000');
      const orderItem2 = await generateItemX2Y2(tokenId2, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const order2 = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem2],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);
      const itemHash2 = await wrapperHelper.hashItem(order2, orderItem2);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const input2 = {
        orders: [order2],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash2,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));
      const tradeData2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input2));

      const tx = await bulkExchange
        .connect(buyer)
        .bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {from: await buyer.getAddress(), value: 2000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(tokenId2)).to.equal(await buyer.getAddress());
    });

    it('Test bulkPurchase X2Y2 (num orders = 2), ERC1155<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      const amount = 5;
      await erc1155.mint(await seller.getAddress(), tokenId, amount),
        await erc1155.mint(await seller.getAddress(), tokenId2, amount),
        await erc1155
          .connect(seller)
          .setApprovalForAll(await erc1155Delegate.getAddress(), true, {from: await seller.getAddress()});

      const tokenDataToEncode = [
        {
          token: await erc1155.getAddress(),
          tokenId: tokenId,
          amount: amount,
        },
      ];
      const tokenDataToEncode2 = [
        {
          token: await erc1155.getAddress(),
          tokenId: tokenId2,
          amount: amount,
        },
      ];

      const data = await wrapperHelper.encodeData1155(tokenDataToEncode);
      const data2 = await wrapperHelper.encodeData1155(tokenDataToEncode2);
      const orderItem = {
        price: 1000,
        data: data,
      };
      const orderItem2 = {
        price: 1000,
        data: data2,
      };

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '2',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };
      const order2 = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '2',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem2],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);
      const itemHash2 = await wrapperHelper.hashItem(order2, orderItem2);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc1155Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };
      const input2 = {
        orders: [order2],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash2,
            executionDelegate: await erc1155Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));
      const tradeData2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input2));

      const tx = await bulkExchange
        .connect(buyer)
        .bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {from: await buyer.getAddress(), value: 2000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc1155.balanceOf(await buyer.getAddress(), tokenId)).to.equal(BigInt(amount));
      expect(await erc1155.balanceOf(await buyer.getAddress(), tokenId2)).to.equal(BigInt(amount));
    });
  });

  describe('Looksrare orders', () => {
    it('Test singlePurchase Looksrare, ERC721<->ETH, with royalties', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller.getAddress()});
      await transferManager
        .connect(seller)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller.getAddress()});

      const takerBid = {
        recipient: await buyerLocal1.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '0',
        collection: await erc721.getAddress(),
        currency: ZERO,
        signer: await seller.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000',
        itemIds: [tokenId],
        amounts: ['1'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(0));
      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );

      //adding royalties
      const royaltyAccount1 = wallet4;
      const royaltyAccount2 = wallet5;
      const additionalRoyalties = [
        await encodeBpPlusAccountTest(1000, await royaltyAccount1.getAddress()),
        await encodeBpPlusAccountTest(2000, await royaltyAccount2.getAddress()),
      ];
      const dataPlusAdditionalRoyaltiesStruct = {
        data: dataForLooksRare,
        additionalRoyalties: additionalRoyalties,
      };
      const dataPlusAdditionalRoyalties = await wrapperHelper.encodeDataPlusRoyalties(
        dataPlusAdditionalRoyaltiesStruct
      );
      const dataTypePlusFees = await encodeDataTypeAndFees(1);

      const tradeData = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, dataTypePlusFees, dataPlusAdditionalRoyalties);

      await verifyBalanceChange(await seller.getAddress(), -9950, async () =>
        // 0.5% fees
        verifyBalanceChange(await buyerLocal1.getAddress(), 13000, async () =>
          verifyBalanceChange(await royaltyAccount1.getAddress(), -1000, async () =>
            verifyBalanceChange(await royaltyAccount2.getAddress(), -2000, async () =>
              bulkExchange.connect(buyerLocal1).singlePurchase(tradeData, ZERO, ZERO, {
                from: await buyerLocal1.getAddress(),
                value: 13000,
                gasPrice: 0,
              })
            )
          )
        )
      );

      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(1));
    });

    it('Test singlePurchase Looksrare, ERC1155<->ETH, with royalties', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;

      await erc1155.mint(await seller.getAddress(), tokenId, 10);
      await erc1155
        .connect(seller)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller.getAddress()});

      await transferManager
        .connect(seller)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller.getAddress()});

      const takerBid = {
        recipient: await buyerLocal1.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '1',
        collection: await erc1155.getAddress(),
        currency: ZERO,
        signer: await seller.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000',
        itemIds: [tokenId],
        amounts: ['10'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      expect(await erc1155.balanceOf(await buyerLocal1.getAddress(), tokenId)).to.equal(BigInt(0));
      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );

      //adding royalties
      const royaltyAccount1 = wallet4;
      const royaltyAccount2 = wallet5;
      const additionalRoyalties = [
        await encodeBpPlusAccountTest(1000, await royaltyAccount1.getAddress()),
        await encodeBpPlusAccountTest(2000, await royaltyAccount2.getAddress()),
      ];
      const dataPlusAdditionalRoyaltiesStruct = {
        data: dataForLooksRare,
        additionalRoyalties: additionalRoyalties,
      };
      const dataPlusAdditionalRoyalties = await wrapperHelper.encodeDataPlusRoyalties(
        dataPlusAdditionalRoyaltiesStruct
      );
      const dataTypePlusFees = await encodeDataTypeAndFees(1);

      const tradeData = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, dataTypePlusFees, dataPlusAdditionalRoyalties);

      await verifyBalanceChange(await seller.getAddress(), -9950, async () =>
        // 0.5% fees
        verifyBalanceChange(await buyerLocal1.getAddress(), 13000, async () =>
          verifyBalanceChange(await royaltyAccount1.getAddress(), -1000, async () =>
            verifyBalanceChange(await royaltyAccount2.getAddress(), -2000, async () =>
              bulkExchange.connect(buyerLocal1).singlePurchase(tradeData, ZERO, ZERO, {
                from: await buyerLocal1.getAddress(),
                value: 13000,
                gasPrice: 0,
              })
            )
          )
        )
      );

      expect(await erc1155.balanceOf(await buyerLocal1.getAddress(), tokenId)).to.equal(BigInt(10));
    });

    it('Test bulkPurchase Looksrare (num orders = 2), ERC721<->ETH, no royalties', async () => {
      const seller1 = wallet1;
      const seller2 = wallet3;
      const buyerLocal1 = wallet2;

      await erc721.mint(await seller1.getAddress(), tokenId);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller1.getAddress()});
      await erc721.mint(await seller2.getAddress(), tokenId2);
      await erc721
        .connect(seller2)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller2.getAddress()});

      await transferManager
        .connect(seller1)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller1.getAddress()});
      await transferManager
        .connect(seller2)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller2.getAddress()});

      const takerBid = {
        recipient: await buyerLocal1.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '0',
        collection: await erc721.getAddress(),
        currency: ZERO,
        signer: await seller1.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000',
        itemIds: [tokenId],
        amounts: ['1'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(0));
      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );

      const tradeData = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare);

      const takerBid2 = {
        recipient: await buyerLocal1.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk2 = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '0',
        collection: await erc721.getAddress(),
        currency: ZERO,
        signer: await seller2.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000',
        itemIds: [tokenId2],
        amounts: ['1'],
        additionalParameters: '0x',
      };
      const makerSignature2 =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree2 = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate2 = ZERO;

      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(0));
      const dataForLooksRare2 = await wrapperHelper.encodeLooksRareV2Call(
        takerBid2,
        makerAsk2,
        makerSignature2,
        merkleTree2,
        affiliate2
      );

      const tradeData2 = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare2);

      await verifyBalanceChange(await seller1.getAddress(), -9950, async () =>
        verifyBalanceChange(await seller2.getAddress(), -10050, async () =>
          verifyBalanceChange(await buyerLocal1.getAddress(), 20000, async () =>
            bulkExchange.connect(buyerLocal1).bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {
              from: await buyerLocal1.getAddress(),
              value: 20000,
              gasPrice: 0,
            })
          )
        )
      );

      expect(await erc721.balanceOf(await buyerLocal1.getAddress())).to.equal(BigInt(2));
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
    });

    it('Test bulkPurchase Looksrare (num orders = 2), ERC1155<->ETH, no royalties', async () => {
      const seller1 = wallet1;
      const seller2 = wallet3;
      const buyerLocal1 = wallet2;

      await erc1155.mint(await seller1.getAddress(), tokenId, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller1.getAddress()});
      await erc1155.mint(await seller2.getAddress(), tokenId2, 10);
      await erc1155
        .connect(seller2)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller2.getAddress()});

      await transferManager
        .connect(seller1)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller1.getAddress()});
      await transferManager
        .connect(seller2)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller2.getAddress()});

      const takerBid = {
        recipient: await buyerLocal1.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '1',
        collection: await erc1155.getAddress(),
        currency: ZERO,
        signer: await seller1.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000',
        itemIds: [tokenId],
        amounts: ['10'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      expect(await erc1155.balanceOf(await buyerLocal1.getAddress(), tokenId)).to.equal(BigInt(0));
      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );

      const tradeData = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare);

      const takerBid2 = {
        recipient: await buyerLocal1.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk2 = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '1',
        collection: await erc1155.getAddress(),
        currency: ZERO,
        signer: await seller2.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000',
        itemIds: [tokenId2],
        amounts: ['10'],
        additionalParameters: '0x',
      };
      const makerSignature2 =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree2 = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate2 = ZERO;

      expect(await erc1155.balanceOf(await buyerLocal1.getAddress(), tokenId2)).to.equal(BigInt(0));
      const dataForLooksRare2 = await wrapperHelper.encodeLooksRareV2Call(
        takerBid2,
        makerAsk2,
        makerSignature2,
        merkleTree2,
        affiliate2
      );

      const tradeData2 = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare2);

      await verifyBalanceChange(await seller1.getAddress(), -9950, async () =>
        // 0.5% fees
        verifyBalanceChange(await seller2.getAddress(), -10050, async () =>
          verifyBalanceChange(await buyerLocal1.getAddress(), 20000, async () =>
            bulkExchange.connect(buyerLocal1).bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {
              from: await buyerLocal1.getAddress(),
              value: 20000,
              gasPrice: 0,
            })
          )
        )
      );

      expect(await erc1155.balanceOf(await buyerLocal1.getAddress(), tokenId)).to.equal(BigInt(10));
      expect(await erc1155.balanceOf(await buyerLocal1.getAddress(), tokenId2)).to.equal(BigInt(10));
      expect(await erc1155.balanceOf(await seller1.getAddress(), tokenId)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await seller2.getAddress(), tokenId2)).to.equal(BigInt(0));
    });
  });

  describe('Sudoswap orders', () => {
    it('Test singlePurchase Sudoswap, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await factorySudo.getAddress(), true, {from: await seller.getAddress()});

      const input = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller.getAddress(),
        1,
        '100',
        0,
        '1000',
        [tokenId],
      ];

      await (await factorySudo.connect(seller).createPairETH(...input, {from: await seller.getAddress()})).wait();

      const filter = factorySudo.filters.NewPair;
      const events = await factorySudo.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('NewPair');
      const args = event.args;
      const pair = args.poolAddress;

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [tokenId]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const tradeData = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...input2)
      );

      const tx2 = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData, ZERO, ZERO, {from: await buyer.getAddress(), value: 1105});
      const receipt = await tx2.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it('Test singlePurchase Sudoswap + royalties, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const royaltyAccount1 = wallet4;
      const royaltyAccount2 = wallet5;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await factorySudo.getAddress(), true, {from: await seller.getAddress()});

      const input = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller.getAddress(),
        1,
        '100',
        0,
        '1000',
        [tokenId],
      ];

      await (await factorySudo.connect(seller).createPairETH(...input, {from: await seller.getAddress()})).wait();

      const filter = factorySudo.filters.NewPair;
      const events = await factorySudo.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('NewPair');
      const args = event.args;
      const pair = args.poolAddress;

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [tokenId]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const dataSudoSwap = await wrapperHelper.encodeSudoSwapCall(...input2);
      //two different royalties recipients
      const additionalRoyalties = [
        await encodeBpPlusAccountTest(1000, await royaltyAccount1.getAddress()),
        await encodeBpPlusAccountTest(2000, await royaltyAccount2.getAddress()),
      ];
      //single royalty recipient
      const dataPlusAdditionalRoyaltiesStruct = {
        data: dataSudoSwap,
        additionalRoyalties: additionalRoyalties,
      };
      const dataPlusAdditionalRoyalties = await wrapperHelper.encodeDataPlusRoyalties(
        dataPlusAdditionalRoyaltiesStruct
      );

      const tradeData = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        await encodeDataTypeAndFees(1, 1000, 0),
        dataPlusAdditionalRoyalties
      );

      await verifyBalanceChange(await buyer.getAddress(), 1546, async () =>
        verifyBalanceChange(await seller.getAddress(), -1100, async () =>
          verifyBalanceChange(await royaltyAccount1.getAddress(), -110, async () =>
            verifyBalanceChange(await royaltyAccount2.getAddress(), -221, async () =>
              verifyBalanceChange(await feeRecipienterUP.getAddress(), -110, async () =>
                verifyBalanceChange(await factorySudo.getAddress(), -5, async () =>
                  verifyBalanceChange(await bulkExchange.getAddress(), 0, async () =>
                    bulkExchange.connect(buyer).singlePurchase(tradeData, await feeRecipienterUP.getAddress(), ZERO, {
                      from: await buyer.getAddress(),
                      value: 1546,
                      gasPrice: 0,
                    })
                  )
                )
              )
            )
          )
        )
      );

      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it('Test bulkPurchase Sudoswap (num orders = 2), ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721.mint(await seller.getAddress(), tokenId2);
      await erc721
        .connect(seller)
        .setApprovalForAll(await factorySudo.getAddress(), true, {from: await seller.getAddress()});

      const input = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller.getAddress(),
        1,
        '100',
        0,
        '1000',
        [tokenId],
      ];
      const input2 = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller.getAddress(),
        1,
        '100',
        0,
        '1000',
        [tokenId2],
      ];

      await (await factorySudo.connect(seller).createPairETH(...input, {from: await seller.getAddress()})).wait();
      await (await factorySudo.connect(seller).createPairETH(...input2, {from: await seller.getAddress()})).wait();

      const filter = factorySudo.filters.NewPair;
      const events = await factorySudo.queryFilter(filter, -1);
      const event = events[0];
      const event2 = events[1];
      expect(event.fragment.name).to.equal('NewPair');
      const args = event.args;
      const args2 = event2.args;
      const pair = args.poolAddress;

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const pair2 = args2.poolAddress;

      expect(await erc721.ownerOf(tokenId2)).to.equal(pair2);

      const inp = [
        [{pair, nftIds: [tokenId]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const tradeData = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...inp)
      );

      const inp2 = [
        [{pair: pair2, nftIds: [tokenId2]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const tradeData2 = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...inp2)
      );

      await bulkExchange
        .connect(buyer)
        .bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {from: await buyer.getAddress(), value: 2210});

      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(tokenId2)).to.equal(await buyer.getAddress());
    });
  });

  describe('Blur orders', () => {
    it('Test singlePurchase Blur, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const feeFromSeller = wallet8;
      const feeFromBuyer = wallet9;
      const feeFirst = wallet6;
      const feeSecond = wallet7;

      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await executionDelegate.getAddress(), true, {from: await seller.getAddress()});

      const sellOrder = {
        order: {
          trader: await seller.getAddress(),
          side: 1,
          matchingPolicy: await standardPolicyERC721.getAddress(),
          collection: await erc721.getAddress(),
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          price: '1000',
          listingTime: '168381879',
          expirationTime: '16814068278',
          fees: [
            {
              rate: 2000,
              recipient: await feeFromSeller.getAddress(),
            },
          ],
          salt: '65994309200663161530037748276946816666',
          extraParams: '0x01',
        },
        v: 27,
        r: '0x5b93882de02b8f11485053f2487586e2dcef8843d1cdf4077caa6da821c2596b',
        s: '0x0b0460243d87d8e53d85ea1615b200c85bb9a50ad7387e1a8915e5a3c7d631bb',
        extraSignature:
          '0x000000000000000000000000000000000000000000000000000000000000001b7fd6e717aed61bfb988ac35b0b07a3c81b2a7834f9314ccd8c9bcf4201d714c35657cd9099297524e93874b62fee5671aaed42d3795a86d6ebe93daf0e7dae9d',
        signatureVersion: 0,
        blockNumber: 17038489,
      };

      const buyOrder = {
        order: {
          trader: await bulkExchange.getAddress(),
          side: 0,
          matchingPolicy: await standardPolicyERC721.getAddress(),
          collection: await erc721.getAddress(),
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          price: '1000',
          listingTime: '168181880',
          expirationTime: '16813091771',
          fees: [],
          salt: '261913853562470622716597177488189472368',
          extraParams: '0x01',
        },
        v: 0,
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000000',
        extraSignature:
          '0x000000000000000000000000000000000000000000000000000000000000001cd474b10997153521d1b3571c148d6b7d813da537f8b8f9cc0f0959677fca93a30b1ebf4a15c0ed01d692b9dcfef6d251b147b259b20f14d8f383324d35414994',
        signatureVersion: 0,
        blockNumber: 17038489,
      };
      const tradeData = PurchaseData(
        MARKET_ID_BLUR,
        '1000',
        ZERO,
        await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500),
        await wrapperHelper.encodeDataBlur(sellOrder, buyOrder, ERC721)
      );
      await verifyBalanceChange(await seller.getAddress(), -800, async () =>
        verifyBalanceChange(await buyer.getAddress(), 1200, async () =>
          verifyBalanceChange(await feeFromBuyer.getAddress(), 0, async () =>
            verifyBalanceChange(await feeFromSeller.getAddress(), -200, async () =>
              verifyBalanceChange(await feeFirst.getAddress(), -150, async () =>
                verifyBalanceChange(await feeSecond.getAddress(), -50, async () =>
                  bulkExchange
                    .connect(buyer)
                    .singlePurchase(tradeData, await feeFirst.getAddress(), await feeSecond.getAddress(), {
                      from: await buyer.getAddress(),
                      value: 2000,
                      gasPrice: 0,
                    })
                )
              )
            )
          )
        )
      );
      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });
  });

  describe('Combined orders', () => {
    it('Test bulkPurchase GhostMarket & Rarible (num orders = 2, type = V2/V1), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc1155.mint(await seller1.getAddress(), erc1155TokenId1, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});
      await erc1155.mint(await seller2.getAddress(), erc1155TokenId2, 10);
      await erc1155
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[await buyer.getAddress(), 10000]], []]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenId2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await rarible.getAddress());
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 6,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '60', ZERO, await encodeFees(1500), dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 8,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_RARIBLE, '80', ZERO, await encodeFees(1500), dataForExchCall2);

      await verifyBalanceChange(await buyer.getAddress(), 161, async () =>
        verifyBalanceChange(await seller1.getAddress(), -60, async () =>
          verifyBalanceChange(await seller2.getAddress(), -80, async () =>
            verifyBalanceChange(await feeRecipienterUP.getAddress(), -21, async () =>
              bulkExchange
                .connect(buyer)
                .bulkPurchase([tradeData1, tradeData2], await feeRecipienterUP.getAddress(), ZERO, false, {
                  from: await buyer.getAddress(),
                  value: 400,
                  gasPrice: 0,
                })
            )
          )
        )
      );
      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenId1)).to.equal(BigInt(4));
      expect(await erc1155.balanceOf(await seller2.getAddress(), erc1155TokenId2)).to.equal(BigInt(2));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId1)).to.equal(BigInt(6));
      expect(await erc1155.balanceOf(await wallet2.getAddress(), erc1155TokenId2)).to.equal(BigInt(8));
    });

    it('Test bulkPurchase GhostMarket & Seaport (num orders = 3), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      const erc721TokenIdLocal1 = '5';
      await erc721.mint(await seller1.getAddress(), erc721TokenIdLocal1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      await erc721.mint(await seller2.getAddress(), tokenId);
      await erc721
        .connect(seller2)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller2.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenIdLocal1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft = await getSignature(left, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenIdLocal1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCallGhostMarket = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeDataGhostMarket = PurchaseData(
        MARKET_ID_GHOSTMARKET,
        '100',
        ZERO,
        await encodeFees(1500),
        dataForExchCallGhostMarket
      );

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: await seller2.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller2.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = buyerLocal1;

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        await _recipient.getAddress()
      );
      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_5, '100', ZERO, '0', dataForSeaportWithSelector);

      await bulkExchange.connect(buyer).bulkPurchase([tradeDataGhostMarket, tradeDataSeaPort], ZERO, ZERO, false, {
        from: await buyer.getAddress(),
        value: 400,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(2));
    });

    it('Test bulkPurchase GhostMarket & X2Y2 (num orders = 2), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;

      const erc721TokenIdLocal1 = '5';
      await erc721.mint(await seller1.getAddress(), erc721TokenIdLocal1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      await erc721.mint(await seller1.getAddress(), tokenId);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await erc721Delegate.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenIdLocal1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft = await getSignature(left, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenIdLocal1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCallGhostMarket = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeDataGhostMarket = PurchaseData(
        MARKET_ID_GHOSTMARKET,
        '100',
        ZERO,
        await encodeFees(1500),
        dataForExchCallGhostMarket
      );

      const orderItem = await generateItemX2Y2(tokenId, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller1.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeDataX2Y2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      await bulkExchange.connect(buyer).bulkPurchase([tradeDataGhostMarket, tradeDataX2Y2], ZERO, ZERO, false, {
        from: await buyer.getAddress(),
        value: 1400,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(2));
    });

    it('Test bulkPurchase GhostMarket & Looksrare (num orders = 2), ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;

      await erc1155.mint(await seller1.getAddress(), tokenId, 10);
      await erc1155
        .connect(seller1)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller1.getAddress()});

      await transferManager
        .connect(seller1)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller1.getAddress()});

      const erc1155TokenIdLocal2 = '6';
      await erc1155.mint(await seller2.getAddress(), erc1155TokenIdLocal2, 10);
      await erc1155
        .connect(seller2)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller2.getAddress()});

      const takerBid = {
        recipient: await buyer.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '1',
        collection: await erc1155.getAddress(),
        currency: ZERO,
        signer: await seller1.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000',
        itemIds: [tokenId],
        amounts: ['10'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      expect(await erc1155.balanceOf(await buyer.getAddress(), tokenId)).to.equal(BigInt(0));
      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );

      const tradeDataLooksRare = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left2 = Order(
        await seller2.getAddress(),
        Asset(ERC1155, enc(await erc1155.getAddress(), erc1155TokenIdLocal2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft2 = await getSignature(left2, await seller2.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller2.getAddress(),
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(await erc1155.getAddress(), erc1155TokenIdLocal2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft2,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 5,
        buyOrderData: encDataRight,
      };

      const dataForExchCall2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeDataGhostMarket = PurchaseData(
        MARKET_ID_GHOSTMARKET,
        '100',
        ZERO,
        await encodeFees(1500),
        dataForExchCall2
      );

      await verifyBalanceChange(await seller1.getAddress(), -9950, async () =>
        await bulkExchange
        .connect(buyer)
        .bulkPurchase([tradeDataLooksRare, tradeDataGhostMarket], await feeRecipienterUP.getAddress(), ZERO, false, {
          from: await buyer.getAddress(),
          value: 10100,
          gasPrice: 0,
        })
      )

      expect(await erc1155.balanceOf(await seller1.getAddress(), erc1155TokenIdLocal2)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await seller2.getAddress(), tokenId)).to.equal(BigInt(0));
      expect(await erc1155.balanceOf(await buyer.getAddress(), erc1155TokenIdLocal2)).to.equal(BigInt(5));
      expect(await erc1155.balanceOf(await buyer.getAddress(), tokenId)).to.equal(BigInt(10));
    });

    it('Test bulkPurchase GhostMarket & SudoSwap (num orders = 2), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;

      const erc721TokenIdLocal1 = '5';
      await erc721.mint(await seller1.getAddress(), erc721TokenIdLocal1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      await erc721.mint(await seller1.getAddress(), tokenId);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await factorySudo.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenIdLocal1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft = await getSignature(left, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenIdLocal1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCallGhostMarket = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeDataGhostMarket = PurchaseData(
        MARKET_ID_GHOSTMARKET,
        '100',
        ZERO,
        await encodeFees(1500),
        dataForExchCallGhostMarket
      );

      const input = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller1.getAddress(),
        1,
        '100',
        0,
        '1000',
        [tokenId],
      ];

      await (await factorySudo.connect(seller1).createPairETH(...input, {from: await seller1.getAddress()})).wait();

      const filter = factorySudo.filters.NewPair;
      const events = await factorySudo.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('NewPair');
      const args = event.args;
      const pair = args.poolAddress;

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [tokenId]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const tradeDataSudoSwap = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...input2)
      );

      await bulkExchange.connect(buyer).bulkPurchase([tradeDataGhostMarket, tradeDataSudoSwap], ZERO, ZERO, false, {
        from: await buyer.getAddress(),
        value: 1400,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await seller2.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(2));
    });

    it('Test bulkPurchase GhostMarket & Blur (num orders = 2), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;

      const erc721TokenIdLocal1 = '5';
      await erc721.mint(await seller1.getAddress(), erc721TokenIdLocal1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      await erc721.mint(await seller1.getAddress(), tokenId);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await executionDelegate.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenIdLocal1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft = await getSignature(left, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenIdLocal1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft,
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCallGhostMarket = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeDataGhostMarket = PurchaseData(
        MARKET_ID_GHOSTMARKET,
        '100',
        ZERO,
        await encodeFees(1500),
        dataForExchCallGhostMarket
      );

      const sellOrder = {
        order: {
          trader: await seller1.getAddress(),
          side: 1,
          matchingPolicy: await standardPolicyERC721.getAddress(),
          collection: await erc721.getAddress(),
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          price: '1000',
          listingTime: '168381879',
          expirationTime: '16814068278',
          fees: [],
          salt: '65994309200663161530037748276946816666',
          extraParams: '0x01',
        },
        v: 27,
        r: '0x5b93882de02b8f11485053f2487586e2dcef8843d1cdf4077caa6da821c2596b',
        s: '0x0b0460243d87d8e53d85ea1615b200c85bb9a50ad7387e1a8915e5a3c7d631bb',
        extraSignature:
          '0x000000000000000000000000000000000000000000000000000000000000001b7fd6e717aed61bfb988ac35b0b07a3c81b2a7834f9314ccd8c9bcf4201d714c35657cd9099297524e93874b62fee5671aaed42d3795a86d6ebe93daf0e7dae9d',
        signatureVersion: 0,
        blockNumber: 17038489,
      };

      const buyOrder = {
        order: {
          trader: await bulkExchange.getAddress(),
          side: 0,
          matchingPolicy: await standardPolicyERC721.getAddress(),
          collection: await erc721.getAddress(),
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          price: '1000',
          listingTime: '168181880',
          expirationTime: '16813091771',
          fees: [],
          salt: '261913853562470622716597177488189472368',
          extraParams: '0x01',
        },
        v: 0,
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000000',
        extraSignature:
          '0x000000000000000000000000000000000000000000000000000000000000001cd474b10997153521d1b3571c148d6b7d813da537f8b8f9cc0f0959677fca93a30b1ebf4a15c0ed01d692b9dcfef6d251b147b259b20f14d8f383324d35414994',
        signatureVersion: 0,
        blockNumber: 17038489,
      };

      const tradeDataBlur = PurchaseData(
        MARKET_ID_BLUR,
        '1000',
        ZERO,
        await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500),
        await wrapperHelper.encodeDataBlur(sellOrder, buyOrder, ERC721)
      );

      await bulkExchange.connect(buyer).bulkPurchase([tradeDataGhostMarket, tradeDataBlur], ZERO, ZERO, false, {
        from: await buyer.getAddress(),
        value: 1400,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(2));
    });

    it('Test bulkPurchase 3 ETH - 3 ERC20 (ExchangeV2 V2, Rarible V3, Seaport)', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const feeRecipientSecond = wallet7;
      const zoneAddr = wallet2;

      //ghostmarket V2 order - eth
      await erc721.mint(await seller.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, await seller.getAddress(), await exchangeV2Proxy.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //ghostmarket V2 order - erc20
      await erc721.mint(await seller.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, await erc20TransferProxy.getAddress());

      const encDataLeft2 = await encDataV2([[], [], false]);
      const encDataRight2 = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left2 = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams2 = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft2,
        sellOrderSignature: await getSignature(left2, await seller.getAddress(), await exchangeV2Proxy.getAddress()),
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight2,
      };

      const data2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(
        MARKET_ID_GHOSTMARKET,
        '1000',
        await erc20.getAddress(),
        await encodeFees(500, 1000),
        data2
      );

      //rarible V3 order - eth
      await erc721.mint(await seller.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft3 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight3 = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left3 = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft3
      );

      const directPurchaseParams3 = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft3,
        sellOrderSignature: await getSignature(left3, await seller.getAddress(), await rarible.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight3,
      };

      const data3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data3);

      //rarible V3 order - erc20
      await erc721.mint(await seller.getAddress(), erc721TokenId4);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, await erc20TransferProxy.getAddress());

      const encDataLeft4 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight4 = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left4 = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId4), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), '1000'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft4
      );

      const directPurchaseParams1 = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId4),
        sellOrderPaymentAmount: 1000,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft4,
        sellOrderSignature: await getSignature(left4, await seller.getAddress(), await rarible.getAddress()),
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight4,
      };

      const data4 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData4 = PurchaseData(
        MARKET_ID_RARIBLE,
        '1000',
        await erc20.getAddress(),
        await encodeFees(500, 1000),
        data4
      );

      //seaport order - eth
      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = await buyer.getAddress();

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_5,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //seaport order - erc20
      await erc721.mint(await seller.getAddress(), tokenId2);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_SEAPORT_1_5, await seaport_1_5.getAddress());

      const considerationItemLeft2 = {
        itemType: 1,
        token: await erc20.getAddress(),
        identifierOrCriteria: 0,
        startAmount: 1000,
        endAmount: 1000,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft2 = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: tokenId2,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft2 = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft2], // 0x40
        consideration: [considerationItemLeft2], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder2 = {
        parameters: OrderParametersLeft2,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers2: any = [];
      const _fulfillerConduitKey2 = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient2 = await buyer.getAddress();

      const dataForSeaportWithSelector2 = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder2,
        _criteriaResolvers2,
        _fulfillerConduitKey2,
        _recipient2
      );

      const tradeDataSeaPort2 = PurchaseData(
        MARKET_ID_SEAPORT_1_5,
        '1000',
        await erc20.getAddress(),
        await encodeFees(500, 1000),
        dataForSeaportWithSelector2
      );

      await (
        await verifyBalanceChangeReturnTx(await buyer.getAddress(), 345, async () =>
          verifyBalanceChangeReturnTx(await seller.getAddress(), -300, async () =>
            verifyBalanceChangeReturnTx(await feeRecipienterUP.getAddress(), -15, async () =>
              verifyBalanceChangeReturnTx(await feeRecipientSecond.getAddress(), -30, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData, tradeData2, tradeData3, tradeData4, tradeDataSeaPort, tradeDataSeaPort2],
                    await feeRecipienterUP.getAddress(),
                    await feeRecipientSecond.getAddress(),
                    false,
                    {from: await buyer.getAddress(), value: 400, gasPrice: 0}
                  )
              )
            )
          )
        )
      ).wait();

      const filter = bulkExchange.filters.Execution;
      const events = await bulkExchange.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('Execution');
      const args = event.args;
      expect(Array(args)).to.deep.equal(Array([true, await buyer.getAddress()]));

      expect(await erc20.balanceOf(await feeRecipienterUP.getAddress())).to.equal(BigInt(150));
      expect(await erc20.balanceOf(await feeRecipientSecond.getAddress())).to.equal(BigInt(300));
      expect(await erc20.balanceOf(await seller.getAddress())).to.equal(BigInt(3000));
      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId3)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId4)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it('Test bulkPurchase 5%+10% fees for all (ExchangeV2 V2, Rarible V3, Seaport, X2Y2, Looksrare, SudoSwap)', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const feeRecipientSecond = wallet7;
      const zoneAddr = wallet2;

      //ghostmarket V2 order
      await erc721.mint(await seller.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, await seller.getAddress(), await exchangeV2Proxy.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(await seller.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft1
      );

      const directPurchaseParams1 = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, await seller.getAddress(), await rarible.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data1);

      //seaport ORDER
      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = await buyer.getAddress();

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_5,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //x2y2 order
      await erc721.mint(await seller.getAddress(), erc721TokenId4);
      await erc721
        .connect(seller)
        .setApprovalForAll(await erc721Delegate.getAddress(), true, {from: await seller.getAddress()});

      const orderItem = await generateItemX2Y2(erc721TokenId4, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeDataX2Y2 = PurchaseData(
        MARKET_ID_X2Y2,
        '1000',
        ZERO,
        await encodeFees(500, 1000),
        await wrapperHelper.encodeX2Y2Call(input)
      );

      //looksRareOrder
      await erc721.mint(await seller.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller.getAddress()});

      await transferManager
        .connect(seller)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller.getAddress()});

      const takerBid = {
        recipient: await buyer.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '0',
        collection: await erc721.getAddress(),
        currency: ZERO,
        signer: await seller.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '100',
        itemIds: [erc721TokenId3],
        amounts: ['1'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );
      const tradeDataLooksRare = PurchaseData(
        MARKET_ID_LOOKSRARE,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForLooksRare
      );

      //sudoSwapOrder
      await erc721.mint(await seller.getAddress(), erc721TokenId5);
      await erc721
        .connect(seller)
        .setApprovalForAll(await factorySudo.getAddress(), true, {from: await seller.getAddress()});

      const inp = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller.getAddress(),
        1,
        '100',
        0,
        '1000',
        [erc721TokenId5],
      ];

      (await factorySudo.connect(seller).createPairETH(...inp, {from: await seller.getAddress()})).wait();

      const filter2 = factorySudo.filters.NewPair;
      const events2 = await factorySudo.queryFilter(filter2, -1);
      const event2 = events2[0];
      expect(event2.fragment.name).to.equal('NewPair');
      const args2 = event2.args;
      const pair = args2.poolAddress;

      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [erc721TokenId5]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const tradeDataSudoSwap = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...input2)
      );

      await (
        await verifyBalanceChangeReturnTx(await buyer.getAddress(), 2715, async () =>
          verifyBalanceChangeReturnTx(await seller.getAddress(), -2495, async () =>
            verifyBalanceChangeReturnTx(await feeRecipienterUP.getAddress(), -70, async () =>
              verifyBalanceChangeReturnTx(await feeRecipientSecond.getAddress(), -140, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData, tradeData1, tradeDataSeaPort, tradeDataX2Y2, tradeDataLooksRare, tradeDataSudoSwap],
                    await feeRecipienterUP.getAddress(),
                    await feeRecipientSecond.getAddress(),
                    false,
                    {from: await buyer.getAddress(), value: 3785, gasPrice: 0}
                  )
              )
            )
          )
        )
      ).wait();
      const filter = bulkExchange.filters.Execution;
      const events = await bulkExchange.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('Execution');
      const args = event.args;
      expect(Array(args)).to.deep.equal(Array([true, await buyer.getAddress()]));

      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId3)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId4)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it('Test bulkPurchase 5%+10% fees for all (ExchangeV2 V2, Rarible V3, Seaport, X2Y2, Looksrare, SudoSwap), 1 fail', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const zoneAddr = wallet2;
      const feeRecipientSecond = wallet7;

      //GhostMarket V2 order
      await erc721.mint(await seller.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, await seller.getAddress(), await exchangeV2Proxy.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(await seller.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft1
      );

      const directPurchaseParams1 = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, await seller.getAddress(), await rarible.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data1);

      //Seaport order
      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = await buyer.getAddress();

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_5,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //x2y2 order
      await erc721.mint(await seller.getAddress(), erc721TokenId4);
      await erc721
        .connect(seller)
        .setApprovalForAll(await erc721Delegate.getAddress(), true, {from: await seller.getAddress()});

      const orderItem = await generateItemX2Y2(erc721TokenId4, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1000',
            itemHash: itemHash,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeDataX2Y2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      //looksRareOrder
      await erc721.mint(await seller.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller.getAddress()});

      await transferManager
        .connect(seller)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller.getAddress()});

      const takerBid = {
        recipient: await buyer.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '0',
        collection: await erc721.getAddress(),
        currency: ZERO,
        signer: await seller.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '10000', // should be 100 - forced to make trade fail
        itemIds: [erc721TokenId3],
        amounts: ['1'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );
      const tradeDataLooksRare = PurchaseData(
        MARKET_ID_LOOKSRARE,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForLooksRare
      );

      //sudoSwapOrder
      await erc721.mint(await seller.getAddress(), erc721TokenId5);
      await erc721
        .connect(seller)
        .setApprovalForAll(await factorySudo.getAddress(), true, {from: await seller.getAddress()});

      const inp = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller.getAddress(),
        1,
        '100',
        0,
        '1000',
        [erc721TokenId5],
      ];

      await (await factorySudo.connect(seller).createPairETH(...inp, {from: await seller.getAddress()})).wait();

      const filter = factorySudo.filters.NewPair;
      const events = await factorySudo.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('NewPair');
      const args = event.args;
      const pair = args.poolAddress;

      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [erc721TokenId5]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const tradeDataSudoSwap = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...input2)
      );

      //fails with allowFail = false
      await expect(
        bulkExchange
          .connect(buyer)
          .bulkPurchase(
            [tradeData, tradeData1, tradeDataSeaPort, tradeDataX2Y2, tradeDataLooksRare, tradeDataSudoSwap],
            await feeRecipienterUP.getAddress(),
            await feeRecipientSecond.getAddress(),
            false,
            {from: await buyer.getAddress(), value: 2580, gasPrice: 0}
          )
      ).to.be.revertedWith('Purchase LooksRareV2 failed');

      await (
        await verifyBalanceChangeReturnTx(await buyer.getAddress(), 2450, async () =>
          verifyBalanceChangeReturnTx(await seller.getAddress(), -2395, async () =>
            verifyBalanceChangeReturnTx(await feeRecipienterUP.getAddress(), -15, async () =>
              verifyBalanceChangeReturnTx(await feeRecipientSecond.getAddress(), -30, async () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData, tradeData1, tradeDataSeaPort, tradeDataX2Y2, tradeDataLooksRare, tradeDataSudoSwap],
                    await feeRecipienterUP.getAddress(),
                    await feeRecipientSecond.getAddress(),
                    true,
                    {from: await buyer.getAddress(), value: 2670, gasPrice: 0}
                  )
              )
            )
          )
        )
      ).wait();

      const filter2 = bulkExchange.filters.Execution;
      const events2 = await bulkExchange.queryFilter(filter2, -1);
      for (let i = 0; i < events2.length; i++) {
        if (events2[i].fragment.name === 'Execution') {
          if (i === 4) {
            expect(BigInt(events2[i].data)).to.equal(BigInt(0));
          } else {
            expect(BigInt(events2[i].data)).to.equal(BigInt(1));
          }
        }
      }

      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId4)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(await buyer.getAddress());
      expect(await erc721.ownerOf(tokenId)).to.equal(await buyer.getAddress());
    });

    it('Test bulkPurchase 5%+10% fees for all (ExchangeV2 V2, Rarible V3, Seaport, X2Y2, Looksrare, SudoSwap, Blur), all fail = revert', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const zoneAddr = wallet2;
      const feeRecipientSecond = wallet7;

      //GhostMarket V2 order
      await erc721.mint(await seller.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: 10000, // should be 100 - forced to make trade fail
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, await seller.getAddress(), await exchangeV2Proxy.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(await seller.getAddress(), erc721TokenId2);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller.getAddress()});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([
        await LibPartToUint(await buyer.getAddress(), 10000),
        0,
        0,
        MARKET_MARKER_SELL,
      ]);

      const left1 = Order(
        await seller.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft1
      );

      const directPurchaseParams1 = {
        sellOrderMaker: await seller.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId2),
        sellOrderPaymentAmount: 10000, // should be 100 - forced to make trade fail
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, await seller.getAddress(), await rarible.getAddress()),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data1);

      //Seaport order
      await erc721.mint(await seller.getAddress(), tokenId);
      await erc721
        .connect(seller)
        .setApprovalForAll(await seaport_1_5.getAddress(), true, {from: await seller.getAddress()});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 10000, // should be 100 - forced to make trade fail
        endAmount: 100,
        recipient: await seller.getAddress(),
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: await erc721.getAddress(),
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1, // 0x140
        // offer.length // 0x160
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData:
          '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c',
      };

      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = await buyer.getAddress();

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_5,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //x2y2 order
      await erc721.mint(await seller.getAddress(), erc721TokenId4);
      await erc721
        .connect(seller)
        .setApprovalForAll(await erc721Delegate.getAddress(), true, {from: await seller.getAddress()});

      const orderItem = await generateItemX2Y2(erc721TokenId4, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: await seller.getAddress(),
        network: '31337',
        intent: '1',
        delegateType: '1',
        deadline: '1758351144',
        currency: '0x0000000000000000000000000000000000000000',
        dataMask: '0x',
        items: [orderItem],
        r: '0x280849c314a4d9b00804aba77c3434754166aea1a4973f4ec1e89d22f4bd335c',
        s: '0x0b9902ec5b79551d583e82b732cff01ec28fb8831587f8fe4f2e8249f7f4f49e',
        v: 27,
        signVersion: 1,
      };

      const itemHash = await wrapperHelper.hashItem(order, orderItem);

      const input = {
        orders: [order],
        details: [
          {
            op: 1,
            orderIdx: '0',
            itemIdx: '0',
            price: '1', // should be 1000 - forced to make trade fail
            itemHash: itemHash,
            executionDelegate: await erc721Delegate.getAddress(),
            dataReplacement: '0x',
            bidIncentivePct: '0',
            aucMinIncrementPct: '0',
            aucIncDurationSecs: '0',
            fees: [
              {
                percentage: '5000',
                to: '0xd823c605807cc5e6bd6fc0d7e4eea50d3e2d66cd',
              },
            ],
          },
        ],
        shared: {
          salt: '427525989460197',
          deadline: '1758363251',
          amountToEth: '0',
          amountToWeth: '0',
          user: await bulkExchange.getAddress(),
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeDataX2Y2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      //looksRareOrder
      await erc721.mint(await seller.getAddress(), erc721TokenId3);
      await erc721
        .connect(seller)
        .setApprovalForAll(await transferManager.getAddress(), true, {from: await seller.getAddress()});

      await transferManager
        .connect(seller)
        .grantApprovals([await looksRareExchange.getAddress()], {from: await seller.getAddress()});

      const takerBid = {
        recipient: await bulkExchange.getAddress(),
        additionalParameters: '0x',
      };
      const makerAsk = {
        quoteType: '1',
        globalNonce: '0',
        subsetNonce: '0',
        orderNonce: '0',
        strategyId: '0',
        collectionType: '1',
        collection: await erc1155.getAddress(),
        currency: ZERO,
        signer: await seller.getAddress(),
        startTime: '168076455',
        endTime: '16808792846',
        price: '100',
        itemIds: [tokenId],
        amounts: ['1'],
        additionalParameters: '0x',
      };
      const makerSignature =
        '0x50d88229949c5884c15f3a71d9127aeb7c9ef9f9b301ce72c6b87076d0a38447335d8f19355f5ec1e9a6063c10ed019234cd8d522839e808d041082dd75c3ee01c';
      const merkleTree = {
        root: '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: [],
      };
      const affiliate = ZERO;

      const dataForLooksRare = await wrapperHelper.encodeLooksRareV2Call(
        takerBid,
        makerAsk,
        makerSignature,
        merkleTree,
        affiliate
      );
      const tradeDataLooksRare = PurchaseData(
        MARKET_ID_LOOKSRARE,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForLooksRare
      );

      //sudoSwapOrder
      await erc721.mint(await seller.getAddress(), erc721TokenId5);
      await erc721
        .connect(seller)
        .setApprovalForAll(await factorySudo.getAddress(), true, {from: await seller.getAddress()});

      const inp = [
        await erc721.getAddress(),
        await linSudo.getAddress(),
        await seller.getAddress(),
        1,
        '100',
        0,
        '1000',
        [erc721TokenId5],
      ];

      await (await factorySudo.connect(seller).createPairETH(...inp, {from: await seller.getAddress()})).wait();

      const filter = factorySudo.filters.NewPair;
      const events = await factorySudo.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('NewPair');
      const args = event.args;
      const pair = args.poolAddress;

      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [erc721TokenId5]}] as any,
        await buyer.getAddress(),
        await buyer.getAddress(),
        '99999999999999',
      ] as const;

      const tradeDataSudoSwap = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '115', // should be 1105 - forced to make trade fail
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...input2)
      );

      //blurOrder
      await erc721
        .connect(seller)
        .setApprovalForAll(await executionDelegate.getAddress(), true, {from: await seller.getAddress()});

      const sellOrder = {
        order: {
          trader: await seller.getAddress(),
          side: 1,
          matchingPolicy: await standardPolicyERC721.getAddress(),
          collection: await erc721.getAddress(),
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          price: '1000',
          listingTime: '168381879',
          expirationTime: '16814068278',
          fees: [],
          salt: '65994309200663161530037748276946816666',
          extraParams: '0x01',
        },
        v: 27,
        r: '0x5b93882de02b8f11485053f2487586e2dcef8843d1cdf4077caa6da821c2596b',
        s: '0x0b0460243d87d8e53d85ea1615b200c85bb9a50ad7387e1a8915e5a3c7d631bb',
        extraSignature:
          '0x000000000000000000000000000000000000000000000000000000000000001b7fd6e717aed61bfb988ac35b0b07a3c81b2a7834f9314ccd8c9bcf4201d714c35657cd9099297524e93874b62fee5671aaed42d3795a86d6ebe93daf0e7dae9d',
        signatureVersion: 0,
        blockNumber: 17038489,
      };

      const buyOrder = {
        order: {
          trader: await bulkExchange.getAddress(),
          side: 0,
          matchingPolicy: await standardPolicyERC721.getAddress(),
          collection: await erc721.getAddress(),
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          price: '1', // should be 1000 - forced to make trade fail
          listingTime: '168181880',
          expirationTime: '16813091771',
          fees: [],
          salt: '261913853562470622716597177488189472368',
          extraParams: '0x01',
        },
        v: 0,
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000000',
        extraSignature:
          '0x000000000000000000000000000000000000000000000000000000000000001cd474b10997153521d1b3571c148d6b7d813da537f8b8f9cc0f0959677fca93a30b1ebf4a15c0ed01d692b9dcfef6d251b147b259b20f14d8f383324d35414994',
        signatureVersion: 0,
        blockNumber: 17038489,
      };

      const tradeDataBlur = PurchaseData(
        MARKET_ID_BLUR,
        '1000',
        ZERO,
        await encodeCurrencyAndDataTypeAndFees(0, 0, 1500, 500),
        await wrapperHelper.encodeDataBlur(sellOrder, buyOrder, ERC721)
      );

      //fails with allowFail = false
      await expect(
        bulkExchange
          .connect(buyer)
          .bulkPurchase(
            [tradeData, tradeData1, tradeDataSeaPort, tradeDataX2Y2, tradeDataLooksRare, tradeDataSudoSwap],
            await feeRecipienterUP.getAddress(),
            await feeRecipientSecond.getAddress(),
            false,
            {from: await buyer.getAddress(), value: 1580, gasPrice: 0}
          )
      ).to.be.revertedWith('Purchase GhostMarket failed');

      // all fail = revert
      await expect(
        bulkExchange
          .connect(buyer)
          .bulkPurchase(
            [
              tradeData,
              tradeData1,
              tradeDataSeaPort,
              tradeDataX2Y2,
              tradeDataLooksRare,
              tradeDataSudoSwap,
              tradeDataBlur,
            ],
            await feeRecipienterUP.getAddress(),
            await feeRecipientSecond.getAddress(),
            true,
            {from: await buyer.getAddress(), value: 3580, gasPrice: 0}
          )
      ).to.be.revertedWith('no successful execution');
    });
  });

  describe('Swap integration', () => {
    it('Test uniswap v3 ERC20/ETH + order ExchangeV2 - V2 order, ERC721<->ETH', async () => {
      const buyer = wallet1;
      const seller1 = wallet2;
      const priceIn = '10000000000000000';
      const priceOut = '32832900';

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', priceIn),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: priceIn,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: priceIn,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, priceIn, ZERO, '0', dataForExchCall1);

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set uniswap v3 router
      await bulkExchange.setUniswapV3(await uniswapV3Router.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set wrapped
      await bulkExchange.setWrapped(await weth.getAddress());
      // wrap some eth
      await weth.deposit({value: priceIn});
      // prefill uni pool with weth
      await weth.transfer(await uniswapV3Router.getAddress(), priceIn);
      // mint some erc20 to buyer
      await erc20.mint(await buyer.getAddress(), priceOut);
      // approve erc20 from buyer
      await erc20
        .connect(buyer)
        .approve(await erc20TransferProxy.getAddress(), priceOut, {from: await buyer.getAddress()});

      //exception if not sending ETH and no swap
      await expect(
        bulkExchange
          .connect(buyer)
          .singlePurchase(tradeData1, ZERO, ZERO, {from: await buyer.getAddress(), value: 0, gasPrice: 0})
      ).to.be.revertedWith('Purchase GhostMarket failed');

      // buy with swap - not unwrapping - will fail
      const encodedPath = encodePath([await weth.getAddress(), await erc20.getAddress()], [3000]);
      const swapDetails: any = [
        encodedPath, // encoded path
        priceIn, // amount out
        priceOut, // amount in max
        false,
      ];

      await expect(
        bulkExchange.connect(buyer).bulkPurchaseWithSwap([tradeData1], ZERO, ZERO, false, swapDetails, {
          from: await buyer.getAddress(),
          value: 0,
          gasPrice: 0,
        })
      ).to.be.revertedWith('Purchase GhostMarket failed');

      // buy with swap - unwrapping - will work
      const swapDetails2: any = [
        encodedPath, // encoded path
        priceIn, // amount out
        priceOut, // amount in max
        true,
      ];

      await bulkExchange.connect(buyer).bulkPurchaseWithSwap([tradeData1], ZERO, ZERO, false, swapDetails2, {
        from: await buyer.getAddress(),
        value: 0,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test uniswap v3 ERC20/ERC20 + order ExchangeV2 - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet1;
      const seller1 = wallet2;
      const price = '123';
      const priceHigher = '32832900';
      const minted = '10000000000000000';

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const erc20 = await prepareERC20(buyer, minted);
      const erc202 = await prepareERC20(buyer, minted);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), price),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: price,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: price,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, price, await erc20.getAddress(), '0', dataForExchCall1);

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set uniswap v3 router
      await bulkExchange.setUniswapV3(await uniswapV3Router.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // prefill uni pool with erc20
      await erc20.transfer(await uniswapV3Router.getAddress(), priceHigher);

      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, await erc20TransferProxy.getAddress());

      // buy with swap
      const encodedPath = encodePath([await erc20.getAddress(), await erc202.getAddress()], [3000]);
      const swapDetails2: any = [
        encodedPath, // encoded path
        priceHigher, // amount out intentionally higher than required - difference is refunded
        priceHigher, // amount in max intentionally higher than required - difference is refunded
        false,
      ];

      await bulkExchange.connect(buyer).bulkPurchaseWithSwap([tradeData1], ZERO, ZERO, false, swapDetails2, {
        from: await buyer.getAddress(),
        value: 0,
        gasPrice: 0,
      });

      expect(await erc202.balanceOf(await uniswapV3Router.getAddress())).to.equal(BigInt(priceHigher));
      expect(await erc202.balanceOf(await buyer.getAddress())).to.equal(BigInt('9999999967167100')); // minted - priceHigher
      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(price));
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test uniswap v2 ERC20/ETH + order ExchangeV2 - V2 order, ERC721<->ETH', async () => {
      const buyer = wallet1;
      const seller1 = wallet2;
      const priceIn = '10000000000000000';
      const priceOut = '32832900';

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', priceIn),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: priceIn,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: priceIn,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, priceIn, ZERO, '0', dataForExchCall1);

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set uniswap v2 router
      await bulkExchange.setUniswapV2(await uniswapV2Router.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // set wrapped
      await bulkExchange.setWrapped(await weth.getAddress());
      // prefill uni pool with eth
      await wallet0.sendTransaction({to: await uniswapV2Router.getAddress(), value: priceIn});
      // mint some erc20 to buyer
      await erc20.mint(await buyer.getAddress(), priceOut);
      // approve erc20 from buyer
      await erc20
        .connect(buyer)
        .approve(await erc20TransferProxy.getAddress(), priceOut, {from: await buyer.getAddress()});

      // swap details
      const encodedPath = [await erc20.getAddress(), await weth.getAddress()];
      const swapDetails: any = [
        encodedPath, // encoded path
        priceIn, // amount out
        priceOut, // amount in max
        [0], // binSteps
        false, // wrap eth to weth
      ];

      await bulkExchange.connect(buyer).bulkPurchaseWithV2Swap([tradeData1], ZERO, ZERO, false, swapDetails, {
        from: await buyer.getAddress(),
        value: 0,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });

    it('Test uniswap v2 ERC20/ERC20 + order ExchangeV2 - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet1;
      const seller1 = wallet2;
      const price = '123';
      const priceHigher = '32832900';
      const minted = '10000000000000000';

      await erc721.mint(await seller1.getAddress(), erc721TokenId1);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await transferProxy.getAddress(), true, {from: await seller1.getAddress()});

      const erc20 = await prepareERC20(buyer, minted);
      const erc202 = await prepareERC20(buyer, minted);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[await buyer.getAddress(), 10000]], [], false]);

      const left1 = Order(
        await seller1.getAddress(),
        Asset(ERC721, enc(await erc721.getAddress(), erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(await erc20.getAddress()), price),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, await seller1.getAddress(), await exchangeV2Proxy.getAddress());

      const directPurchaseParams = {
        sellOrderMaker: await seller1.getAddress(),
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(await erc721.getAddress(), erc721TokenId1),
        sellOrderPaymentAmount: price,
        paymentToken: await erc20.getAddress(),
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signatureLeft1,
        buyOrderPaymentAmount: price,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const dataForExchCall1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, price, await erc20.getAddress(), '0', dataForExchCall1);

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(await bulkExchange.getAddress());
      // set uniswap v2 router
      await bulkExchange.setUniswapV2(await uniswapV2Router.getAddress());
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(await erc20TransferProxy.getAddress());
      // prefill uni pool with erc20
      await erc20.transfer(await uniswapV2Router.getAddress(), priceHigher);

      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, await erc20TransferProxy.getAddress());

      // swap details
      const encodedPath = [await erc202.getAddress(), await erc20.getAddress()];
      const swapDetails: any = [
        encodedPath, // encoded path
        priceHigher, // amount out intentionally higher than required - difference is refunded
        priceHigher, // amount out intentionally higher than required - difference is refunded
        [0], // binSteps
        false, // wrap eth to weth
      ];

      await bulkExchange.connect(buyer).bulkPurchaseWithV2Swap([tradeData1], ZERO, ZERO, false, swapDetails, {
        from: await buyer.getAddress(),
        value: 0,
        gasPrice: 0,
      });

      expect(await erc202.balanceOf(await uniswapV2Router.getAddress())).to.equal(BigInt(priceHigher));
      expect(await erc202.balanceOf(await buyer.getAddress())).to.equal(BigInt('9999999967167100')); // minted - priceHigher
      expect(await erc20.balanceOf(await seller1.getAddress())).to.equal(BigInt(price));
      expect(await erc721.balanceOf(await seller1.getAddress())).to.equal(BigInt(0));
      expect(await erc721.balanceOf(await buyer.getAddress())).to.equal(BigInt(1));
    });
  });

  function encDataV1(tuple: any) {
    return testHelper.encode(tuple);
  }

  function encDataV2(tuple: any) {
    return testHelper.encodeV2(tuple);
  }

  function encDataV3_BUY(tuple: any) {
    return testHelper.encodeV3_BUY(tuple);
  }

  function encDataV3_SELL(tuple: any) {
    return testHelper.encodeV3_SELL(tuple);
  }

  function PurchaseData(marketId: number, amount: string, paymentToken: string, fees: string, data: any) {
    return {marketId, amount, paymentToken, fees, data};
  }

  async function getSignature(order: any, signer: string, exchangeContract: string) {
    return await EIP712.sign(order, signer, exchangeContract);
  }

  async function LibPartToUint(account = ZERO, value = 0) {
    return await testHelper.encodeOriginFeeIntoUint(account, value);
  }

  async function encodeFees(first = 0, second = 0) {
    const result = await wrapperHelper.encodeFees(first, second);
    return result.toString();
  }

  async function encodeDataTypeAndFees(dataType = 0, first = 0, second = 0) {
    const result = await wrapperHelper.encodeFeesPlusDataType(dataType, first, second);
    return result.toString();
  }

  async function encodeCurrencyAndDataTypeAndFees(currency = 0, dataType = 0, first = 0, second = 0) {
    const result = await wrapperHelper.encodeCurrencyAndDataTypeAndFees(currency, dataType, first, second);
    return result.toString();
  }

  async function encodeBpPlusAccountTest(bp = 0, account = ZERO) {
    const result = await wrapperHelper.encodeBpPlusAccount(bp, account);
    return result.toString();
  }

  function OpenSeaOrdersInput(
    addrs: any,
    uints: any,
    feeMethodsSidesKindsHowToCalls: any,
    calldataBuy: any,
    calldataSell: any,
    replacementPatternBuy: any,
    replacementPatternSell: any,
    staticExtradataBuy: any,
    staticExtradataSell: any,
    vs: any,
    rssMetadata: any
  ) {
    return {
      addrs,
      uints,
      feeMethodsSidesKindsHowToCalls,
      calldataBuy,
      calldataSell,
      replacementPatternBuy,
      replacementPatternSell,
      staticExtradataBuy,
      staticExtradataSell,
      vs,
      rssMetadata,
    };
  }

  async function generateItemX2Y2(tokenid: string, price: string) {
    const tokenDataToEncode = [
      {
        token: await erc721.getAddress(),
        tokenId: tokenid,
      },
    ];

    const data = await wrapperHelper.encodeData(tokenDataToEncode);
    const orderItem = {
      price: price,
      data: data,
    };

    return orderItem;
  }

  async function encodePath(path: string[], fees: number[]) {
    const FEE_SIZE = 3;

    if (path.length != fees.length + 1) {
      throw new Error('path/fee lengths do not match');
    }

    let encoded = '0x';
    for (let i = 0; i < fees.length; i++) {
      // 20 byte encoding of the address
      encoded += path[i].slice(2);
      // 3 byte encoding of the fee
      encoded += fees[i].toString(16).padStart(2 * FEE_SIZE, '0');
    }
    // encode the final token
    encoded += path[path.length - 1].slice(2);

    return encoded.toLowerCase();
  }

  async function prepareERC20(user: SignerWithAddress, value = '1000') {
    const TestERC20 = await ethers.getContractFactory('TestDummyERC20');
    erc20 = await TestERC20.deploy();
    const asSigner = erc20.connect(user);
    await asSigner.mint(await user.getAddress(), value);
    await asSigner.approve(await erc20TransferProxy.getAddress(), value, {from: await user.getAddress()});
    return asSigner;
  }
});
