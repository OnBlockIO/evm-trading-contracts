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
import LooksRareExchangeArtifact from '../src/exchange-wrapper/artifacts/LooksRareExchange.json';
import CurrencyManagerArtifact from '../src/exchange-wrapper/artifacts/CurrencyManager.json';
import ExecutionManagerArtifact from '../src/exchange-wrapper/artifacts/ExecutionManager.json';
import RoyaltyFeeManagerArtifact from '../src/exchange-wrapper/artifacts/RoyaltyFeeManager.json';
import WETH9Artifact from '../src/exchange-wrapper/artifacts/WETH9.json';
import RoyaltyFeeRegistryArtifact from '../src/exchange-wrapper/artifacts/RoyaltyFeeRegistry.json';
import TransferSelectorNFTArtifact from '../src/exchange-wrapper/artifacts/TransferSelectorNFT.json';
import TransferManagerERC721Artifact from '../src/exchange-wrapper/artifacts/TransferManagerERC721.json';
import TransferManagerERC1155Artifact from '../src/exchange-wrapper/artifacts/TransferManagerERC1155.json';
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
import BlurPoolArtifact from '../src/exchange-wrapper/artifacts/BlurPool.json';
import PolicyManagerArtifact from '../src/exchange-wrapper/artifacts/PolicyManager.json';
import SafeCollectionBidPolicyERC721Artifact from '../src/exchange-wrapper/artifacts/SafeCollectionBidPolicyERC721.json';
import StandardPolicyERC721Artifact from '../src/exchange-wrapper/artifacts/StandardPolicyERC721.json';
import StandardPolicyNoOracleERC721Artifact from '../src/exchange-wrapper/artifacts/StandardPolicyNoOracleERC721.json';

