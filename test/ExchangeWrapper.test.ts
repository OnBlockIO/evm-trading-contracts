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
  let makerLeft: SignerWithAddress;
  let makerRight: SignerWithAddress;
  const MARKET_MARKER_SELL = '0x67686f73746d61726b65745f76335f73656c6c00000000000000000000000000'; // ghostmarket_v3_sell
  const MARKET_MARKER_BUY = '0x67686f73746d61726b65745f76335f6275790000000000000000000000000000'; // ghostmarket_v3_buy
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
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const ExchangeV2Test = await ethers.getContractFactory('ExchangeV2');
    const BulkExchange = await ethers.getContractFactory('ExchangeWrapper');
    const TestERC721 = await ethers.getContractFactory('TestDummyERC721');
    const TestERC1155 = await ethers.getContractFactory('TestDummyERC1155');
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    const TestHelper = await ethers.getContractFactory('TestHelper');
    const WrapperHelper = await ethers.getContractFactory('WrapperHelper');

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

    await transferProxy.addOperator(exchangeV2Proxy.address);
    await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    await transferProxy.addOperator(rarible.address);
    await erc20TransferProxy.addOperator(rarible.address);

    testHelper = await TestHelper.deploy();
    wrapperHelper = await WrapperHelper.deploy();

    erc721 = await TestERC721.deploy();
    erc1155 = await TestERC1155.deploy();

    bulkExchange = await BulkExchange.deploy();

    bulkExchange = <ExchangeWrapper>(
      await upgrades.deployProxy(
        BulkExchange,
        [exchangeV2Proxy.address, rarible.address, ZERO, ZERO, ZERO, ZERO, ZERO],
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

  /* describe('Combined orders', () => {
    it('Test bulkPurchase GhostMarket & Rarible (num orders = 2, type = V2/V1) orders are ready, ERC721<->ETH', async () => {
      const buyer = wallet2;
      const seller1 = wallet1;
      const seller2 = wallet3;
      const seller3 = wallet4;

      await erc721.mint(seller1.address, erc721TokenId1);
      await erc721.connect(seller1).setApprovalForAll(transferProxy.address, true, {from: seller1.address});
      await erc721.mint(seller2.address, erc721TokenId2);
      await erc721.connect(seller2).setApprovalForAll(transferProxy.address, true, {from: seller2.address});

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

      const signatureLeft1 = await getSignature(left1, seller1.address, exchangeV2Proxy.address);
      const signatureLeft2 = await getSignature(left2, seller2.address, rarible.address);
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
      const tradeData1 = PurchaseData(0, '60', '0', dataForExchCall1); //0 is Exch orders, 100 is amount + 0 protocolFee

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
      const tradeData2 = PurchaseData(1, '80', await encodeFees(1500), dataForExchCall2); //0 is Exch orders, 1 is Rarible orders, 100 is amount + 0 protocolFee

      await verifyBalanceChange(buyer.address, 276, async () =>
        verifyBalanceChange(seller1.address, -60, async () =>
          verifyBalanceChange(seller2.address, -80, async () =>
            verifyBalanceChange(seller3.address, -100, async () =>
              verifyBalanceChange(feeRecipienterUP.address, -36, () =>
                bulkExchange
                  .connect(buyer)
                  .bulkPurchase([tradeData1], feeRecipienterUP.address, ZERO, false, {
                    from: buyer.address,
                    value: 400,
                    gasPrice: 0,
                  })
              )
            )
          )
        )
      );
      expect(await erc721.ownerOf(erc1155TokenId1)).to.equal(seller1.address);
      expect(await erc721.ownerOf(erc1155TokenId2)).to.equal(seller2.address);
      expect(await erc721.ownerOf(erc1155TokenId3)).to.equal(seller3.address);
      expect(await erc721.ownerOf(erc1155TokenId1)).to.equal(wallet2.address);
    });
  }); */

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
});
