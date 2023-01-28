/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {
  ERC20TransferProxy,
  TransferProxy,
  ExchangeV2,
  ExchangeWrapper,
  RoyaltiesRegistry,
  TestDummyERC721,
  TestDummyERC1155,
  TestHelper,
  WrapperHelper,
} from '../typechain';
// seaport
import SeaportArtifact from '../src/exchange-wrapper/artifacts/Seaport.json';
import ConduitControllerArtifact from '../src/exchange-wrapper/artifacts/ConduitController.json';
// wyvern
import WyvernExchangeWithBulkCancellationsArtifact from '../src/exchange-wrapper/artifacts/WyvernExchangeWithBulkCancellations.json';
import WyvernTokenTransferProxyArtifact from '../src/exchange-wrapper/artifacts/WyvernTokenTransferProxy.json';
import MerkleValidatorArtifact from '../src/exchange-wrapper/artifacts/MerkleValidator.json';
import WyvernProxyRegistryArtifact from '../src/exchange-wrapper/artifacts/WyvernProxyRegistry.json';
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
import {verifyBalanceChange} from './utils/helpers';

describe('ExchangeWrapper Test', async function () {
  let rarible: ExchangeV2;
  let exchangeV2Proxy: ExchangeV2;
  let bulkExchange: ExchangeWrapper;
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let erc721: TestDummyERC721;
  let erc1155: TestDummyERC1155;
  let royaltiesRegistryProxy: RoyaltiesRegistry;
  let testHelper: TestHelper;
  let wrapperHelper: WrapperHelper;
  let seaport: any;
  let conduitController: any;
  let wyvernProxyRegistry: any;
  let wyvernTokenTransferProxy: any;
  let wyvernExchangeWithBulkCancellations: any;
  let merkleValidator: any;
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
  let wyvernProtocolFeeAddress: SignerWithAddress;
  let makerLeft: SignerWithAddress;
  let makerRight: SignerWithAddress;
  const MARKET_MARKER_SELL = '0x67686f73746d61726b65745f76335f73656c6c00000000000000000000000000'; // ghostmarket_v3_sell
  const MARKET_MARKER_BUY = '0x67686f73746d61726b65745f76335f6275790000000000000000000000000000'; // ghostmarket_v3_buy
  const tokenId = '12345';
  const erc721TokenId1 = '55';
  const erc721TokenId2 = '56';
  const erc721TokenId3 = '57';
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
    wyvernProtocolFeeAddress = wallet9;
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const ExchangeV2Test = await ethers.getContractFactory('ExchangeV2');
    const BulkExchange = await ethers.getContractFactory('ExchangeWrapper');
    const TestERC721 = await ethers.getContractFactory('TestDummyERC721');
    const TestERC1155 = await ethers.getContractFactory('TestDummyERC1155');
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    const TestHelper = await ethers.getContractFactory('TestHelper');
    const WrapperHelper = await ethers.getContractFactory('WrapperHelper');
    const Seaport = await ethers.getContractFactory(SeaportArtifact.abi, SeaportArtifact.bytecode);
    const ConduitController = await ethers.getContractFactory(
      ConduitControllerArtifact.abi,
      ConduitControllerArtifact.bytecode
    );
    const WyvernExchangeWithBulkCancellations = await ethers.getContractFactory(
      WyvernExchangeWithBulkCancellationsArtifact.abi,
      WyvernExchangeWithBulkCancellationsArtifact.bytecode
    );
    const WyvernTokenTransferProxy = await ethers.getContractFactory(
      WyvernTokenTransferProxyArtifact.abi,
      WyvernTokenTransferProxyArtifact.bytecode
    );
    const MerkleValidator = await ethers.getContractFactory(
      MerkleValidatorArtifact.abi,
      MerkleValidatorArtifact.bytecode
    );
    const WyvernProxyRegistry = await ethers.getContractFactory(
      WyvernProxyRegistryArtifact.abi,
      WyvernProxyRegistryArtifact.bytecode
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
    seaport = await Seaport.deploy(conduitController.address);

    wyvernProxyRegistry = await WyvernProxyRegistry.deploy();
    await wyvernProxyRegistry.connect(wallet1).registerProxy({from: wallet1.address});
    await wyvernProxyRegistry.connect(wallet3).registerProxy({from: wallet3.address});
    await wyvernProxyRegistry.connect(wallet4).registerProxy({from: wallet4.address});
    wyvernTokenTransferProxy = await WyvernTokenTransferProxy.deploy(wyvernProxyRegistry.address);
    wyvernExchangeWithBulkCancellations = await WyvernExchangeWithBulkCancellations.deploy(
      wyvernProxyRegistry.address,
      wyvernTokenTransferProxy.address,
      ZERO,
      wyvernProtocolFeeAddress.address
    );
    await wyvernProxyRegistry.endGrantAuthentication(wyvernExchangeWithBulkCancellations.address);
    merkleValidator = await MerkleValidator.deploy();

    await transferProxy.addOperator(exchangeV2Proxy.address);
    await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    await transferProxy.addOperator(rarible.address);
    await erc20TransferProxy.addOperator(rarible.address);

    testHelper = await TestHelper.deploy();
    wrapperHelper = await WrapperHelper.deploy();

    erc721 = await TestERC721.deploy();
    erc1155 = await TestERC1155.deploy();

    bulkExchange = <ExchangeWrapper>(
      await upgrades.deployProxy(
        BulkExchange,
        [
          exchangeV2Proxy.address,
          rarible.address,
          wyvernExchangeWithBulkCancellations.address,
          seaport.address,
          ZERO,
          ZERO,
          ZERO,
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
      const tradeData1 = PurchaseData(0, '100', await encodeFees(0, 1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

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
  });

  describe('GhostMarket orders', () => {
    it('Test singlePurchase ExchangeV2 - V2 order', async () => {
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
      const tradeData1 = PurchaseData(0, '100', await encodeFees(0, 1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase ExchangeV2 - V3 order', async () => {
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
      const tradeData1 = PurchaseData(0, '100', await encodeFees(0, 1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V3 721 1 order 1 commission:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test bulkPurchase ExchangeV2 (num orders = 3, type = V2/V1) orders are ready, ERC1155<->ETH', async () => {
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
      const tradeData1 = PurchaseData(0, '60', await encodeFees(1500), dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

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
      const tradeData2 = PurchaseData(0, '80', await encodeFees(1500), dataForExchCall2); //0 is Exch orders, 100 is amount + 0 protocolFee

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
      const tradeData3 = PurchaseData(0, '100', await encodeFees(1500), dataForExchCall3); //0 is Exch orders, 100 is amount + 0 protocolFee

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
  });

  describe('Rarible orders', () => {
    it('Test singlePurchase Rarible - V2 order', async () => {
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
      const tradeData1 = PurchaseData(1, '100', await encodeFees(0, 1500), dataForExchCall1); //1 is Rarible orders, 100 is amount + 0 protocolFee

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V2 721 1 order 1:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test singlePurchase Rarible - V3 order', async () => {
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
      const tradeData1 = PurchaseData(1, '100', await encodeFees(0, 1500), dataForExchCall1); //1 is Rarible orders, 100 is amount + 0 protocolFee

      const tx = await bulkExchange
        .connect(buyer)
        .singlePurchase(tradeData1, ZERO, feeRecipienterUP.address, {from: buyer.address, value: 400, gasPrice: 0});
      const receipt = await tx.wait();
      // console.log('V3 721 1 order 1 commission:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller1.address)).to.equal(0);
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    });

    it('Test bulkPurchase Rarible (num orders = 3, type = V2/V1) orders are ready, ERC1155<->ETH', async () => {
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
      const tradeData1 = PurchaseData(1, '60', await encodeFees(1500), dataForExchCall1); //1 is Rarible orders, 100 is amount + 0 protocolFee

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
      const tradeData2 = PurchaseData(1, '80', await encodeFees(1500), dataForExchCall2); //1 is Rarible orders, 100 is amount + 0 protocolFee

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
      const tradeData3 = PurchaseData(1, '100', await encodeFees(1500), dataForExchCall3); //1 is Rarible orders, 100 is amount + 0 protocolFee

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
  });

  describe('Wyvern orders', () => {
    //"Test singlePurchase Wyvern (num orders = 3), ERC1155<->ETH",
    //"Test bulkPurchase Wyvern (num orders = 3) orders are ready, ERC1155<->ETH"
    //"Test bulkPurchase Wyvern and Rarible mixed (num orders = 3) orders are ready, ERC1155<->ETH"
    it('Test singlePurchase Wyvern, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const feeRecipienter = wallet5;
      const feeMethodsSidesKindsHowToCallsMask = [1, 0, 0, 1, 1, 1, 0, 1];

      const erc721TokenIdLocal = 5;
      await erc721.mint(seller1.address, erc721TokenIdLocal);
      await erc721.connect(seller1).setApprovalForAll(await wyvernProxyRegistry.proxies(seller1.address), true, {from: seller1.address});

      const erc721TokenIdLocal2 = 6;
      await erc721.mint(seller2.address, erc721TokenIdLocal2);
      await erc721.connect(seller2).setApprovalForAll(await wyvernProxyRegistry.proxies(seller2.address), true, {from: seller2.address});

      //for first order
      const matchData = (await getOpenSeaMatchDataMerkleValidator(
        wyvernExchangeWithBulkCancellations.address,
        bulkExchange.address,
        buyer.address,
        seller1.address,
        merkleValidator.address,
        feeRecipienter.address,
        100,
        erc721TokenIdLocal,
        erc721.address,
        ZERO,
        feeMethodsSidesKindsHowToCallsMask
      ))
      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      const dataForWyvernCall1 = await wrapperHelper.getDataWyvernAtomicMatchWithError(buySellOrders1);
      const tradeData1 = PurchaseData(2, '100', '0', dataForWyvernCall1); //2 is Wyvern orders, 100 is amount

      //for second order
      const matchData2 = (await getOpenSeaMatchDataMerkleValidator(
        wyvernExchangeWithBulkCancellations.address,
        bulkExchange.address,
        buyer.address,
        seller2.address,
        merkleValidator.address,
        feeRecipienter.address,
        100,
        erc721TokenIdLocal2,
        erc721.address,
        ZERO,
        feeMethodsSidesKindsHowToCallsMask
      ))
		  const buySellOrders2 = OpenSeaOrdersInput(...matchData2);
      const dataForWyvernCall2 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders2);
      const tradeData2 = PurchaseData(2, '100', await encodeFees(1500), dataForWyvernCall2); //2 is Wyvern orders, 100 is amount

      await verifyBalanceChange(buyer.address, 115, async () =>
      	verifyBalanceChange(seller2.address, -90, async () =>
      		verifyBalanceChange(feeRecipienter.address, -10, () =>
      		  verifyBalanceChange(feeRecipienterUP.address, -15, () =>
      		    bulkExchange.connect(buyer).singlePurchase(tradeData2, feeRecipienterUP.address, ZERO, { from: buyer.address, value: 400, gasPrice: 0 })
      		  )
      		)
      	)
      );
      //exception if wrong method
      await expect(
        bulkExchange.connect(buyer).singlePurchase(tradeData1, ZERO, ZERO, { from: buyer.address, value: 400, gasPrice: 0 })
      ).to.be.revertedWith('Purchase WyvernExchange failed')
      expect(await erc721.balanceOf(buyer.address)).to.equal(1);
    })
    
    it('Test bulkPurchase Wyvern (num orders = 3), 1 UpFee recipient, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;
      const feeRecipienter = wallet5;
      const feeMethodsSidesKindsHowToCallsMask = [1, 0, 0, 1, 1, 1, 0, 1];

      const erc721TokenIdLocal = 5;
      await erc721.mint(seller1.address, erc721TokenIdLocal);
      await erc721
        .connect(seller1)
        .setApprovalForAll(await wyvernProxyRegistry.proxies(seller1.address), true, {from: seller1.address});

      const erc721TokenIdLocal2 = 6;
      await erc721.mint(seller2.address, erc721TokenIdLocal2);
      await erc721
        .connect(seller2)
        .setApprovalForAll(await wyvernProxyRegistry.proxies(seller2.address), true, {from: seller2.address});

      const erc721TokenIdLocal3 = 7;
      await erc721.mint(seller3.address, erc721TokenIdLocal3);
      await erc721
        .connect(seller3)
        .setApprovalForAll(await wyvernProxyRegistry.proxies(seller3.address), true, {from: seller3.address});

      const matchData = await getOpenSeaMatchDataMerkleValidator(
        wyvernExchangeWithBulkCancellations.address,
        bulkExchange.address,
        buyer.address,
        seller1.address,
        merkleValidator.address,
        feeRecipienter.address,
        100,
        erc721TokenIdLocal,
        erc721.address,
        ZERO,
        feeMethodsSidesKindsHowToCallsMask
      );

      const buySellOrders1 = OpenSeaOrdersInput(...matchData);
      const dataForWyvernCall1 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders1);
      const tradeData1 = PurchaseData(2, '100', await encodeFees(1000, 500), dataForWyvernCall1); //2 is Wyvern orders, 100 is amount

      const matchData2 = await getOpenSeaMatchDataMerkleValidator(
        wyvernExchangeWithBulkCancellations.address,
        bulkExchange.address,
        buyer.address,
        seller2.address,
        merkleValidator.address,
        feeRecipienter.address,
        100,
        erc721TokenIdLocal2,
        erc721.address,
        ZERO,
        feeMethodsSidesKindsHowToCallsMask
      );
      const buySellOrders2 = OpenSeaOrdersInput(...matchData2);
      const dataForWyvernCall2 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders2);
      const tradeData2 = PurchaseData(2, '100', await encodeFees(1000, 500), dataForWyvernCall2); //2 is Wyvern orders, 100 is amount

      const matchData3 = await getOpenSeaMatchDataMerkleValidator(
        wyvernExchangeWithBulkCancellations.address,
        bulkExchange.address,
        buyer.address,
        seller3.address,
        merkleValidator.address,
        feeRecipienter.address,
        100,
        erc721TokenIdLocal3,
        erc721.address,
        ZERO,
        feeMethodsSidesKindsHowToCallsMask
      );
      const buySellOrders3 = OpenSeaOrdersInput(...matchData3);
      const dataForWyvernCall3 = await wrapperHelper.getDataWyvernAtomicMatch(buySellOrders3); //2 is Wyvern orders, 100 is amount
      const tradeData3 = PurchaseData(2, '100', '0', dataForWyvernCall3);

      const feeRecipientSecond = wallet8;

      await verifyBalanceChange(buyer.address, 330, async () =>
        verifyBalanceChange(seller1.address, -90, async () =>
          verifyBalanceChange(seller2.address, -90, async () =>
            verifyBalanceChange(seller3.address, -90, async () =>
              verifyBalanceChange(feeRecipienter.address, -30, () =>
                verifyBalanceChange(feeRecipienterUP.address, -20, () =>
                  verifyBalanceChange(feeRecipientSecond.address, -10, () =>
                    bulkExchange
                      .connect(buyer)
                      .bulkPurchase(
                        [tradeData1, tradeData2, tradeData3],
                        feeRecipienterUP.address,
                        feeRecipientSecond.address,
                        false,
                        {from: buyer.address, value: 400, gasPrice: 0}
                      )
                  )
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(buyer.address)).to.equal(3);
    });
  });

  describe('Seaport orders', () => {
    it('Test singlePurchase Seaport - fulfillAdvancedOrder through data selector, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;
      await erc721.mint(seller.address, tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport.address, true, {from: seller.address});
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
        identifierOrCriteria: '0x3039',
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
      const tradeDataSeaPort = PurchaseData(3, '100', '0', dataForSeaportWithSelector); //3 is Seaport orders, 100 is amount

      const tx = await bulkExchange
        .connect(buyerLocal1)
        .singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: buyerLocal1.address, value: 100});
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller.address)).to.equal(0);
      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(1);
    });

    it('Test singlePurchase Seaport - fulfillAvailableAdvancedOrders through data selector, ERC721<->ETH', async () => {
      const seller = wallet1;
      const buyerLocal1 = wallet2;
      const zoneAddr = wallet2;
      await erc721.mint(seller.address, tokenId)
      await erc721.connect(seller).setApprovalForAll(seaport.address, true, {from: seller.address})

      const considerationItemLeft = {
        itemType: 0,
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: seller.address
      }

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: '0x3039',
        startAmount: 1,
        endAmount: 1
      }

      const OrderParametersLeft = {
        offerer: seller.address,// 0x00
        zone: zoneAddr.address, // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey : '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1 // 0x140
        // offer.length // 0x160
      }

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c'
      }

      const _advancedOrders = [_advancedOrder];
      const _criteriaResolvers: any = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = buyerLocal1.address;
      const _maximumFulfilled = 1;

      const offerFulfillments = [
        [ { orderIndex: 0, itemIndex: 0 } ]
      ]

      const considerationFulfillments = [
        [ { orderIndex: 0, itemIndex: 0 } ]
      ]

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAvailableAdvancedOrders(
        _advancedOrders,
        _criteriaResolvers,
        offerFulfillments,
        considerationFulfillments,
        _fulfillerConduitKey,
        _recipient,
        _maximumFulfilled);

      const tradeDataSeaPort = PurchaseData(3, '100', '0', dataForSeaportWithSelector); //3 is Seaport orders, 100 is amount

      const tx = await bulkExchange.connect(buyerLocal1).singlePurchase(tradeDataSeaPort, ZERO, ZERO, {from: buyerLocal1.address, value: 100})
      const receipt = await tx.wait();
      // console.log('wrapper seaport (fulfillAvailableAdvancedOrder() by call : ETH <=> ERC721:', receipt.gasUsed.toString());
      expect(await erc721.balanceOf(seller.address)).to.equal(0);
      expect(await erc721.balanceOf(buyerLocal1.address)).to.equal(1);
    })
  });

  describe('Combined orders', () => {
    it('Test bulkPurchase GhostMarket & Rarible (num orders = 2, type = V2/V1) orders are ready, ERC721<->ETH', async () => {
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
      const tradeData1 = PurchaseData(0, '60', await encodeFees(1500), dataForExchCall1); //0 is GhostMarket orders, 100 is amount + 0 protocolFee

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
      const tradeData2 = PurchaseData(1, '80', await encodeFees(1500), dataForExchCall2); //1 is Rarible orders, 100 is amount + 0 protocolFee

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

  function PurchaseData(marketId: number, amount: string, fees: string, data: any) {
    return {marketId, amount, fees, data};
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

  async function getOpenSeaMatchDataMerkleValidator(
    exchange: any,
    bulk: any,
    buyer: any,
    seller: any,
    merkleValidatorAddr: any,
    protocol: any,
    basePrice: any,
    tokenId: any,
    token: any,
    paymentToken: any,
    maskHowToCall: any
  ) {
    const addrs = [
      exchange, // exchange buy
      bulk, // maker buy, contract bulk
      seller, // taker buy
      '0x0000000000000000000000000000000000000000', // feeRecipient buy
      merkleValidatorAddr, // target buy (MerkleValidator)
      '0x0000000000000000000000000000000000000000', // staticTarget buy
      paymentToken, // paymentToken buy (ETH)

      exchange, // exchange sell
      seller, // maker sell
      '0x0000000000000000000000000000000000000000', // taker sell
      protocol, // feeRecipient sell (originFee )
      merkleValidatorAddr, // target sell (MerkleValidator)
      '0x0000000000000000000000000000000000000000', // staticTarget sell
      paymentToken, // paymentToken sell (ETH)
    ];

    const now = Math.floor(Date.now() / 1000);
    const listingTime = now - 60 * 60;
    const expirationTime = now + 60 * 60;

    const uints = [
      '1000', //makerRelayerFee buy (originFee)
      '0', // takerRelayerFee buy
      '0', // makerProtocolFee buy
      '0', // takerProtocolFee buy
      basePrice, // basePrice buy
      '0', // extra buy
      listingTime, // listingTime buy
      expirationTime, // expirationTime buy
      '0', // salt buy

      '1000', //makerRelayerFee sell (originFee)
      '0', // takerRelayerFee sell
      '0', // makerProtocolFee sell
      '0', // takerProtocolFee sell
      basePrice, // basePrice sell
      '0', // extra sell
      listingTime, // listingTime sell
      expirationTime, // expirationTime sell
      '0', // salt sell
    ];

    const feeMethodsSidesKindsHowToCalls = maskHowToCall;

    const zeroWord = '0000000000000000000000000000000000000000000000000000000000000000';

    const merklePart =
      '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000';
    let calldataBuy = await wrapperHelper.getDataERC721UsingCriteria(ZERO, buyer, token, tokenId);
    calldataBuy += merklePart;

    let calldataSell = await wrapperHelper.getDataERC721UsingCriteria(seller, ZERO, token, tokenId);
    calldataSell += merklePart;

    const replacementPatternBuy =
      '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const replacementPatternSell =
      '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    const staticExtradataBuy = '0x';
    const staticExtradataSell = '0x';

    const vs = [
      27, // sig v buy
      27, // sig v sell
    ];
    const rssMetadata = [
      '0x' + zeroWord, // sig r buy
      '0x' + zeroWord, // sig s buy
      '0x' + zeroWord, // sig r sell
      '0x' + zeroWord, // sig s sell
      '0x' + zeroWord, // metadata
    ];

    return [
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
    ] as const;
  }

  async function getOpenSeaMatchDataMerkleValidator1155(
    exchange: any,
    bulk: any,
    buyer: any,
    seller: any,
    merkleValidatorAddr: any,
    protocol: any,
    basePrice: any,
    tokenId: any,
    token: any,
    paymentToken: any,
    amount: any,
    maskHowToCall: any
  ) {
    const addrs = [
      exchange, // exchange buy
      bulk, // maker buy, contract bulk
      seller, // taker buy
      '0x0000000000000000000000000000000000000000', // feeRecipient buy
      merkleValidatorAddr, // target buy (MerkleValidator)
      '0x0000000000000000000000000000000000000000', // staticTarget buy
      paymentToken, // paymentToken buy (ETH)

      exchange, // exchange sell
      seller, // maker sell
      '0x0000000000000000000000000000000000000000', // taker sell
      protocol, // feeRecipient sell (originFee )
      merkleValidatorAddr, // target sell (MerkleValidator)
      '0x0000000000000000000000000000000000000000', // staticTarget sell
      paymentToken, // paymentToken sell (ETH)
    ];

    const now = Math.floor(Date.now() / 1000);
    const listingTime = now - 60 * 60;
    const expirationTime = now + 60 * 60;

    const uints = [
      '1000', //makerRelayerFee buy (originFee)
      '0', // takerRelayerFee buy
      '0', // makerProtocolFee buy
      '0', // takerProtocolFee buy
      basePrice, // basePrice buy
      '0', // extra buy
      listingTime, // listingTime buy
      expirationTime, // expirationTime buy
      '0', // salt buy

      '1000', //makerRelayerFee sell (originFee)
      '0', // takerRelayerFee sell
      '0', // makerProtocolFee sell
      '0', // takerProtocolFee sell
      basePrice, // basePrice sell
      '0', // extra sell
      listingTime, // listingTime sell
      expirationTime, // expirationTime sell
      '0', // salt sell
    ];

    const zeroWord = '0000000000000000000000000000000000000000000000000000000000000000';
    const merklePart =
      '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000';

    let calldataBuy = await wrapperHelper.getDataERC1155UsingCriteria(ZERO, buyer, token, tokenId, amount);
    calldataBuy += merklePart;
    let calldataSell = await wrapperHelper.getDataERC1155UsingCriteria(seller, ZERO, token, tokenId, amount);
    calldataSell += merklePart;
    const replacementPatternBuy =
      '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const replacementPatternSell =
      '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    const staticExtradataBuy = '0x';
    const staticExtradataSell = '0x';
    const feeMethodsSidesKindsHowToCalls = maskHowToCall;
    const vs = [
      27, // sig v buy
      27, // sig v sell
    ];
    const rssMetadata = [
      '0x' + zeroWord, // sig r buy
      '0x' + zeroWord, // sig s buy
      '0x' + zeroWord, // sig r sell
      '0x' + zeroWord, // sig s sell
      '0x' + zeroWord, // metadata
    ];

    return [
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
    ];
  }
});