import {inReceipt} from './utils/expectEvent';
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
import {verifyBalanceChange, verifyBalanceChangeReturnTx} from './utils/helpers';
import {
  MARKET_ID_GHOSTMARKET,
  MARKET_ID_LOOKSRARE,
  MARKET_ID_RARIBLE,
  MARKET_ID_SEAPORT_1_1,
  MARKET_ID_SEAPORT_1_4,
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
  let seaport_1_1: any;
  let seaport_1_4: any;
  let conduitController: any;
  let currencyManager: any;
  let executionManager: any;
  let royaltyFeeRegistry: any;
  let royaltyFeeManager: any;
  let looksRareExchange: any;
  let weth: any;
  let transferManagerERC721: any;
  let transferManagerERC1155: any;
  let transferSelectorNFT: any;
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
  let blurPool: any;
  let executionDelegate: any;
  let policyManager: any;
  let standardPolicyNoOracleERC721: any;
  let standardPolicyERC721: any;
  let safeCollectionBidPolicyERC721: any;
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
    const CurrencyManager = await ethers.getContractFactory(
      CurrencyManagerArtifact.abi,
      CurrencyManagerArtifact.bytecode
    );
    const ExecutionManager = await ethers.getContractFactory(
      ExecutionManagerArtifact.abi,
      ExecutionManagerArtifact.bytecode
    );
    const RoyaltyFeeRegistry = await ethers.getContractFactory(
      RoyaltyFeeRegistryArtifact.abi,
      RoyaltyFeeRegistryArtifact.bytecode
    );
    const RoyaltyFeeManager = await ethers.getContractFactory(
      RoyaltyFeeManagerArtifact.abi,
      RoyaltyFeeManagerArtifact.bytecode
    );
    const LooksRareExchange = await ethers.getContractFactory(
      LooksRareExchangeArtifact.abi,
      LooksRareExchangeArtifact.bytecode
    );
    const WETH = await ethers.getContractFactory(WETH9Artifact.abi, WETH9Artifact.bytecode);
    const TransferManagerERC721 = await ethers.getContractFactory(
      TransferManagerERC721Artifact.abi,
      TransferManagerERC721Artifact.bytecode
    );
    const TransferManagerERC1155 = await ethers.getContractFactory(
      TransferManagerERC1155Artifact.abi,
      TransferManagerERC1155Artifact.bytecode
    );
    const TransferSelectorNFT = await ethers.getContractFactory(
      TransferSelectorNFTArtifact.abi,
      TransferSelectorNFTArtifact.bytecode
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
    const BlurPool = await ethers.getContractFactory(BlurPoolArtifact.abi, BlurPoolArtifact.bytecode);
    const PolicyManager = await ethers.getContractFactory(PolicyManagerArtifact.abi, PolicyManagerArtifact.bytecode);
    const SafeCollectionBidPolicyERC721 = await ethers.getContractFactory(
      SafeCollectionBidPolicyERC721Artifact.abi,
      SafeCollectionBidPolicyERC721Artifact.bytecode
    );
    const StandardPolicyERC721 = await ethers.getContractFactory(
      StandardPolicyERC721Artifact.abi,
      StandardPolicyERC721Artifact.bytecode
    );
    const StandardPolicyNoOracleERC721 = await ethers.getContractFactory(
      StandardPolicyNoOracleERC721Artifact.abi,
      StandardPolicyNoOracleERC721Artifact.bytecode
    );

    transferProxy = await TransferProxyTest.deploy();
    await transferProxy.__TransferProxy_init();

    erc20TransferProxy = await ERC20TransferProxyTest.deploy();
    await erc20TransferProxy.__ERC20TransferProxy_init();

    royaltiesRegistryProxy = await RoyaltiesRegistry.deploy();
    await royaltiesRegistryProxy.__RoyaltiesRegistry_init();

    exchangeV2Proxy = <ExchangeV2>(
      await upgrades.deployProxy(
        ExchangeV2Test,
        [transferProxy.address, erc20TransferProxy.address, 300, ZERO, royaltiesRegistryProxy.address],
        {initializer: '__ExchangeV2_init'}
      )
    );

    rarible = <ExchangeV2>(
      await upgrades.deployProxy(
        ExchangeV2Test,
        [transferProxy.address, erc20TransferProxy.address, 300, ZERO, royaltiesRegistryProxy.address],
        {initializer: '__ExchangeV2_init'}
      )
    );

    conduitController = await ConduitController.deploy();
    seaport_1_1 = await Seaport.deploy(conduitController.address);
    seaport_1_4 = await Seaport.deploy(conduitController.address);

    currencyManager = await CurrencyManager.deploy();
    executionManager = await ExecutionManager.deploy();
    royaltyFeeRegistry = await RoyaltyFeeRegistry.deploy(9000);
    royaltyFeeManager = await RoyaltyFeeManager.deploy(royaltyFeeRegistry.address);
    weth = await WETH.deploy();
    looksRareExchange = await LooksRareExchange.deploy(
      currencyManager.address,
      executionManager.address,
      royaltyFeeManager.address,
      weth.address,
      lrProtocolFeeRecipient.address
    );
    transferManagerERC721 = await TransferManagerERC721.deploy(looksRareExchange.address);
    transferManagerERC1155 = await TransferManagerERC1155.deploy(looksRareExchange.address);
    transferSelectorNFT = await TransferSelectorNFT.deploy(
      transferManagerERC721.address,
      transferManagerERC1155.address
    );
    await looksRareExchange.updateTransferSelectorNFT(transferSelectorNFT.address);
    await currencyManager.addCurrency(weth.address);
    strategy = await LooksRareTestHelper.deploy(0);
    await executionManager.addStrategy(strategy.address);

    x2y2 = await X2Y2_r1.deploy();
    await x2y2.initialize(120000, weth.address);

    erc721Delegate = await ERC721Delegate.deploy();
    await erc721Delegate.grantRole('0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331', x2y2.address);
    await x2y2.updateDelegates([erc721Delegate.address], []);
    erc1155Delegate = await ERC1155Delegate.deploy();
    await erc1155Delegate.grantRole('0x7630198b183b603be5df16e380207195f2a065102b113930ccb600feaf615331', x2y2.address);
    await x2y2.updateDelegates([erc1155Delegate.address], []);

    _enumerableETHTemplate = await LSSVMPairEnumerableETH.deploy();
    _missingEnumerableETHTemplate = await LSSVMPairMissingEnumerableETH.deploy();
    _enumerableERC20Template = await LSSVMPairEnumerableERC20.deploy();
    _missingEnumerableERC20Template = await LSSVMPairMissingEnumerableERC20.deploy();
    factorySudo = await LSSVMPairFactory.deploy(
      _enumerableETHTemplate.address,
      _missingEnumerableETHTemplate.address,
      _enumerableERC20Template.address,
      _missingEnumerableERC20Template.address,
      wallet9.address,
      '5000000000000000'
    );
    routerSudo = await LSSVMRouter.deploy(factorySudo.address);
    await factorySudo.setRouterAllowed(routerSudo.address, true);
    expSudo = await ExponentialCurve.deploy();
    linSudo = await LinearCurve.deploy();
    await factorySudo.setBondingCurveAllowed(expSudo.address, true);
    await factorySudo.setBondingCurveAllowed(linSudo.address, true);

    standardPolicyNoOracleERC721 = await StandardPolicyNoOracleERC721.deploy();
    standardPolicyERC721 = await StandardPolicyERC721.deploy();
    safeCollectionBidPolicyERC721 = await SafeCollectionBidPolicyERC721.deploy();
    policyManager = await PolicyManager.deploy();
    await policyManager.addPolicy(standardPolicyNoOracleERC721.address);
    await policyManager.addPolicy(standardPolicyERC721.address);
    await policyManager.addPolicy(safeCollectionBidPolicyERC721.address);
    executionDelegate = await ExecutionDelegate.deploy();
    blurPool = await BlurPool.deploy();
    blurExchange = await BlurExchange.deploy();
    blurExchange.initialize(
      weth.address,
      blurPool.address,
      executionDelegate.address,
      policyManager.address,
      wallet0.address,
      125
    );
    await executionDelegate.approveContract(blurExchange.address);

    await transferProxy.addOperator(exchangeV2Proxy.address);
    await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    await transferProxy.addOperator(rarible.address);
    await erc20TransferProxy.addOperator(rarible.address);

    testHelper = await TestHelper.deploy();
    wrapperHelper = await WrapperHelper.deploy();

    erc20 = await TestERC20.deploy();
    erc202 = await TestERC20.deploy();
    erc721 = await TestERC721.deploy();
    erc1155 = await TestERC1155.deploy();

    uniswapV2Router = await MockUniswapV2Router.deploy();
    uniswapV3Router = await MockUniswapV3Router.deploy();

    bulkExchange = <ExchangeWrapper>(
      await upgrades.deployProxy(
        BulkExchange,
        [
          exchangeV2Proxy.address,
          rarible.address,
          seaport_1_4.address,
          seaport_1_1.address,
          x2y2.address,
          looksRareExchange.address,
          routerSudo.address,
          blurExchange.address,
        ],
        {initializer: '__ExchangeWrapper_init'}
      )
    );
  });

  describe('basic', () => {
    it('is pausable', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
      await expect(bulkExchange.connect(wallet5).pause({from: wallet5.address})).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );

      await bulkExchange.pause();

      //contract is paused
      await expect(
        bulkExchange
          .connect(buyer)
          .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0})
      ).to.be.revertedWith('Pausable: paused');

      await bulkExchange.unpause();

      expect(await bulkExchange.paused()).to.equal(false);

      await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('transfer ownership of contract', async function () {
      await bulkExchange.transferOwnership(wallet1.address);
      expect(await bulkExchange.owner()).to.equal(wallet1.address);
    });
  });

  describe('GhostMarket orders', () => {
    it('Test singlePurchase ExchangeV2 - V2 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase ExchangeV2 - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, erc20TransferProxy.address);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '1000', erc20.address, '0', dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, ZERO, {from: buyer.address, value: 0, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(seller1.address)).to.equal(1000);
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase ExchangeV2 - V3 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V3 721 1 order 1 commission:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase ExchangeV2 - V3 order, ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(seller1.address, erc1155TokenId1, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller1.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId1),
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

      await verifyBalanceChange(buyer.address, 100, async () =>
        verifyBalanceChange(seller1.address, -100, async () =>
          verifyBalanceChange(feeRecipienterUP.address, 0, () =>
            bulkExchange.connect(buyer).singlePurchase(tradeData1, feeRecipienterUP.address, ZERO, {
              from: buyer.address,
              value: 400,
              gasPrice: 0,
            })
          )
        )
      );

      expect(await erc1155.balanceOf(seller1.address, erc1155TokenId1)).to.equal(0);
      expect(await erc1155.balanceOf(buyer.address, erc1155TokenId1)).to.equal(10);
    });

    it('Test singlePurchase ExchangeV2 - V3 order, ERC1155<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(seller1.address, erc1155TokenId1, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, erc20TransferProxy.address);

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller1.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '10'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '1000', erc20.address, '0', dataForExchCall1);

      await bulkExchange.connect(buyer).singlePurchase(tradeData1, feeRecipienterUP.address, ZERO, {
        from: buyer.address,
        value: 0,
        gasPrice: 0,
      });

      expect(await erc20.balanceOf(seller1.address)).to.equal(1000);
      expect(await erc1155.balanceOf(seller1.address, erc1155TokenId1)).to.equal(0);
      expect(await erc1155.balanceOf(buyer.address, erc1155TokenId1)).to.equal(10);
    });

    it('Test bulkPurchase ExchangeV2 (num orders = 3, type = V2/V1), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc721.mint(seller2.address, erc721TokenId2);
      await erc721.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});
      await erc721.mint(seller3.address, erc721TokenId3);
      await erc721.connect(seller3).setApprovalForAll(transferProxy.address, true, {from: seller3.address});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer.address, 10000]], []]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, exchangeV2Proxy.address);
      const signatureLeft3 = await getSignature(left3, seller3.address, exchangeV2Proxy.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
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
        sellOrderMaker: seller3.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId3),
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

      await verifyBalanceChange(buyer.address, 345, async () =>
        verifyBalanceChange(seller1.address, -100, async () =>
          verifyBalanceChange(seller2.address, -100, async () =>
            verifyBalanceChange(seller3.address, -100, async () =>
              verifyBalanceChange(feeRecipienterUP.address, -45, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP.address, ZERO, false, {
                    from: buyer.address,
                    value: 400,
                    gasPrice: 0,
                  })
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await erc721.balanceOf(seller3.address)).to.equal(0);
      expect(await erc721.balanceOf(wallet2.address)).to.equal(3);
    });

    it('Test bulkPurchase ExchangeV2 (num orders = 3, type = V2/V1), ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc1155.mint(seller1.address, erc1155TokenId1, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc1155.mint(seller2.address, erc1155TokenId2, 10);
      await erc1155.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});
      await erc1155.mint(seller3.address, erc1155TokenId3, 10);
      await erc1155.connect(seller3).setApprovalForAll(transferProxy.address, true, {from: seller3.address});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer.address, 10000]], []]);

      const left1 = Order(
        seller1.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId3), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, exchangeV2Proxy.address);
      const signatureLeft3 = await getSignature(left3, seller3.address, exchangeV2Proxy.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc721TokenId1),
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
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId2),
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
        sellOrderMaker: seller3.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId3),
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

      await verifyBalanceChange(buyer.address, 276, async () =>
        verifyBalanceChange(seller1.address, -60, async () =>
          verifyBalanceChange(seller2.address, -80, async () =>
            verifyBalanceChange(seller3.address, -100, async () =>
              verifyBalanceChange(feeRecipienterUP.address, -36, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP.address, ZERO, false, {
                    from: buyer.address,
                    value: 400,
                    gasPrice: 0,
                  })
              )
            )
          )
        )
      );
      expect(await erc1155.balanceOf(seller1.address, erc1155TokenId1)).to.equal(4);
      expect(await erc1155.balanceOf(seller2.address, erc1155TokenId2)).to.equal(2);
      expect(await erc1155.balanceOf(seller3.address, erc1155TokenId3)).to.equal(0);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).to.equal(6);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId2)).to.equal(8);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId3)).to.equal(10);
    });

    it('Test bulkPurchase ExchangeV2 (num orders = 3, type = V2/V1), ERC721<->ETH and ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc721.mint(seller2.address, erc721TokenId2);
      await erc721.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});
      await erc721.mint(seller3.address, erc721TokenId3);
      await erc721.connect(seller3).setApprovalForAll(transferProxy.address, true, {from: seller3.address});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, erc20TransferProxy.address);

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer.address, 10000]], []]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, exchangeV2Proxy.address);
      const signatureLeft3 = await getSignature(left3, seller3.address, exchangeV2Proxy.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, '1000', erc20.address, '0', dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
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
        sellOrderMaker: seller3.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId3),
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

      await verifyBalanceChange(buyer.address, 230, async () =>
        verifyBalanceChange(seller1.address, 0, async () =>
          verifyBalanceChange(seller2.address, -100, async () =>
            verifyBalanceChange(seller3.address, -100, async () =>
              verifyBalanceChange(feeRecipienterUP.address, -30, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP.address, ZERO, false, {
                    from: buyer.address,
                    value: 300,
                    gasPrice: 0,
                  })
              )
            )
          )
        )
      );
      expect(await erc20.balanceOf(seller1.address)).to.equal(1000);
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await erc721.balanceOf(seller3.address)).to.equal(0);
      expect(await erc721.balanceOf(wallet2.address)).to.equal(3);
    });
  });

  describe('Rarible orders', () => {
    it('Test singlePurchase Rarible - V2 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase Rarible - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, erc20TransferProxy.address);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '1000', erc20.address, '0', dataForExchCall1);

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, ZERO, {from: buyer.address, value: 0, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(seller1.address)).to.equal(1000);
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase Rarible - V3 order, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V3 721 1 order 1 commission:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase Rarible - V3 order, ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(seller1.address, erc1155TokenId1, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller1.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId1),
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

      await verifyBalanceChange(buyer.address, 100, async () =>
        verifyBalanceChange(seller1.address, -100, async () =>
          verifyBalanceChange(feeRecipienterUP.address, 0, () =>
            bulkExchange.connect(buyer).singlePurchase(tradeData1, feeRecipienterUP.address, ZERO, {
              from: buyer.address,
              value: 400,
              gasPrice: 0,
            })
          )
        )
      );

      expect(await erc1155.balanceOf(seller1.address, erc1155TokenId1)).to.equal(0);
      expect(await erc1155.balanceOf(buyer.address, erc1155TokenId1)).to.equal(10);
    });

    it('Test singlePurchase Rarible - V3 order, ERC1155<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;

      await erc1155.mint(seller1.address, erc1155TokenId1, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, erc20TransferProxy.address);

      const encDataLeft = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller1.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '10'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '1000', erc20.address, '0', dataForExchCall1);

      await bulkExchange.connect(buyer).singlePurchase(tradeData1, feeRecipienterUP.address, ZERO, {
        from: buyer.address,
        value: 0,
        gasPrice: 0,
      });

      expect(await erc20.balanceOf(seller1.address)).to.equal(1000);
      expect(await erc1155.balanceOf(seller1.address, erc1155TokenId1)).to.equal(0);
      expect(await erc1155.balanceOf(buyer.address, erc1155TokenId1)).to.equal(10);
    });

    it('Test bulkPurchase Rarible (num orders = 3, type = V2/V1), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc721.mint(seller2.address, erc721TokenId2);
      await erc721.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});
      await erc721.mint(seller3.address, erc721TokenId3);
      await erc721.connect(seller3).setApprovalForAll(transferProxy.address, true, {from: seller3.address});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer.address, 10000]], []]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, rarible.address);
      const signatureLeft3 = await getSignature(left3, seller3.address, rarible.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
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
        sellOrderMaker: seller3.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId3),
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

      await verifyBalanceChange(buyer.address, 345, async () =>
        verifyBalanceChange(seller1.address, -100, async () =>
          verifyBalanceChange(seller2.address, -100, async () =>
            verifyBalanceChange(seller3.address, -100, async () =>
              verifyBalanceChange(feeRecipienterUP.address, -45, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP.address, ZERO, false, {
                    from: buyer.address,
                    value: 400,
                    gasPrice: 0,
                  })
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await erc721.balanceOf(seller3.address)).to.equal(0);
      expect(await erc721.balanceOf(wallet2.address)).to.equal(3);
    });

    it('Test bulkPurchase Rarible (num orders = 3, type = V2/V1), ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc1155.mint(seller1.address, erc1155TokenId1, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc1155.mint(seller2.address, erc1155TokenId2, 10);
      await erc1155.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});
      await erc1155.mint(seller3.address, erc1155TokenId3, 10);
      await erc1155.connect(seller3).setApprovalForAll(transferProxy.address, true, {from: seller3.address});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer.address, 10000]], []]);

      const left1 = Order(
        seller1.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId3), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, rarible.address);
      const signatureLeft3 = await getSignature(left3, seller3.address, rarible.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc721TokenId1),
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
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId2),
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
        sellOrderMaker: seller3.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId3),
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

      await verifyBalanceChange(buyer.address, 276, async () =>
        verifyBalanceChange(seller1.address, -60, async () =>
          verifyBalanceChange(seller2.address, -80, async () =>
            verifyBalanceChange(seller3.address, -100, async () =>
              verifyBalanceChange(feeRecipienterUP.address, -36, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP.address, ZERO, false, {
                    from: buyer.address,
                    value: 400,
                    gasPrice: 0,
                  })
              )
            )
          )
        )
      );
      expect(await erc1155.balanceOf(seller1.address, erc1155TokenId1)).to.equal(4);
      expect(await erc1155.balanceOf(seller2.address, erc1155TokenId2)).to.equal(2);
      expect(await erc1155.balanceOf(seller3.address, erc1155TokenId3)).to.equal(0);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).to.equal(6);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId2)).to.equal(8);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId3)).to.equal(10);
    });

    it('Test bulkPurchase Rarible (num orders = 3, type = V2/V1), ERC721<->ETH and ERC721<->ERC20', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc721.mint(seller2.address, erc721TokenId2);
      await erc721.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});
      await erc721.mint(seller3.address, erc721TokenId3);
      await erc721.connect(seller3).setApprovalForAll(transferProxy.address, true, {from: seller3.address});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, erc20TransferProxy.address);

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer.address, 10000]], []]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left3 = Order(
        seller3.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeftV1
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, rarible.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, rarible.address);
      const signatureLeft3 = await getSignature(left3, seller3.address, rarible.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '1000', erc20.address, '0', dataForExchCall1);

      const directPurchaseParams2 = {
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
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
        sellOrderMaker: seller3.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId3),
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

      await verifyBalanceChange(buyer.address, 230, async () =>
        verifyBalanceChange(seller1.address, 0, async () =>
          verifyBalanceChange(seller2.address, -100, async () =>
            verifyBalanceChange(seller3.address, -100, async () =>
              verifyBalanceChange(feeRecipienterUP.address, -30, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase([tradeData1, tradeData2, tradeData3], feeRecipienterUP.address, ZERO, false, {
                    from: buyer.address,
                    value: 300,
                    gasPrice: 0,
                  })
              )
            )
          )
        )
      );

      expect(await erc20.balanceOf(seller1.address)).to.equal(1000);
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await erc721.balanceOf(seller3.address)).to.equal(0);
      expect(await erc721.balanceOf(wallet2.address)).to.equal(3);
    });
  });

  describe('Seaport orders', () => {
    it('Test singlePurchase Seaport - fulfillAdvancedOrder through data selector, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
        _recipient.address
      );
      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_1, '100', ZERO, '0', dataForSeaportWithSelector);

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: buyerLocal1.address, value: 100});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller.address)).to.equal(0);
      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(1);
    });

    it('Test singlePurchase Seaport - fulfillAdvancedOrder through data selector, ERC721<->ERC20', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const erc20 = await prepareERC20(buyerLocal1, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_SEAPORT_1_1, seaport_1_1.address);

      const considerationItemLeft = {
        itemType: 1,
        token: erc20.address,
        identifierOrCriteria: 0,
        startAmount: 1000,
        endAmount: 1000,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
        _recipient.address
      );
      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_1, '1000', erc20.address, '0', dataForSeaportWithSelector);

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: buyerLocal1.address, value: 0});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(seller.address)).to.equal(1000);
      expect(await erc721.balanceOf(seller.address)).to.equal(0);
      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(1);
    });

    it('Test singlePurchase Seaport - fulfillAvailableAdvancedOrders through data selector, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
      const _recipient = buyerLocal1.address;
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

      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_1, '100', ZERO, '0', dataForSeaportWithSelector);

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: buyerLocal1.address, value: 100});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAvailableAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller.address)).to.equal(0);
      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(1);
    });

    it('Test singlePurchase Seaport - fulfillAvailableAdvancedOrders through data selector, ERC721<->ERC20', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const erc20 = await prepareERC20(buyerLocal1, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_SEAPORT_1_1, seaport_1_1.address);

      const considerationItemLeft = {
        itemType: 1,
        token: erc20.address,
        identifierOrCriteria: 0,
        startAmount: 1000,
        endAmount: 1000,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
      const _recipient = buyerLocal1.address;
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

      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_1, '1000', erc20.address, '0', dataForSeaportWithSelector);

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: buyerLocal1.address, value: 0});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAvailableAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());

      expect(await erc20.balanceOf(seller.address)).to.equal(1000);
      expect(await erc721.balanceOf(seller.address)).to.equal(0);
      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(1);
    });
  });

  describe('X2Y2 orders', () => {
    it('Test singlePurchase X2Y2, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(erc721Delegate.address, true, {from: seller.address});

      const orderItem = await generateItemX2Y2(tokenId, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: seller.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData, ZERO, ZERO, {from: buyer.address, value: 1000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Test singlePurchase X2Y2, ERC1155<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      const amount = 5;
      await erc1155.mint(seller.address, tokenId, amount),
        await erc1155.connect(seller).setApprovalForAll(erc1155Delegate.address, true, {from: seller.address});

      const tokenDataToEncode = [
        {
          token: erc1155.address,
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
        user: seller.address,
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
            executionDelegate: erc1155Delegate.address,
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
          user: bulkExchange.address,
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData, ZERO, ZERO, {from: buyer.address, value: 1000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc1155.balanceOf(buyer.address, tokenId)).to.equal(amount);
    });

    it('Test singlePurchase X2Y2, advanced ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(erc721Delegate.address, true, {from: seller.address});

      const orderItem = await generateItemX2Y2(tokenId, '1000');

      const notRealItem0 = await generateItemX2Y2('1234560', '100000');
      const notRealItem2 = await generateItemX2Y2('1234562', '100000');
      const notRealItem3 = await generateItemX2Y2('1234563', '100000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: seller.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeData = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData, ZERO, ZERO, {from: buyer.address, value: 1000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Test bulkPurchase X2Y2 (num orders = 2), ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.mint(seller.address, tokenId2);
      await erc721.connect(seller).setApprovalForAll(erc721Delegate.address, true, {from: seller.address});

      const orderItem = await generateItemX2Y2(tokenId, '1000');
      const orderItem2 = await generateItemX2Y2(tokenId2, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: seller.address,
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
        user: seller.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
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
        .bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {from: buyer.address, value: 2000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
      expect(await erc721.ownerOf(tokenId2)).to.equal(buyer.address);
    });

    it('Test bulkPurchase X2Y2 (num orders = 2), ERC1155<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      const amount = 5;
      await erc1155.mint(seller.address, tokenId, amount),
        await erc1155.mint(seller.address, tokenId2, amount),
        await erc1155.connect(seller).setApprovalForAll(erc1155Delegate.address, true, {from: seller.address});

      const tokenDataToEncode = [
        {
          token: erc1155.address,
          tokenId: tokenId,
          amount: amount,
        },
      ];
      const tokenDataToEncode2 = [
        {
          token: erc1155.address,
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
        user: seller.address,
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
        user: seller.address,
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
            executionDelegate: erc1155Delegate.address,
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
          user: bulkExchange.address,
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
            executionDelegate: erc1155Delegate.address,
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
          user: bulkExchange.address,
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
        .bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {from: buyer.address, value: 2000});
      const receipt = await tx.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc1155.balanceOf(buyer.address, tokenId)).to.equal(amount);
      expect(await erc1155.balanceOf(buyer.address, tokenId2)).to.equal(amount);
    });
  });

  describe('Looksrare orders', () => {
    it('Test singlePurchase Looksrare - matchAskWithTakerBidUsingETHAndWETH, ERC721<->ETH, with royalties', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(transferManagerERC721.address, true, {from: seller.address});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039',
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller.address,
        collection: erc721.address,
        price: 10000,
        tokenId: '0x3039',
        amount: 1,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(0);
      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC721
      );

      //adding royalties
      const royaltyAccount1 = wallet4;
      const royaltyAccount2 = wallet5;
      const additionalRoyalties = [
        await encodeBpPlusAccountTest(1000, royaltyAccount1.address),
        await encodeBpPlusAccountTest(2000, royaltyAccount2.address),
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

      await verifyBalanceChange(buyerLocal1.address, 13000, () =>
        verifyBalanceChange(royaltyAccount1.address, -1000, () =>
          verifyBalanceChange(royaltyAccount2.address, -2000, () =>
            bulkExchange
              .connect(buyerLocal1)
              .singlePurchase(tradeData, ZERO, ZERO, {from: buyerLocal1.address, value: 13000, gasPrice: 0})
          )
        )
      );

      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(1);
      expect(await weth.balanceOf(seller.address)).to.equal(10000);
    });

    it('Test singlePurchase Looksrare - matchAskWithTakerBidUsingETHAndWETH, ERC1155<->ETH, with royalties', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;

      await erc1155.mint(seller.address, tokenId, 10);
      await erc1155.connect(seller).setApprovalForAll(transferManagerERC1155.address, true, {from: seller.address});
      await transferSelectorNFT.addCollectionTransferManager(erc1155.address, transferManagerERC1155.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039',
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller.address,
        collection: erc1155.address,
        price: 10000,
        tokenId: '0x3039',
        amount: 10,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      expect(await erc1155.balanceOf(buyerLocal1.address, tokenId)).to.equal(0);
      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC1155
      );

      //adding royalties
      const royaltyAccount1 = wallet4;
      const royaltyAccount2 = wallet5;
      const additionalRoyalties = [
        await encodeBpPlusAccountTest(1000, royaltyAccount1.address),
        await encodeBpPlusAccountTest(2000, royaltyAccount2.address),
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

      await verifyBalanceChange(buyerLocal1.address, 13000, () =>
        verifyBalanceChange(royaltyAccount1.address, -1000, () =>
          verifyBalanceChange(royaltyAccount2.address, -2000, () =>
            bulkExchange
              .connect(buyerLocal1)
              .singlePurchase(tradeData, ZERO, ZERO, {from: buyerLocal1.address, value: 13000, gasPrice: 0})
          )
        )
      );

      expect(await erc1155.balanceOf(buyerLocal1.address, tokenId)).to.equal(10);
      expect(await weth.balanceOf(seller.address)).to.equal(10000);
    });

    it('Test bulkPurchase Looksrare (num orders = 2) - matchAskWithTakerBidUsingETHAndWETH, ERC721<->ETH, no royalties', async () => {
      const seller1 = wallet1;
      const seller2 = wallet3;
      const buyerLocal1 = wallet2;

      await erc721.mint(seller1.address, tokenId);
      await erc721.connect(seller1).setApprovalForAll(transferManagerERC721.address, true, {from: seller1.address});
      await erc721.mint(seller2.address, tokenId2);
      await erc721.connect(seller2).setApprovalForAll(transferManagerERC721.address, true, {from: seller2.address});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039', // 12345
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller1.address,
        collection: erc721.address,
        price: 10000,
        tokenId: '0x3039', // 12345
        amount: 1,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(0);
      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC721
      );

      const tradeData = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare);

      const takerBid2 = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x1E240', // 123456
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk2 = {
        isOrderAsk: true,
        signer: seller2.address,
        collection: erc721.address,
        price: 10000,
        tokenId: '0x1E240', // 123456
        amount: 1,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(0);
      const dataForLooksRare2 = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid2,
        makerAsk2,
        ERC721
      );

      const tradeData2 = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare2);

      await verifyBalanceChange(buyerLocal1.address, 20000, () =>
        bulkExchange.connect(buyerLocal1).bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {
          from: buyerLocal1.address,
          value: 20000,
          gasPrice: 0,
        })
      );

      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(2);
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await weth.balanceOf(seller1.address)).to.equal(10000);
      expect(await weth.balanceOf(seller2.address)).to.equal(10000);
    });

    it('Test bulkPurchase Looksrare (num orders = 2) - matchAskWithTakerBidUsingETHAndWETH, ERC1155<->ETH, no royalties', async () => {
      const seller1 = wallet1;
      const seller2 = wallet3;
      const buyerLocal1 = wallet2;

      await erc1155.mint(seller1.address, tokenId, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferManagerERC1155.address, true, {from: seller1.address});
      await erc1155.mint(seller2.address, tokenId2, 10);
      await erc1155.connect(seller2).setApprovalForAll(transferManagerERC1155.address, true, {from: seller2.address});
      await transferSelectorNFT.addCollectionTransferManager(erc1155.address, transferManagerERC1155.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039', // 12345
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller1.address,
        collection: erc1155.address,
        price: 10000,
        tokenId: '0x3039', // 12345
        amount: 10,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      expect(await erc1155.balanceOf(buyerLocal1.address, tokenId)).to.equal(0);
      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC1155
      );

      const tradeData = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare);

      const takerBid2 = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x1E240', // 123456
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk2 = {
        isOrderAsk: true,
        signer: seller2.address,
        collection: erc1155.address,
        price: 10000,
        tokenId: '0x1E240', // 123456
        amount: 10,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      expect(await erc1155.balanceOf(buyerLocal1.address, tokenId2)).to.equal(0);
      const dataForLooksRare2 = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid2,
        makerAsk2,
        ERC1155
      );

      const tradeData2 = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare2);

      await verifyBalanceChange(buyerLocal1.address, 20000, () =>
        bulkExchange.connect(buyerLocal1).bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {
          from: buyerLocal1.address,
          value: 20000,
          gasPrice: 0,
        })
      );

      expect(await erc1155.balanceOf(buyerLocal1.address, tokenId)).to.equal(10);
      expect(await erc1155.balanceOf(buyerLocal1.address, tokenId2)).to.equal(10);
      expect(await erc1155.balanceOf(seller1.address, tokenId)).to.equal(0);
      expect(await erc1155.balanceOf(seller2.address, tokenId2)).to.equal(0);
      expect(await weth.balanceOf(seller1.address)).to.equal(10000);
      expect(await weth.balanceOf(seller2.address)).to.equal(10000);
    });
  });

  describe('Sudoswap orders', () => {
    it('Test singlePurchase Sudoswap, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      const fact = await factorySudo.deployed();
      const lin = await linSudo.deployed();

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(fact.address, true, {from: seller.address});

      const input = [erc721.address, lin.address, seller.address, 1, '100', 0, '1000', [tokenId]];

      const tx = await (await factorySudo.connect(seller).createPairETH(...input, {from: seller.address})).wait();

      const ev = inReceipt(tx, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair = ev.args.poolAddress

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [tokenId]}] as any,
        buyer.address,
        buyer.address,
        '99999999999999',
      ] as const;

      const tradeData = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...input2)
      );

      const tx2 = await bulkExchange.connect(buyer).singlePurchase(tradeData, ZERO, ZERO, {from: buyer.address, value: 1105});
      const receipt = await tx2.wait();
      // console.log('X2Y2:', receipt.gasUsed.toString());

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Test singlePurchase Sudoswap + royalties, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const royaltyAccount1 = wallet4;
      const royaltyAccount2 = wallet5;

      const fact = await factorySudo.deployed();
      const lin = await linSudo.deployed();

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(fact.address, true, {from: seller.address});

      const input = [erc721.address, lin.address, seller.address, 1, '100', 0, '1000', [tokenId]];

      const tx = await (await factorySudo.connect(seller).createPairETH(...input, {from: seller.address})).wait();

      const ev = inReceipt(tx, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair = ev.args.poolAddress

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [tokenId]}] as any,
        buyer.address,
        buyer.address,
        '99999999999999',
      ] as const;

      const dataSudoSwap = await wrapperHelper.encodeSudoSwapCall(...input2);
      //two different royalties recipients
      const additionalRoyalties = [await encodeBpPlusAccountTest(1000, royaltyAccount1.address), await encodeBpPlusAccountTest(2000, royaltyAccount2.address)];
      //single royalty recipient
      const dataPlusAdditionalRoyaltiesStruct = {
        data: dataSudoSwap,
        additionalRoyalties: additionalRoyalties
      };
      const dataPlusAdditionalRoyalties = await wrapperHelper.encodeDataPlusRoyalties(dataPlusAdditionalRoyaltiesStruct);

      const tradeData = PurchaseData(MARKET_ID_SUDOSWAP, '1105', ZERO, await encodeDataTypeAndFees(1, 1000, 0), dataPlusAdditionalRoyalties)

      await verifyBalanceChange(buyer.address, 1546, async () =>
      	verifyBalanceChange(seller.address, -1100, async () =>
      		verifyBalanceChange(royaltyAccount1.address, -110, () =>
      		  verifyBalanceChange(royaltyAccount2.address, -221, () =>
              verifyBalanceChange(feeRecipienterUP.address, -110, () =>
                verifyBalanceChange(factorySudo.address, -5, () =>
                  verifyBalanceChange(bulkExchange.address, 0, () =>
                    bulkExchange.connect(buyer).singlePurchase(tradeData, feeRecipienterUP.address, ZERO, {from: buyer.address, value: 1546, gasPrice: 0})
                  )
                )
              )
      		  )
      		)
      	)
      );

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Test bulkPurchase Sudoswap (num orders = 2), ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      const fact = await factorySudo.deployed();
      const lin = await linSudo.deployed();

      await erc721.mint(seller.address, tokenId);
      await erc721.mint(seller.address, tokenId2);
      await erc721.connect(seller).setApprovalForAll(fact.address, true, {from: seller.address});

      const input = [erc721.address, lin.address, seller.address, 1, '100', 0, '1000', [tokenId]];
      const input2 = [erc721.address, lin.address, seller.address, 1, '100', 0, '1000', [tokenId2]];

      const tx = await (await factorySudo.connect(seller).createPairETH(...input, {from: seller.address})).wait();
      const tx2 = await (await factorySudo.connect(seller).createPairETH(...input2, {from: seller.address})).wait();

      const ev = inReceipt(tx, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair = ev.args.poolAddress

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const ev2 = inReceipt(tx2, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair2 = ev2.args.poolAddress

      expect(await erc721.ownerOf(tokenId2)).to.equal(pair2);

      const inp = [
        [{pair, nftIds: [tokenId]}] as any,
        buyer.address,
        buyer.address,
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
        buyer.address,
        buyer.address,
        '99999999999999',
      ] as const;

      const tradeData2 = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...inp2)
      );

      await bulkExchange.connect(buyer).bulkPurchase([tradeData, tradeData2], ZERO, ZERO, false, {from: buyer.address, value: 2210});

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
      expect(await erc721.ownerOf(tokenId2)).to.equal(buyer.address);
    });
  });

  describe.skip('Blur orders', () => {
    it('Test singlePurchase Blur, ERC721<->ERC20', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(executionDelegate.address, true, {from: seller.address});

      const sellOrder = {
        order: {
          trader: seller.address,
          side: 1,
          matchingPolicy: standardPolicyERC721.address,
          collection: erc721.address,
          tokenId: tokenId,
          amount: 1,
          paymentToken: weth.address,
          fees: [],
          salt: 0,
          extraParams: '0x01',
          price: '1000',
          listingTime: '100',
          expirationTime: '16757909942000',
        },
        v: 27,
        r: '0xd233a46410387ec0bc310b3d974606d643368ae73b88c48a0b971b573d534c60',
        s: '0x6f532bbb29ca86832ee0cd56ba3cfb0483d90438eb2c0e3a9a4ac658ab6053ee',
        extraSignature: '0x',
        signatureVersion: 0,
        blockNumber: 30,
      };

      const buyOrder = {
        order: {
          trader: buyer.address,
          side: 0,
          matchingPolicy: standardPolicyERC721.address,
          collection: erc721.address,
          tokenId: tokenId,
          amount: 1,
          paymentToken: weth.address,
          fees: [],
          salt: 0,
          extraParams: '0x01',
          price: '1000',
          listingTime: '100',
          expirationTime: '16757909942000',
        },
        v: 27,
        r: '0xd233a46410387ec0bc310b3d974606d643368ae73b88c48a0b971b573d534c60',
        s: '0x6f532bbb29ca86832ee0cd56ba3cfb0483d90438eb2c0e3a9a4ac658ab6053ee',
        extraSignature: '0x',
        signatureVersion: 0,
        blockNumber: 30,
      };

      // await token.connect(seller).setApprovalForAll(executionDelegate.address, true);
      // await token.connect(buyer).setApprovalForAll(executionDelegate.address, true);
      // await weth9.connect(seller).approve(executionDelegate.address, eth("10000"));
      // await weth9.connect(buyer).approve(executionDelegate.address, eth("10000"));
      // await weth9.connect(seller).approve("0x6c888f487a5a97768dee6303faf281c6efdc6203", 100000000);

      // const tradeData = PurchaseData(MARKET_ID_BLUR, '1000', '0', await wrapperHelper.encodeDataBlur(sellOrder, buyOrder))
      // const tx = await bulkExchange.singlePurchase(tradeData, ZERO, ZERO, {from: buyer.address, value: 1000})
      // const receipt = await tx.wait();
      // console.log('Blur order:', receipt.gasUsed.toString());
      await blurExchange.connect(buyer).execute(buyOrder, sellOrder, {from: buyer.address, value: 1000});

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer);
    });

    it('Test singlePurchase Blur, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyer = wallet2;

      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(executionDelegate.address, true, {from: seller.address});
      await executionDelegate.approveContract(erc721.address);

      const sellOrder = {
        order: {
          trader: seller.address,
          side: 1,
          matchingPolicy: standardPolicyERC721.address,
          collection: erc721.address,
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          fees: [],
          salt: 0,
          extraParams: '0x01',
          price: '1000',
          listingTime: '100',
          expirationTime: '16757909942000',
        },
        v: 27,
        r: '0xd233a46410387ec0bc310b3d974606d643368ae73b88c48a0b971b573d534c60',
        s: '0x6f532bbb29ca86832ee0cd56ba3cfb0483d90438eb2c0e3a9a4ac658ab6053ee',
        extraSignature: '0x',
        signatureVersion: 0,
        blockNumber: 30,
      };

      const buyOrder = {
        order: {
          trader: buyer.address,
          side: 0,
          matchingPolicy: standardPolicyERC721.address,
          collection: erc721.address,
          tokenId: tokenId,
          amount: 1,
          paymentToken: ZERO,
          fees: [],
          salt: 0,
          extraParams: '0x01',
          price: '1000',
          listingTime: '100',
          expirationTime: '16757909942000',
        },
        v: 27,
        r: '0xd233a46410387ec0bc310b3d974606d643368ae73b88c48a0b971b573d534c60',
        s: '0x6f532bbb29ca86832ee0cd56ba3cfb0483d90438eb2c0e3a9a4ac658ab6053ee',
        extraSignature: '0x',
        signatureVersion: 0,
        blockNumber: 30,
      };

      // await token.connect(seller).setApprovalForAll(executionDelegate.address, true);
      // await token.connect(buyer).setApprovalForAll(executionDelegate.address, true);
      // await weth9.connect(seller).approve(executionDelegate.address, eth("10000"));
      // await weth9.connect(buyer).approve(executionDelegate.address, eth("10000"));
      // await weth9.connect(seller).approve("0x6c888f487a5a97768dee6303faf281c6efdc6203", 100000000);

      // const tradeData = PurchaseData(MARKET_ID_BLUR, '1000', '0', await wrapperHelper.encodeDataBlur(sellOrder, buyOrder))
      // const tx = await bulkExchange.singlePurchase(tradeData, ZERO, ZERO, {from: buyer.adress, value: 1000})
      // const receipt = await tx.wait();
      // console.log('Blur order:', receipt.gasUsed.toString());
      await blurExchange.connect(buyer).execute(buyOrder, sellOrder, {from: buyer.address, value: 1000});

      expect(await erc721.ownerOf(tokenId)).to.equal(buyer);
    });

    it('Test singlePurchase Blur, ERC1155<->ETH', async () => {});

    it('Test bulkPurchase Blur (num orders = 2), ERC721<->ETH', async () => {});

    it('Test bulkPurchase Blur (num orders = 2), ERC1155<->ETH', async () => {});

    // combined gm + blur
    // combined all with blur
  });

  describe('Combined orders', () => {
    it('Test bulkPurchase GhostMarket & Rarible (num orders = 2, type = V2/V1), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc1155.mint(seller1.address, erc1155TokenId1, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc1155.mint(seller2.address, erc1155TokenId2, 10);
      await erc1155.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});

      //NB!!! set buyer in payouts
      const encDataLeft = await encDataV2([[], [], false]);
      const encDataLeftV1 = await encDataV1([[], []]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);
      const encDataRightV1 = await encDataV1([[[buyer.address, 10000]], []]);

      const left1 = Order(
        seller1.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const left2 = Order(
        seller2.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, rarible.address);
      //NB!!! DONT Need to signature buy orders, because ExchangeBulkV2 is  msg.sender == buyOrder.maker

      const directPurchaseParams1 = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc721TokenId1),
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
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenId2),
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

      await verifyBalanceChange(buyer.address, 161, async () =>
        verifyBalanceChange(seller1.address, -60, async () =>
          verifyBalanceChange(seller2.address, -80, async () =>
            verifyBalanceChange(feeRecipienterUP.address, -21, () =>
              bulkExchange
                .connect(buyer)
                .bulkPurchase([tradeData1, tradeData2], feeRecipienterUP.address, ZERO, false, {
                  from: buyer.address,
                  value: 400,
                  gasPrice: 0,
                })
            )
          )
        )
      );
      expect(await erc1155.balanceOf(seller1.address, erc1155TokenId1)).to.equal(4);
      expect(await erc1155.balanceOf(seller2.address, erc1155TokenId2)).to.equal(2);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).to.equal(6);
      expect(await erc1155.balanceOf(wallet2.address, erc1155TokenId2)).to.equal(8);
    });

    it('Test bulkPurchase GhostMarket & Seaport (num orders = 3), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;

      const erc721TokenIdLocal1 = '5';
      await erc721.mint(seller1.address, erc721TokenIdLocal1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      await erc721.mint(seller2.address, tokenId);
      await erc721.connect(seller2).setApprovalForAll(seaport_1_1.address, true, {from: seller2.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenIdLocal1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft = await getSignature(left, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenIdLocal1),
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
        recipient: seller2.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: '0x3039', // 12345
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller2.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
        _recipient.address
      );
      const tradeDataSeaPort = PurchaseData(MARKET_ID_SEAPORT_1_1, '100', ZERO, '0', dataForSeaportWithSelector);

      await bulkExchange.connect(buyer).bulkPurchase([tradeDataGhostMarket, tradeDataSeaPort], ZERO, ZERO, false, {
        from: buyer.address,
        value: 400,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(2);
    });

    it('Test bulkPurchase GhostMarket & X2Y2 (num orders = 2), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;

      const erc721TokenIdLocal1 = '5';
      await erc721.mint(seller1.address, erc721TokenIdLocal1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      await erc721.mint(seller1.address, tokenId);
      await erc721.connect(seller1).setApprovalForAll(erc721Delegate.address, true, {from: seller1.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenIdLocal1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft = await getSignature(left, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenIdLocal1),
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
        user: seller1.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeDataX2Y2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      await bulkExchange.connect(buyer).bulkPurchase([tradeDataGhostMarket, tradeDataX2Y2], ZERO, ZERO, false, {
        from: buyer.address,
        value: 1400,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(2);
    });

    it('Test bulkPurchase GhostMarket & Looksrare (num orders = 2), ERC1155<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;

      await erc1155.mint(seller1.address, tokenId, 10);
      await erc1155.connect(seller1).setApprovalForAll(transferManagerERC1155.address, true, {from: seller1.address});

      const erc1155TokenIdLocal2 = '6';
      await erc1155.mint(seller2.address, erc1155TokenIdLocal2, 10);
      await erc1155.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 10000,
        tokenId: '0x3039',
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller1.address,
        collection: erc1155.address,
        price: 10000,
        tokenId: '0x3039',
        amount: 10,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      expect(await erc1155.balanceOf(buyer.address, tokenId)).to.equal(0);
      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC1155
      );

      const tradeDataLooksRare = PurchaseData(MARKET_ID_LOOKSRARE, '10000', ZERO, '0', dataForLooksRare);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left2 = Order(
        seller2.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenIdLocal2), '10'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft2 = await getSignature(left2, seller2.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller2.address,
        sellOrderNftAmount: 10,
        nftAssetClass: ERC1155,
        nftData: enc(erc1155.address, erc1155TokenIdLocal2),
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

      await bulkExchange
        .connect(buyer)
        .bulkPurchase([tradeDataLooksRare, tradeDataGhostMarket], feeRecipienterUP.address, ZERO, false, {
          from: buyer.address,
          value: 10100,
          gasPrice: 0,
        });

      expect(await erc1155.balanceOf(seller1.address, erc1155TokenIdLocal2)).to.equal(0);
      expect(await erc1155.balanceOf(seller2.address, tokenId)).to.equal(0);
      expect(await erc1155.balanceOf(buyer.address, erc1155TokenIdLocal2)).to.equal(5);
      expect(await erc1155.balanceOf(buyer.address, tokenId)).to.equal(10);
      expect(await weth.balanceOf(seller1.address)).to.equal(10000);
    });

    it('Test bulkPurchase GhostMarket & SudoSwap (num orders = 2), ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;

      const erc721TokenIdLocal1 = '5';
      await erc721.mint(seller1.address, erc721TokenIdLocal1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const fact = await factorySudo.deployed();
      const lin = await linSudo.deployed();

      await erc721.mint(seller1.address, tokenId);
      await erc721.connect(seller1).setApprovalForAll(fact.address, true, {from: seller1.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenIdLocal1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signatureLeft = await getSignature(left, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenIdLocal1),
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

      const input = [erc721.address, lin.address, seller1.address, 1, '100', 0, '1000', [tokenId]];

      const tx = await (await factorySudo.connect(seller1).createPairETH(...input, {from: seller1.address})).wait();

      const ev = inReceipt(tx, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair = ev.args.poolAddress

      expect(await erc721.ownerOf(tokenId)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [tokenId]}] as any,
        buyer.address,
        buyer.address,
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
        from: buyer.address,
        value: 1400,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(seller2.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(2);
    });

    it('Test bulkPurchase 3 ETH - 3 ERC20 (ExchangeV2 V2, Rarible V3, Seaport)', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const feeRecipientSecond = wallet7;
      const zoneAddr = wallet2;

      //ghostmarket V2 order - eth
      await erc721.mint(seller.address, erc721TokenId1);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, seller.address, exchangeV2Proxy.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //ghostmarket V2 order - erc20
      await erc721.mint(seller.address, erc721TokenId2);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const erc20 = await prepareERC20(buyer, '1000000');

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, erc20TransferProxy.address);

      const encDataLeft2 = await encDataV2([[], [], false]);
      const encDataRight2 = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left2 = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams2 = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft2,
        sellOrderSignature: await getSignature(left2, seller.address, exchangeV2Proxy.address),
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight2,
      };

      const data2 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams2);
      const tradeData2 = PurchaseData(MARKET_ID_GHOSTMARKET, '1000', erc20.address, await encodeFees(500, 1000), data2);

      //rarible V3 order - eth
      await erc721.mint(seller.address, erc721TokenId3);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft3 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight3 = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left3 = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId3), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft3
      );

      const directPurchaseParams3 = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId3),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft3,
        sellOrderSignature: await getSignature(left3, seller.address, rarible.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight3,
      };

      const data3 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams3);
      const tradeData3 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data3);

      //rarible V3 order - erc20
      await erc721.mint(seller.address, erc721TokenId4);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_RARIBLE, erc20TransferProxy.address);

      const encDataLeft4 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight4 = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left4 = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId4), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '1000'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft4
      );

      const directPurchaseParams1 = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId4),
        sellOrderPaymentAmount: 1000,
        paymentToken: erc20.address,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft4,
        sellOrderSignature: await getSignature(left4, seller.address, rarible.address),
        buyOrderPaymentAmount: 1000,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight4,
      };

      const data4 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData4 = PurchaseData(MARKET_ID_RARIBLE, '1000', erc20.address, await encodeFees(500, 1000), data4);

      //seaport order - eth
      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
      const _recipient = buyer.address;

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_1,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //seaport order - erc20
      await erc721.mint(seller.address, tokenId2);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_SEAPORT_1_1, seaport_1_1.address);

      const considerationItemLeft2 = {
        itemType: 1,
        token: erc20.address,
        identifierOrCriteria: 0,
        startAmount: 1000,
        endAmount: 1000,
        recipient: seller.address,
      };

      const offerItemLeft2 = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: tokenId2,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft2 = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
      const _recipient2 = buyer.address;

      const dataForSeaportWithSelector2 = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder2,
        _criteriaResolvers2,
        _fulfillerConduitKey2,
        _recipient2
      );

      const tradeDataSeaPort2 = PurchaseData(
        MARKET_ID_SEAPORT_1_1,
        '1000',
        erc20.address,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector2
      );

      const tx = await (
        await verifyBalanceChangeReturnTx(buyer.address, 345, async () =>
          verifyBalanceChangeReturnTx(seller.address, -300, async () =>
            verifyBalanceChangeReturnTx(feeRecipienterUP.address, -15, () =>
              verifyBalanceChangeReturnTx(feeRecipientSecond.address, -30, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData, tradeData2, tradeData3, tradeData4, tradeDataSeaPort, tradeDataSeaPort2],
                    feeRecipienterUP.address,
                    feeRecipientSecond.address,
                    false,
                    {from: buyer.address, value: 400, gasPrice: 0}
                  )
              )
            )
          )
        )
      ).wait();
      inReceipt(tx, 'Execution', [true, buyer.address]);

      expect(await erc20.balanceOf(feeRecipienterUP.address)).to.equal(150);
      expect(await erc20.balanceOf(feeRecipientSecond.address)).to.equal(300);
      expect(await erc20.balanceOf(seller.address)).to.equal(3000);
      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId3)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId4)).to.equal(buyer.address);
      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Test bulkPurchase 5%+10% fees for all (ExchangeV2 V2, Rarible V3, Seaport, X2Y2, Looksrare, SudoSwap)', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const feeRecipientSecond = wallet7;
      const zoneAddr = wallet2;

      //ghostmarket V2 order
      await erc721.mint(seller.address, erc721TokenId1);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, seller.address, exchangeV2Proxy.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(seller.address, erc721TokenId2);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft1
      );

      const directPurchaseParams1 = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, seller.address, rarible.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data1);

      //seaport ORDER
      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
      const _recipient = buyer.address;

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_1,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //x2y2 order
      await erc721.mint(seller.address, erc721TokenId4);
      await erc721.connect(seller).setApprovalForAll(erc721Delegate.address, true, {from: seller.address});

      const orderItem = await generateItemX2Y2(erc721TokenId4, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: seller.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
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
      await erc721.mint(seller.address, erc721TokenId3);
      await erc721.connect(seller).setApprovalForAll(transferManagerERC721.address, true, {from: seller.address});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 100,
        tokenId: erc721TokenId3,
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller.address,
        collection: erc721.address,
        price: 100,
        tokenId: erc721TokenId3,
        amount: 1,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC721
      );
      const tradeDataLooksRare = PurchaseData(
        MARKET_ID_LOOKSRARE,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForLooksRare
      );

      //sudoSwapOrder
      const fact = await factorySudo.deployed();
      const lin = await linSudo.deployed();

      await erc721.mint(seller.address, erc721TokenId5);
      await erc721.connect(seller).setApprovalForAll(fact.address, true, {from: seller.address});

      const inp = [erc721.address, lin.address, seller.address, 1, '100', 0, '1000', [erc721TokenId5]];

      const suTx = await (await factorySudo.connect(seller).createPairETH(...inp, {from: seller.address})).wait();

      const ev = inReceipt(suTx, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair = ev.args.poolAddress

      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [erc721TokenId5]}] as any,
        buyer.address,
        buyer.address,
        '99999999999999',
      ] as const;

      const tradeDataSudoSwap = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '1105',
        ZERO,
        '0',
        await wrapperHelper.encodeSudoSwapCall(...input2)
      );

      const tx = await (
        await verifyBalanceChangeReturnTx(buyer.address, 2715, async () =>
          verifyBalanceChangeReturnTx(seller.address, -2395, async () =>
            verifyBalanceChangeReturnTx(feeRecipienterUP.address, -70, () =>
              verifyBalanceChangeReturnTx(feeRecipientSecond.address, -140, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData, tradeData1, tradeDataSeaPort, tradeDataX2Y2, tradeDataLooksRare, tradeDataSudoSwap],
                    feeRecipienterUP.address,
                    feeRecipientSecond.address,
                    false,
                    {from: buyer.address, value: 3785, gasPrice: 0}
                  )
              )
            )
          )
        )
      ).wait();
      inReceipt(tx, 'Execution', [true, buyer.address]);

      expect(await weth.balanceOf(seller.address)).to.equal(100);
      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId3)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId4)).to.equal(buyer.address);
      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Test bulkPurchase 5%+10% fees for all (ExchangeV2 V2, Rarible V3, Seaport, X2Y2, Looksrare, SudoSwap), 1 fail', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const zoneAddr = wallet2;
      const feeRecipientSecond = wallet7;

      //GhostMarket V2 order
      await erc721.mint(seller.address, erc721TokenId1);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, seller.address, exchangeV2Proxy.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(seller.address, erc721TokenId2);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft1
      );

      const directPurchaseParams1 = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 100,
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, seller.address, rarible.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data1);

      //Seaport order
      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
      const _recipient = buyer.address;

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_1,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //x2y2 order
      await erc721.mint(seller.address, erc721TokenId4);
      await erc721.connect(seller).setApprovalForAll(erc721Delegate.address, true, {from: seller.address});

      const orderItem = await generateItemX2Y2(erc721TokenId4, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: seller.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeDataX2Y2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      //looksRareOrder
      await erc721.mint(seller.address, erc721TokenId3);
      await erc721.connect(seller).setApprovalForAll(transferManagerERC721.address, true, {from: seller.address});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 100,
        tokenId: erc721TokenId3,
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller.address,
        collection: erc721.address,
        price: 10000, // should be 100 - forced to make trade fail
        tokenId: erc721TokenId3,
        amount: 1,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC721
      );
      const tradeDataLooksRare = PurchaseData(
        MARKET_ID_LOOKSRARE,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForLooksRare
      );

      //sudoSwapOrder
      const fact = await factorySudo.deployed();
      const lin = await linSudo.deployed();

      await erc721.mint(seller.address, erc721TokenId5);
      await erc721.connect(seller).setApprovalForAll(fact.address, true, {from: seller.address});

      const inp = [erc721.address, lin.address, seller.address, 1, '100', 0, '1000', [erc721TokenId5]];

      const suTx = await (await factorySudo.connect(seller).createPairETH(...inp, {from: seller.address})).wait();

      const ev = inReceipt(suTx, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair = ev.args.poolAddress

      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [erc721TokenId5]}] as any,
        buyer.address,
        buyer.address,
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
            feeRecipienterUP.address,
            feeRecipientSecond.address,
            false,
            {from: buyer.address, value: 2580, gasPrice: 0}
          )
      ).to.be.revertedWith('Strategy: Execution invalid');

      const tx = await (
        await verifyBalanceChangeReturnTx(buyer.address, 2450, async () =>
          verifyBalanceChangeReturnTx(seller.address, -2395, async () =>
            verifyBalanceChangeReturnTx(feeRecipienterUP.address, -15, () =>
              verifyBalanceChangeReturnTx(feeRecipientSecond.address, -30, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase(
                    [tradeData, tradeData1, tradeDataSeaPort, tradeDataX2Y2, tradeDataLooksRare, tradeDataSudoSwap],
                    feeRecipienterUP.address,
                    feeRecipientSecond.address,
                    true,
                    {from: buyer.address, value: 2670, gasPrice: 0}
                  )
              )
            )
          )
        )
      ).wait();
      for (let i = 0; i < tx.events.length; i++) {
        if (tx.events[i].event === 'Execution') {
          if (i === 19) {
            expect(parseInt(tx.events[i].data)).to.equal(0);
          } else {
            expect(parseInt(tx.events[i].data)).to.equal(1);
          }
        }
      }

      expect(await erc721.ownerOf(erc721TokenId1)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId2)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId4)).to.equal(buyer.address);
      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(buyer.address);
      expect(await erc721.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Test bulkPurchase 5%+10% fees for all (ExchangeV2 V2, Rarible V3, Seaport, X2Y2, Looksrare, SudoSwap), all fail = revert', async () => {
      const seller = wallet1;
      const buyer = wallet2;
      const zoneAddr = wallet2;
      const feeRecipientSecond = wallet7;

      //GhostMarket V2 order
      await erc721.mint(seller.address, erc721TokenId1);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const directPurchaseParams = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: 10000, // should be 100 - forced to make trade fail
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: await getSignature(left, seller.address, exchangeV2Proxy.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight,
      };

      const data = await wrapperHelper.getDataDirectPurchase(directPurchaseParams);
      const tradeData = PurchaseData(MARKET_ID_GHOSTMARKET, '100', ZERO, await encodeFees(500, 1000), data);

      //rarible V3 order
      await erc721.mint(seller.address, erc721TokenId2);
      await erc721.connect(seller).setApprovalForAll(transferProxy.address, true, {from: seller.address});

      const encDataLeft1 = await encDataV3_SELL([0, 0, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight1 = await encDataV3_BUY([await LibPartToUint(buyer.address, 10000), 0, 0, MARKET_MARKER_SELL]);

      const left1 = Order(
        seller.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId2), '1'),
        ZERO,
        Asset(ETH, '0x', '100'),
        '2',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft1
      );

      const directPurchaseParams1 = {
        sellOrderMaker: seller.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId2),
        sellOrderPaymentAmount: 10000, // should be 100 - forced to make trade fail
        paymentToken: ZERO,
        sellOrderSalt: 2,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft1,
        sellOrderSignature: await getSignature(left1, seller.address, rarible.address),
        buyOrderPaymentAmount: 100,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight1,
      };

      const data1 = await wrapperHelper.getDataDirectPurchase(directPurchaseParams1);
      const tradeData1 = PurchaseData(MARKET_ID_RARIBLE, '100', ZERO, await encodeFees(500, 1000), data1);

      //Seaport order
      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport_1_1.address, true, {from: seller.address});

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 10000, // should be 100 - forced to make trade fail
        endAmount: 100,
        recipient: seller.address,
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: tokenId,
        startAmount: 1,
        endAmount: 1,
      };

      const OrderParametersLeft = {
        offerer: seller.address, // 0x00
        zone: zoneAddr.address, // 0x20
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
      const _recipient = buyer.address;

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(
        _advancedOrder,
        _criteriaResolvers,
        _fulfillerConduitKey,
        _recipient
      );

      const tradeDataSeaPort = PurchaseData(
        MARKET_ID_SEAPORT_1_1,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForSeaportWithSelector
      );

      //x2y2 order
      await erc721.mint(seller.address, erc721TokenId4);
      await erc721.connect(seller).setApprovalForAll(erc721Delegate.address, true, {from: seller.address});

      const orderItem = await generateItemX2Y2(erc721TokenId4, '1000');

      const order = {
        salt: '216015207580153061888244896739707431392',
        user: seller.address,
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
            executionDelegate: erc721Delegate.address,
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
          user: bulkExchange.address,
          canFail: false,
        },
        r: '0xc0f030ffba87896654c2981bda9c5ef0849c33a2b637fea7a777c8019ca13427',
        s: '0x26b893c0b10eb13815aae1e899ecb02dd1b2ed1995c21e4f1eb745e14f49f51f',
        v: 28,
      };

      const tradeDataX2Y2 = PurchaseData(MARKET_ID_X2Y2, '1000', ZERO, '0', await wrapperHelper.encodeX2Y2Call(input));

      //looksRareOrder
      await erc721.mint(seller.address, erc721TokenId3);
      await erc721.connect(seller).setApprovalForAll(transferManagerERC721.address, true, {from: seller.address});
      await transferSelectorNFT.addCollectionTransferManager(erc721.address, transferManagerERC721.address);

      const takerBid = {
        isOrderAsk: false,
        taker: bulkExchange.address,
        price: 100,
        tokenId: erc721TokenId3,
        minPercentageToAsk: 8000,
        params: '0x',
      };
      const makerAsk = {
        isOrderAsk: true,
        signer: seller.address,
        collection: erc721.address,
        price: 10000, // should be 100 - forced to make trade fail
        tokenId: erc721TokenId3,
        amount: 1,
        strategy: strategy.address,
        currency: weth.address,
        nonce: 16,
        startTime: 0,
        endTime: '0xff00000000000000000000000000',
        minPercentageToAsk: 8000,
        params: '0x',
        v: 28,
        r: '0x66719130e732d87a2fd63e4b5360f627d013b93a9c6768ab3fa305c178c84388',
        s: '0x6f56a6089adf5af7cc45885d4294ebfd7ea9326a42aa977fc0732677e007cdd3',
      };

      const dataForLooksRare = await wrapperHelper.getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(
        takerBid,
        makerAsk,
        ERC721
      );
      const tradeDataLooksRare = PurchaseData(
        MARKET_ID_LOOKSRARE,
        '100',
        ZERO,
        await encodeFees(500, 1000),
        dataForLooksRare
      );

      //sudoSwapOrder
      const fact = await factorySudo.deployed();
      const lin = await linSudo.deployed();

      await erc721.mint(seller.address, erc721TokenId5);
      await erc721.connect(seller).setApprovalForAll(fact.address, true, {from: seller.address});

      const inp = [erc721.address, lin.address, seller.address, 1, '100', 0, '1000', [erc721TokenId5]];

      const suTx = await (await factorySudo.connect(seller).createPairETH(...inp, {from: seller.address})).wait();

      const ev = inReceipt(suTx, 'NewPair', (ev: any) => {
        return ev;
      });

      const pair = ev.args.poolAddress

      expect(await erc721.ownerOf(erc721TokenId5)).to.equal(pair);

      const input2 = [
        [{pair, nftIds: [erc721TokenId5]}] as any,
        buyer.address,
        buyer.address,
        '99999999999999',
      ] as const;

      const tradeDataSudoSwap = PurchaseData(
        MARKET_ID_SUDOSWAP,
        '115',  // should be 1105 - forced to make trade fail
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
            feeRecipienterUP.address,
            feeRecipientSecond.address,
            false,
            {from: buyer.address, value: 1580, gasPrice: 0}
          )
      ).to.be.revertedWith('Purchase GhostMarket failed');

      // all fail = revert
      await expect(
        bulkExchange
          .connect(buyer)
          .bulkPurchase(
            [tradeData, tradeData1, tradeDataSeaPort, tradeDataX2Y2, tradeDataLooksRare, tradeDataSudoSwap],
            feeRecipienterUP.address,
            feeRecipientSecond.address,
            true,
            {from: buyer.address, value: 3580, gasPrice: 0}
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

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', priceIn),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set uniswap v3 router
      await bulkExchange.setUniswapV3(uniswapV3Router.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set wrapped
      await bulkExchange.setWrapped(weth.address);
      // wrap some eth
      await weth.deposit({value: priceIn});
      // prefill uni pool with weth
      await weth.transfer(uniswapV3Router.address, priceIn);
      // mint some erc20 to buyer
      await erc20.mint(buyer.address, priceOut);
      // approve erc20 from buyer
      await erc20.connect(buyer).approve(erc20TransferProxy.address, priceOut, {from: buyer.address});

      //exception if not sending ETH and no swap
      await expect(
        bulkExchange.connect(buyer).singlePurchase(tradeData1, ZERO, ZERO, {from: buyer.address, value: 0, gasPrice: 0})
      ).to.be.revertedWith('Purchase GhostMarket failed');

      // buy with swap - not unwrapping - will fail
      const encodedPath = encodePath([weth.address, erc20.address], [3000]);
      const swapDetails: any = [
        encodedPath, // encoded path
        priceIn, // amount out
        priceOut, // amount in max
        false,
      ];

      await expect(
        bulkExchange.connect(buyer).bulkPurchaseWithSwap([tradeData1], ZERO, ZERO, false, swapDetails, {
          from: buyer.address,
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
        from: buyer.address,
        value: 0,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test uniswap v3 ERC20/ERC20 + order ExchangeV2 - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet1;
      const seller1 = wallet2;
      const price = '123';
      const priceHigher = '32832900';
      const minted = '10000000000000000';

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const erc20 = await prepareERC20(buyer, minted);
      const erc202 = await prepareERC20(buyer, minted);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), price),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: price,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, price, erc20.address, '0', dataForExchCall1);

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set uniswap v3 router
      await bulkExchange.setUniswapV3(uniswapV3Router.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // prefill uni pool with erc20
      await erc20.transfer(uniswapV3Router.address, priceHigher);

      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, erc20TransferProxy.address);

      // buy with swap
      const encodedPath = encodePath([erc20.address, erc202.address], [3000]);
      const swapDetails2: any = [
        encodedPath, // encoded path
        priceHigher, // amount out intentionally higher than required - difference is refunded
        priceHigher, // amount in max intentionally higher than required - difference is refunded
        false,
      ];

      await bulkExchange.connect(buyer).bulkPurchaseWithSwap([tradeData1], ZERO, ZERO, false, swapDetails2, {
        from: buyer.address,
        value: 0,
        gasPrice: 0,
      });

      expect(await erc202.balanceOf(uniswapV3Router.address)).to.equal(priceHigher);
      expect(await erc202.balanceOf(buyer.address)).to.equal('9999999967167100'); // minted - priceHigher
      expect(await erc20.balanceOf(seller1.address)).to.equal(price);
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test uniswap v2 ERC20/ETH + order ExchangeV2 - V2 order, ERC721<->ETH', async () => {
      const buyer = wallet1;
      const seller1 = wallet2;
      const priceIn = '10000000000000000';
      const priceOut = '32832900';

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', priceIn),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
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
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set uniswap v2 router
      await bulkExchange.setUniswapV2(uniswapV2Router.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // set wrapped
      await bulkExchange.setWrapped(weth.address);
      // prefill uni pool with eth
      await wallet0.sendTransaction({to: uniswapV2Router.address, value: priceIn});
      // mint some erc20 to buyer
      await erc20.mint(buyer.address, priceOut);
      // approve erc20 from buyer
      await erc20.connect(buyer).approve(erc20TransferProxy.address, priceOut, {from: buyer.address});

      // swap details
      const encodedPath = [erc20.address, weth.address];
      const swapDetails: any = [
        encodedPath, // encoded path
        priceIn, // amount out
        priceOut, // amount in max
        [0], // binSteps
        false, // wrap eth to weth
      ];

      await bulkExchange.connect(buyer).bulkPurchaseWithV2Swap([tradeData1], ZERO, ZERO, false, swapDetails, {
        from: buyer.address,
        value: 0,
        gasPrice: 0,
      });

      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test uniswap v2 ERC20/ERC20 + order ExchangeV2 - V2 order, ERC721<->ERC20', async () => {
      const buyer = wallet1;
      const seller1 = wallet2;
      const price = '123';
      const priceHigher = '32832900';
      const minted = '10000000000000000';

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});

      const erc20 = await prepareERC20(buyer, minted);
      const erc202 = await prepareERC20(buyer, minted);

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[[buyer.address, 10000]], [], false]);

      const left1 = Order(
        seller1.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), price),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: seller1.address,
        sellOrderNftAmount: 1,
        nftAssetClass: ERC721,
        nftData: enc(erc721.address, erc721TokenId1),
        sellOrderPaymentAmount: price,
        paymentToken: erc20.address,
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
      const tradeData1 = PurchaseData(MARKET_ID_GHOSTMARKET, price, erc20.address, '0', dataForExchCall1);

      // add wrapper as an operator of erc20 transfer proxy
      await erc20TransferProxy.addOperator(bulkExchange.address);
      // set uniswap v2 router
      await bulkExchange.setUniswapV2(uniswapV2Router.address);
      // set erc20 transfer proxy
      await bulkExchange.setTransferProxy(erc20TransferProxy.address);
      // prefill uni pool with erc20
      await erc20.transfer(uniswapV2Router.address, priceHigher);

      // set exchange v2 transfer proxy
      await bulkExchange.setMarketProxy(MARKET_ID_GHOSTMARKET, erc20TransferProxy.address);

      // swap details
      const encodedPath = [erc202.address, erc20.address];
      const swapDetails: any = [
        encodedPath, // encoded path
        priceHigher, // amount out intentionally higher than required - difference is refunded
        priceHigher, // amount out intentionally higher than required - difference is refunded
        [0], // binSteps
        false, // wrap eth to weth
      ];

      await bulkExchange.connect(buyer).bulkPurchaseWithV2Swap([tradeData1], ZERO, ZERO, false, swapDetails, {
        from: buyer.address,
        value: 0,
        gasPrice: 0,
      });

      expect(await erc202.balanceOf(uniswapV2Router.address)).to.equal(priceHigher);
      expect(await erc202.balanceOf(buyer.address)).to.equal('9999999967167100'); // minted - priceHigher
      expect(await erc20.balanceOf(seller1.address)).to.equal(price);
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
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
        token: erc721.address,
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
    await asSigner.mint(user.address, value);
    await asSigner.approve(erc20TransferProxy.address, value, {from: user.address});
    return asSigner;
  }
});
