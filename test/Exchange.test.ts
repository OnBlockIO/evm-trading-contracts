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

  describe('basic', () => {
    it('transfer ownership of contract', async function () {
      await exchangeV2Proxy.transferOwnership(wallet1.address);
      expect(await exchangeV2Proxy.owner()).to.equal(wallet1.address);
    });

    it('upgrade from new contract to another new one', async function () {
      const ExchangeV2_ContractFactory = await ethers.getContractFactory('ExchangeV2');
      const ExchangeV10_ContractFactory = await ethers.getContractFactory('ExchangeV10');

      const exchangeV2Core = await upgrades.deployProxy(
        ExchangeV2_ContractFactory,
        [wallet0.address, wallet0.address, 0, wallet0.address, wallet0.address],
        {initializer: '__ExchangeV2_init', unsafeAllowCustomTypes: true}
      );

      //upgrade
      const exchangeV2CoreV2 = await upgrades.upgradeProxy(exchangeV2Core.address, ExchangeV10_ContractFactory);

      //test new function
      expect(await exchangeV2CoreV2.getSomething()).to.equal(10);
    });

    it('only allow owner to change transfer proxy', async () => {
      const t1AsSigner = exchangeV2Proxy.connect(wallet1);
      const t2AsSigner = exchangeV2Proxy.connect(wallet2);
      await expect(
        t1AsSigner.setTransferProxy('0x00112233', wallet2.address, {from: wallet1.address})
      ).to.be.revertedWith('Ownable: caller is not the owner');
      t2AsSigner.setTransferProxy('0x00112233', wallet2.address, {from: wallet0.address});
    });

    it.skip('cancel ERC20 order', async () => {
      const {left, right} = await prepare2Orders();
      const exchangeV2AsSigner = exchangeV2Proxy.connect(wallet2);

      const tx = exchangeV2AsSigner.cancel(left, {from: wallet2.address});

      await expect(tx).to.be.revertedWith('not a maker');

      const exchangeV2AsSigner2 = exchangeV2Proxy.connect(wallet1);
      await exchangeV2AsSigner2.cancel(left, {from: wallet1.address});

      const tx2 = exchangeV2Proxy.matchOrders(
        left,
        await EIP712.sign(left, wallet1.address, exchangeV2Proxy.address),
        right,
        await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address)
      );
      await expect(tx2).to.be.revertedWith('panic code 0x11');
    });

    it('fail for order with salt 0 cancel', async () => {
      const {left} = await prepare2Orders();
      left.salt = '0';

      const exchangeV2AsSigner = exchangeV2Proxy.connect(wallet1);

      const tx = exchangeV2AsSigner.cancel(left, {from: wallet1.address});

      await expect(tx).to.be.revertedWith("0 salt can't be used");
    });

    it('cancel ERC1155 order', async () => {
      const {left, right} = await prepare_ERC_1155V1_Orders(5);
      const exchangeV2AsSigner = exchangeV2Proxy.connect(wallet1);

      const tx = exchangeV2AsSigner.cancel(left, {from: wallet1.address});

      await expect(tx).to.be.revertedWith('not a maker');

      const exchangeV2AsSigner2 = exchangeV2Proxy.connect(wallet2);
      await exchangeV2AsSigner2.cancel(left, {from: wallet2.address});

      const tx2 = exchangeV2AsSigner2.matchOrders(
        left,
        await EIP712.sign(left, wallet1.address, exchangeV2Proxy.address),
        right,
        await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address),
        {from: wallet2.address, value: 300}
      );
      await expect(tx2).to.be.revertedWith('order signature verification error');
    });

    it('bulk cancel ERC20 orders', async () => {
      const orderArray = await prepareMultiple2Orders(3);

      const leftOrderArray: any[] = [];
      orderArray.forEach((ordersLR) => {
        leftOrderArray.push(ordersLR[0]);
      });
      const exchangeV2AsSigner2 = exchangeV2Proxy.connect(wallet1);
      await exchangeV2AsSigner2.bulkCancelOrders(leftOrderArray, {from: wallet1.address});
    });

    it('fail not allowing to fill more than 100% of the order', async () => {
      const {left, right} = await prepare2Orders();
      right.makeAsset.value = '100';
      right.takeAsset.value = '50';
      right.salt = '0';

      const t2AsSigner = t2.connect(wallet2);
      await t2AsSigner.approve(erc20TransferProxy.address, 10000000, {from: wallet2.address});

      const signature = await EIP712.sign(left, wallet1.address, exchangeV2Proxy.address);

      const exchangeV2AsSigner = exchangeV2Proxy.connect(wallet2);
      await exchangeV2AsSigner.matchOrders(left, signature, right, '0x', {from: wallet2.address});
      await exchangeV2AsSigner.matchOrders(left, signature, right, '0x', {from: wallet2.address});

      const tx = exchangeV2AsSigner.matchOrders(left, signature, right, '0x', {from: wallet2.address});
      await expect(tx).to.be.revertedWith('nothing to fill');

      expect((await t1.balanceOf(wallet1.address)).toString()).to.equal('0');
      expect((await t1.balanceOf(wallet2.address)).toString()).to.equal('100');
      expect((await t2.balanceOf(wallet1.address)).toString()).to.equal('200');
      expect((await t2.balanceOf(wallet2.address)).toString()).to.equal('0');
    });

    it('fail if taker is not correct', async () => {
      const {left, right} = await prepare2Orders();
      left.taker = wallet3.address;

      const leftSig = await EIP712.sign(left, wallet1.address, exchangeV2Proxy.address);
      const rightSig = await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address);

      await expect(exchangeV2Proxy.matchOrders(left, leftSig, right, rightSig)).to.be.revertedWith(
        'leftOrder.taker verification failed'
      );
      await expect(exchangeV2Proxy.matchOrders(right, rightSig, left, leftSig)).to.be.revertedWith(
        'rightOrder.taker verification failed'
      );
    });

    it('fail if one of the signatures is incorrect', async () => {
      const {left, right} = await prepare2Orders();

      await expect(
        exchangeV2Proxy.matchOrders(
          left,
          await EIP712.sign(left, wallet2.address, exchangeV2Proxy.address),
          right,
          await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address)
        )
      ).to.be.revertedWith('order signature verification error');

      await expect(
        exchangeV2Proxy.matchOrders(
          right,
          await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address),
          left,
          await EIP712.sign(left, wallet2.address, exchangeV2Proxy.address)
        )
      ).to.be.revertedWith('order signature verification error');
    });

    it('fail if order dates are wrong', async () => {
      const block = await ethers.provider.getBlock('latest');
      const now = block.timestamp;

      const {left, right} = await prepare2Orders();
      left.start = now + 1000;

      await expect(
        exchangeV2Proxy.matchOrders(
          left,
          await EIP712.sign(right, wallet1.address, exchangeV2Proxy.address),
          right,
          await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address)
        )
      ).to.be.revertedWith('Order start validation failed');
    });

    it('fail if assets do not match', async () => {
      const {left, right} = await prepare2Orders();
      left.takeAsset.assetType.data = enc(wallet1.address);

      const leftSig = await EIP712.sign(left, wallet1.address, exchangeV2Proxy.address);
      const rightSig = await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address);

      await expect(exchangeV2Proxy.matchOrders(left, leftSig, right, rightSig)).to.be.revertedWith(
        `assets don't match`
      );
    });
  });

  describe('direct purchase / accept bid', () => {
    it('direct purchase ERC721<->ETH, not same origin, not same royalties V3', async () => {
      const _priceSell = '100';
      const _pricePurchase = '100';
      const salt = '1';
      const nftAmount = '1';
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);
      const _nftPurchaseAssetData = '0x';
      const left = Order(
        makerLeft.address,
        Asset(ERC721, _nftSellAssetData, nftAmount),
        ZERO,
        Asset(ETH, _nftPurchaseAssetData, _priceSell),
        salt,
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft.address,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: ZERO,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight,
      };

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.directPurchase(directPurchaseParams, {from: makerRight.address, value: 200});
      const receipt = await tx.wait();
      // console.log('direct purchase ERC721<->ETH, not same origin, not same royalties V3:', receipt.gasUsed.toString());
    });

    it('direct purchase ERC721<->ETH, not same origin, not same royalties V3', async () => {
      const _priceSell = '100';
      const _pricePurchase = '100';
      const salt = '1';
      const nftAmount = '1';
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[wallet7.address, 100]]); //with royalties
      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount),
        ZERO,
        Asset(ETH, '0x', _priceSell),
        salt,
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft.address,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: ZERO,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight,
      };

      expect(await erc721.balanceOf(makerLeft.address)).to.equal(1);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(0);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 100, async () =>
        verifyBalanceChange(makerLeft.address, -93, async () =>
          verifyBalanceChange(protocol.address, 0, () =>
            verifyBalanceChange(wallet6.address, -3, () =>
              //OriginLeft
              verifyBalanceChange(wallet5.address, -3, () =>
                //OriginRight
                verifyBalanceChange(wallet7.address, -1, () =>
                  //royalties
                  asSigner.directPurchase(directPurchaseParams, {
                    from: makerRight.address,
                    value: 200,
                    gasPrice: 0,
                  })
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('direct purchase ERC721<->ERC20, not same origin, not same royalties V3', async () => {
      const _priceSell = '100';
      const _pricePurchase = '100';
      const salt = '1';
      const nftAmount = '1';
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[wallet7.address, 100]]); //with royalties
      const erc20 = await prepareERC20(makerRight, '1000');

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);
      const _nftPurchaseAssetData = enc(erc20.address);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, _nftSellAssetData, nftAmount),
        ZERO,
        Asset(ERC20, _nftPurchaseAssetData, _priceSell),
        salt,
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft.address,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: erc20.address,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight,
      };

      expect(await erc721.balanceOf(makerLeft.address)).to.equal(1);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(0);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.directPurchase(directPurchaseParams, {from: makerRight.address});
      expect(await erc20.balanceOf(makerRight.address)).to.equal(900);
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(93);
      expect(await erc20.balanceOf(wallet6.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet5.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet7.address)).to.equal(1);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('direct purchase ERC1155(all)<->ETH, not same origin, not same royalties V3', async () => {
      const _priceSell = '100';
      const _pricePurchase = '100';
      const salt = '1';
      const nftAmount = '7';
      const nftPurchaseAmount = '7';
      const erc1155 = await prepareERC1155(makerLeft, '10', erc1155TokenId1, [[wallet7.address, 100]]);

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc1155.address, erc1155TokenId1);
      const _nftPurchaseAssetData = '0x';

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, _nftSellAssetData, nftAmount),
        ZERO,
        Asset(ETH, _nftPurchaseAssetData, _priceSell),
        salt,
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft.address,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC1155,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: ZERO,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftPurchaseAmount,
        buyOrderData: encDataRight,
      };

      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1), '10');
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1), '0');
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 100, async () =>
        verifyBalanceChange(makerLeft.address, -93, async () =>
          verifyBalanceChange(protocol.address, 0, () =>
            verifyBalanceChange(wallet6.address, -3, () =>
              //OriginLeft
              verifyBalanceChange(wallet5.address, -3, () =>
                //OriginRight
                verifyBalanceChange(wallet7.address, -1, () =>
                  //royalties
                  asSigner.directPurchase(directPurchaseParams, {
                    from: makerRight.address,
                    value: 200,
                    gasPrice: 0,
                  })
                )
              )
            )
          )
        )
      );
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(3);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(7);
    });

    it('direct purchase ERC1155(partially)<->ERC20, not same origin, not same royalties V3', async () => {
      const _priceSell = '100';
      const _pricePurchase = '50';
      const salt = '1';
      const nftAmount = '4';
      const nftPurchaseAmount = '2';
      const erc1155 = await prepareERC1155(makerLeft, '10', erc1155TokenId1, [[wallet7.address, 100]]);
      const erc20 = await prepareERC20(makerRight, '1000');

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const _nftSellAssetData = enc(erc1155.address, erc1155TokenId1);
      const _nftPurchaseAssetData = enc(erc20.address);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, _nftSellAssetData, nftAmount),
        ZERO,
        Asset(ERC20, _nftPurchaseAssetData, _priceSell),
        salt,
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft.address,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC1155,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: erc20.address,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,

        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftPurchaseAmount,
        buyOrderData: encDataRight,
      };

      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(10);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(0);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.directPurchase(directPurchaseParams, {from: makerRight.address});
      expect(await erc20.balanceOf(makerRight.address)).to.equal(950);
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(48);
      expect(await erc20.balanceOf(wallet6.address)).to.equal(1);
      expect(await erc20.balanceOf(wallet5.address)).to.equal(1);
      expect(await erc20.balanceOf(wallet7.address)).to.equal(0);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(8);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(2);
    });

    it('direct purchase ERC721<->ETH, not same origin, not same royalties V2', async () => {
      const _priceSell = '100';
      const _pricePurchase = '100';
      const salt = '1';
      const nftAmount = '1';
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [[wallet7.address, 100]]); //with royalties

      const encDataLeft = await encDataV2([[], [[wallet6.address, 300]], true]);
      const encDataRight = await encDataV2([[], [[wallet5.address, 300]], false]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount),
        ZERO,
        Asset(ETH, '0x', _priceSell),
        salt,
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const _nftSellAssetData = enc(erc721.address, erc721TokenId1);

      const directPurchaseParams = {
        sellOrderMaker: makerLeft.address,
        sellOrderNftAmount: nftAmount,
        nftAssetClass: ERC721,
        nftData: _nftSellAssetData,
        sellOrderPaymentAmount: _priceSell,
        paymentToken: ZERO,
        sellOrderSalt: salt,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V2,
        sellOrderData: encDataLeft,
        sellOrderSignature: signature,
        buyOrderPaymentAmount: _pricePurchase,
        buyOrderNftAmount: nftAmount,
        buyOrderData: encDataRight,
      };

      expect(await erc721.balanceOf(makerLeft.address)).to.equal(1);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(0);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 103, async () =>
        verifyBalanceChange(makerLeft.address, -96, async () =>
          verifyBalanceChange(protocol.address, 0, () =>
            verifyBalanceChange(wallet6.address, -3, () =>
              //OriginLeft
              verifyBalanceChange(wallet5.address, -3, () =>
                //OriginRight
                verifyBalanceChange(wallet7.address, -1, () =>
                  //royalties
                  asSigner.directPurchase(directPurchaseParams, {
                    from: makerRight.address,
                    value: 200,
                    gasPrice: 0,
                  })
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('direct accept bid ERC20<->ERC721, not same origin, not same royalties V3', async () => {
      const _priceBid = '100';
      const _priceAccept = '100';
      const salt = '1';
      const _nftBidAmount = '1';
      const _nftAcceptAmount = '1';
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc721 = await prepareERC721(makerRight);

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      const encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const bidOrder = Order(
        makerLeft.address,
        Asset(ERC20, _paymentAssetData, _priceBid),
        ZERO,
        Asset(ERC721, _nftAssetData, _nftBidAmount),
        salt,
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );
      const signature = await EIP712.sign(bidOrder, makerLeft.address, exchangeV2Proxy.address);

      const directAcceptParams = {
        bidMaker: makerLeft.address,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC721,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V3_BUY,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight,
      };

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.directAcceptBid(directAcceptParams, {from: makerRight.address});
      const receipt = await tx.wait();
      /* console.log(
        'direct accept bid ERC20<->ERC721, not same origin, not same royalties V3:',
        receipt.gasUsed.toString()
      ); */
    });

    it('direct accept bid ERC721<->ERC20, not same origin, not same royalties V3', async () => {
      const _priceBid = '100';
      const _priceAccept = '100';
      const salt = '1';
      const _nftBidAmount = '1';
      const _nftAcceptAmount = '1';
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc721 = await prepareERC721(makerRight, erc721TokenId1, [[wallet7.address, 100]]); //with royalties

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      const encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, _paymentAssetData, _priceBid),
        ZERO,
        Asset(ERC721, _nftAssetData, _nftBidAmount),
        salt,
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directAcceptParams = {
        bidMaker: makerLeft.address,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC721,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V3_BUY,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight,
      };

      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.directAcceptBid(directAcceptParams, {from: makerRight.address});
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(1);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(0);
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(900);
      expect(await erc20.balanceOf(makerRight.address)).to.equal(93);
      expect(await erc20.balanceOf(wallet6.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet5.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet7.address)).to.equal(1);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
    });

    it('direct accept bid ERC20<->ERC1155(all), not same origin, not same royalties V3', async () => {
      const _priceBid = '100';
      const _priceAccept = '100';
      const salt = '1';
      const _nftBidAmount = '7';
      const _nftAcceptAmount = '7';
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '10', erc1155TokenId1, [[wallet7.address, 100]]); //with royalties

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      const encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const _nftAssetData = enc(erc1155.address, erc1155TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, _paymentAssetData, '100'),
        ZERO,
        Asset(ERC1155, _nftAssetData, _nftBidAmount),
        salt,
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directAcceptParams = {
        bidMaker: makerLeft.address,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC1155,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V3_BUY,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight,
      };

      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(0);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(10);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.directAcceptBid(directAcceptParams, {from: makerRight.address});
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(7);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(3);
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(900);
      expect(await erc20.balanceOf(makerRight.address)).to.equal(93);
      expect(await erc20.balanceOf(wallet6.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet5.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet7.address)).to.equal(1);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
    });

    it('direct accept bid ERC20<->ERC1155(partially), not same origin, not same royalties V3', async () => {
      const _priceBid = '1000';
      const _priceAccept = '700';
      const salt = '1';
      const _nftBidAmount = '10';
      const _nftAcceptAmount = '7';
      const erc20 = await prepareERC20(makerLeft, '2000');
      const erc1155 = await prepareERC1155(makerRight, '10', erc1155TokenId1, [[wallet7.address, 100]]); //with royalties

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_BUY]);

      const _nftAssetData = enc(erc1155.address, erc1155TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, _paymentAssetData, _priceBid),
        ZERO,
        Asset(ERC1155, _nftAssetData, _nftBidAmount),
        salt,
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directAcceptParams = {
        bidMaker: makerLeft.address,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC1155,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V3_BUY,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight,
      };

      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(0);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(10);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.directAcceptBid(directAcceptParams, {from: makerRight.address});
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(7);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(3);
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(1300);
      expect(await erc20.balanceOf(makerRight.address)).to.equal(651);
      expect(await erc20.balanceOf(wallet6.address)).to.equal(21);
      expect(await erc20.balanceOf(wallet5.address)).to.equal(21);
      expect(await erc20.balanceOf(wallet7.address)).to.equal(7);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
    });

    it('direct accept bid ERC721<->ERC20, not same origin, not same royalties V2', async () => {
      const _priceBid = '100';
      const _priceAccept = '100';
      const salt = '1';
      const _nftBidAmount = '1';
      const _nftAcceptAmount = '1';
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc721 = await prepareERC721(makerRight, erc721TokenId1, [[wallet7.address, 100]]); //with royalties

      const encDataLeft = await encDataV2([[], [[wallet6.address, 300]], true]);
      const encDataRight = await encDataV2([[], [[wallet5.address, 300]], false]);

      const _nftAssetData = enc(erc721.address, erc721TokenId1);
      const _paymentAssetData = enc(erc20.address);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, _paymentAssetData, _priceBid),
        ZERO,
        Asset(ERC721, _nftAssetData, _nftBidAmount),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const directAcceptParams = {
        bidMaker: makerLeft.address,
        bidNftAmount: _nftBidAmount,
        nftAssetClass: ERC721,
        nftData: _nftAssetData,
        bidPaymentAmount: _priceBid,
        paymentToken: erc20.address,
        bidSalt: salt,
        bidStart: 0,
        bidEnd: 0,
        bidDataType: ORDER_DATA_V2,
        bidData: encDataLeft,
        bidSignature: signature,
        sellOrderPaymentAmount: _priceAccept,
        sellOrderNftAmount: _nftAcceptAmount,
        sellOrderData: encDataRight,
      };

      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.directAcceptBid(directAcceptParams, {from: makerRight.address});
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(1);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(0);
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(897);
      expect(await erc20.balanceOf(makerRight.address)).to.equal(96);
      expect(await erc20.balanceOf(wallet6.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet5.address)).to.equal(3);
      expect(await erc20.balanceOf(wallet7.address)).to.equal(1);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
    });
  });

  describe('gas estimation', () => {
    it('ERC20<->ETH two orders, logic: separate TM', async () => {
      const erc20 = await prepareERC20(makerRight, '1000');

      const left = Order(
        makerLeft.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const asSigner = exchangeV2Proxy.connect(makerLeft);
      const tx = await asSigner.matchOrders(
        left,
        '0x',
        right,
        await EIP712.sign(right, makerRight.address, exchangeV2Proxy.address),
        {
          from: makerLeft.address,
          value: 300,
        }
      );
      const receipt = await tx.wait();
      // console.log('ERC20<->ETH two orders, logic: separate TM gas:', receipt.gasUsed.toString());
    });

    it('ERC20<->ERC1155 not same origin, not same royalties V3', async () => {
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '1000', erc1155TokenId1, [[wallet7.address, 1000]]);

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);
      const encDataRight = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        '1',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {
          from: makerRight.address,
        }
      );
      const receipt = await tx.wait();
      // console.log('not same origin, not same royalties (no protocol Fee) V3:', receipt.gasUsed.toString());
    });

    it('ERC721<->ETH, not same origin, not same royalties V3', async () => {
      const price = '100';
      const salt = '1';
      const nftAmount = '1';
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = await LibPartToUint(wallet6.address, 300);
      const addrOriginRight = await LibPartToUint(wallet5.address, 300);

      const encDataLeft = await encDataV3_SELL([0, addrOriginRight, 0, 1000, MARKET_MARKER_SELL]);
      const encDataRight = await encDataV3_BUY([0, addrOriginLeft, 0, MARKET_MARKER_BUY]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount),
        ZERO,
        Asset(ETH, '0x', price),
        salt,
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', price),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount),
        '0',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataRight
      );
      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(left, signature, right, '0x', {
        from: makerRight.address,
        value: 200,
      });
      const receipt = await tx.wait();
      // console.log('ERC721<->ETH, not same origin, not same royalties V3:', receipt.gasUsed.toString());
    });

    it('same origin, not same royalties', async () => {
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '1000', erc1155TokenId1, [[wallet6.address, 1000]]);

      const addrOriginLeft = [[wallet5.address, 500]];
      const addrOriginRight = [[wallet5.address, 500]];

      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerRight.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {
          from: makerRight.address,
        }
      );
      const receipt = await tx.wait();
      // console.log('same origin, no royalties:', receipt.gasUsed.toString());
    });

    it('same origin, royalties', async () => {
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '1000', erc1155TokenId1, [[makerRight.address, 1000]]);

      const addrOriginLeft = [[wallet5.address, 500]];
      const addrOriginRight = [[wallet5.address, 500]];

      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerRight.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {
          from: makerRight.address,
        }
      );
      const receipt = await tx.wait();
      // console.log('same origin, yes royalties:', receipt.gasUsed.toString());
    });

    it('not same origin, yes royalties', async () => {
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '1000', erc1155TokenId1, [[makerRight.address, 1000]]);

      const addrOriginLeft = [[wallet6.address, 500]];
      const addrOriginRight = [[wallet5.address, 500]];

      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerRight.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {
          from: makerRight.address,
        }
      );
      const receipt = await tx.wait();
      // console.log('not same origin, yes royalties:', receipt.gasUsed.toString());
    });

    it('not same origin, not same royalties', async () => {
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '1000', erc1155TokenId1, [[wallet7.address, 1000]]);

      const addrOriginLeft = [[wallet6.address, 500]];
      const addrOriginRight = [[wallet5.address, 500]];

      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerRight.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {
          from: makerRight.address,
        }
      );
      const receipt = await tx.wait();
      // console.log('not same origin, not same royalties:', receipt.gasUsed.toString());
    });
  });

  describe('royalties', () => {
    it('royalties by owner, token ERC721 to ETH', async () => {
      const erc721 = await prepareERC721(makerLeft);
      await royaltiesRegistryProxy.setRoyaltiesByToken(erc721.address, [
        [wallet3.address, 500],
        [wallet4.address, 1000],
      ] as any); //set royalties by token

      const addrOriginLeft = [
        [wallet5.address, 500],
        [wallet6.address, 600],
      ];
      const addrOriginRight = [[wallet7.address, 700]];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 222, async () =>
        //200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft.address, -156, async () =>
          //200 -6seller - 14 originright
          verifyBalanceChange(wallet3.address, -10, async () =>
            verifyBalanceChange(wallet4.address, -20, async () =>
              verifyBalanceChange(wallet5.address, -10, async () =>
                verifyBalanceChange(wallet6.address, -12, async () =>
                  verifyBalanceChange(wallet7.address, -14, async () =>
                    verifyBalanceChange(protocol.address, 0, () =>
                      asSigner.matchOrders(left, signature, right, '0x', {
                        from: makerRight.address,
                        value: 300,
                        gasPrice: 0,
                      })
                    )
                  )
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });
    it('royalties by owner, token and tokenId ERC721 to ETH', async () => {
      const erc721 = await prepareERC721(makerLeft, erc721TokenId1, [
        [wallet3.address, 500],
        [wallet4.address, 1000],
      ]);

      const addrOriginLeft = [
        [wallet5.address, 500],
        [wallet6.address, 600],
      ];
      const addrOriginRight = [[wallet7.address, 700]];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 222, async () =>
        //200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft.address, -156, async () =>
          //200 -6seller - 14 originright
          verifyBalanceChange(wallet3.address, -10, async () =>
            verifyBalanceChange(wallet4.address, -20, async () =>
              verifyBalanceChange(wallet5.address, -10, async () =>
                verifyBalanceChange(wallet6.address, -12, async () =>
                  verifyBalanceChange(wallet7.address, -14, async () =>
                    verifyBalanceChange(protocol.address, 0, () =>
                      asSigner.matchOrders(left, signature, right, '0x', {
                        from: makerRight.address,
                        value: 300,
                        gasPrice: 0,
                      })
                    )
                  )
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });
  });

  describe('matchOrders', () => {
    it('ETH orders, expect throw, not enough ETH ', async () => {
      const erc20 = await prepareERC20(makerLeft, '1000');

      const left = Order(
        makerLeft.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const asSigner = exchangeV2Proxy.connect(makerLeft);
      await expect(
        asSigner.matchOrders(left, '0x', right, await EIP712.sign(right, makerRight.address, exchangeV2Proxy.address), {
          from: makerLeft.address,
          value: 199,
        })
      ).to.be.revertedWith('LibTransfer BaseCurrency transfer failed');
    });

    it('ETH orders, expect throw, unknown data type of order ', async () => {
      const erc20 = await prepareERC20(makerLeft, '1000');

      const left = Order(
        makerLeft.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        '0xfffffffe',
        '0x'
      );

      const asSigner = exchangeV2Proxy.connect(makerLeft);
      await expect(
        asSigner.matchOrders(left, '0x', right, await EIP712.sign(right, makerRight.address, exchangeV2Proxy.address), {
          from: makerLeft.address,
          value: 300,
        })
      ).to.be.revertedWith('Unknown Order data type');
    });

    it('ETH orders, rest is returned to taker (other side) ', async () => {
      const erc20 = await prepareERC20(makerRight, '1000');

      const left = Order(
        makerLeft.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const signature = await EIP712.sign(right, makerRight.address, exchangeV2Proxy.address);
      const asSigner = exchangeV2Proxy.connect(makerLeft);
      await verifyBalanceChange(makerRight.address, -200, async () =>
        verifyBalanceChange(makerLeft.address, 200, async () =>
          verifyBalanceChange(protocol.address, 0, () =>
            asSigner.matchOrders(left, '0x', right, signature, {
              from: makerLeft.address,
              value: 300,
              gasPrice: 0,
            })
          )
        )
      );
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(100);
      expect(await erc20.balanceOf(makerRight.address)).to.equal(900);
    });

    it('ERC721 to ETH order maker ETH != who pay, both orders have to be with signature ', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const signatureLeft = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);
      const signatureRight = await EIP712.sign(right, makerRight.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(wallet7);
      await verifyBalanceChange(wallet7.address, 200, async () =>
        verifyBalanceChange(makerLeft.address, -200, async () =>
          verifyBalanceChange(protocol.address, 0, () =>
            asSigner.matchOrders(left, signatureLeft, right, signatureRight, {
              from: wallet7.address,
              value: 200,
              gasPrice: 0,
            })
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('ERC721 to ETH order maker ETH != who pay, ETH orders have no signature, throw', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const asSigner = exchangeV2Proxy.connect(wallet7);
      await expect(
        asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: wallet7.address,
          value: 300,
          gasPrice: 0,
        })
      ).to.be.revertedWith('ECDSA: invalid signature length');
    });
  });

  describe('matchOrders, orderType == V1', () => {
    it('ERC20(100) to ERC20(200) protocol, origin, no royalties ', async () => {
      const erc20 = await prepareERC20(makerLeft, '104');
      const t2 = await prepareERC20(makerRight, '200');

      const addrOriginLeft = [[wallet3.address, 100]];
      const addrOriginRight = [[wallet4.address, 200]];
      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerRight.address, 10000]], addrOriginRight]);
      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC20, enc(t2.address), '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(t2.address), '200'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(left, signature, right, '0x', {from: makerRight.address});

      const receipt = await tx.wait();
      // console.log('ERC20 <=> ERC20:', receipt.gasUsed.toString());

      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(left))).to.equal(200);

      expect(await erc20.balanceOf(makerLeft.address)).to.equal(3); //=104 - (100amount + 3byuerFee +1originleft)
      expect(await erc20.balanceOf(makerRight.address)).to.equal(98); //=100 - 3sellerFee - 2originRight
      expect(await erc20.balanceOf(wallet3.address)).to.equal(1);
      expect(await erc20.balanceOf(wallet4.address)).to.equal(2);
      expect(await t2.balanceOf(makerLeft.address)).to.equal(200);
      expect(await t2.balanceOf(makerRight.address)).to.equal(0);
    });

    it('ERC20(10) to ERC20(20) protocol, no fees because of rounding', async () => {
      const erc20 = await prepareERC20(makerLeft, '10');
      const t2 = await prepareERC20(makerRight, '20');

      const addrOriginLeft = [[wallet3.address, 10]];
      const addrOriginRight = [[wallet4.address, 20]];
      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerRight.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '10'),
        ZERO,
        Asset(ERC20, enc(t2.address), '20'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(t2.address), '20'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '10'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.matchOrders(left, signature, right, '0x', {from: makerRight.address});

      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(left))).to.equal(20);

      expect(await erc20.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc20.balanceOf(makerRight.address)).to.equal(10);
      expect(await t2.balanceOf(makerLeft.address)).to.equal(20);
      expect(await t2.balanceOf(makerRight.address)).to.equal(0);
    });

    it('ERC721(DataV1) to ERC20(NO DataV1) protocol, origin, no royalties ', async () => {
      const erc721 = await prepareERC721(makerLeft);
      const erc20 = await prepareERC20(makerRight, '105');

      const addrOriginLeft = [
        [wallet3.address, 100],
        [wallet4.address, 200],
      ];
      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(left, signature, right, '0x', {from: makerRight.address});
      const receipt = await tx.wait();
      // console.log('ERC20 <=> ERC721:', receipt.gasUsed.toString());

      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(left))).to.equal(100);

      expect(await erc20.balanceOf(makerLeft.address)).to.equal(97); //=100 - 2originRight -1originleft
      expect(await erc20.balanceOf(makerRight.address)).to.equal(5); //=105 - (100amount + 3byuerFee )
      expect(await erc20.balanceOf(wallet3.address)).to.equal(1);
      expect(await erc20.balanceOf(wallet4.address)).to.equal(2);
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
      expect(await erc20.balanceOf(community.address)).to.equal(0);
    });

    it('ERC20(DataV1) to ERC1155(RoyaltiesV2, DataV1) protocol, origin, royalties ', async () => {
      const erc1155 = await prepareERC1155(makerRight, '10', erc1155TokenId1, [
        [wallet6.address, 1000],
        [wallet7.address, 500],
      ]);
      const erc20 = await prepareERC20(makerLeft, '200');

      const addrOriginLeft = [
        [wallet3.address, 300],
        [wallet4.address, 400],
      ];
      const addrOriginRight = [[wallet5.address, 500]];

      const encDataLeft = await encDataV1([[[makerLeft.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerRight.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(left, signature, right, '0x', {from: makerRight.address});

      const receipt = await tx.wait();
      // console.log('ERC20 <=> ERC1155:', receipt.gasUsed.toString());

      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(left))).to.equal(7);

      expect(await erc20.balanceOf(makerLeft.address)).to.equal(93); //=120 - (100amount + 3byuerFee + 3originLeft + 4originleft)
      expect(await erc20.balanceOf(makerRight.address)).to.equal(80); //=100 - 3sellerFee - (10 +5)Royalties - 5originRight

      expect(await erc20.balanceOf(wallet3.address)).to.equal(3); //originleft
      expect(await erc20.balanceOf(wallet4.address)).to.equal(4); //originleft
      expect(await erc20.balanceOf(wallet5.address)).to.equal(5); //originRight
      expect(await erc20.balanceOf(wallet6.address)).to.equal(10); //Royalties
      expect(await erc20.balanceOf(wallet7.address)).to.equal(5); //Royalties
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(7);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(3);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
    });

    it('ERC1155(RoyaltiesV2, DataV1) to ERC20(DataV1) protocol, origin, royalties', async () => {
      const erc1155 = await prepareERC1155(makerRight, '10', erc1155TokenId1, [
        [wallet6.address, 1000],
        [wallet7.address, 500],
      ]);
      const erc20 = await prepareERC20(makerLeft, '120');

      const addrOriginLeft = [
        [wallet3.address, 300],
        [wallet4.address, 400],
      ];
      const addrOriginRight = [[wallet5.address, 500]];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(left, signature, right, '0x', {from: makerRight.address});
      const receipt = await tx.wait();
      // console.log('ERC1155 V1 <=> ERC20 V1:', receipt.gasUsed.toString());

      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(right))).to.equal(100);

      expect(await erc20.balanceOf(makerLeft.address)).to.equal(15); //=120 - (100amount + 3byuerFee +5originRight )
      expect(await erc20.balanceOf(makerRight.address)).to.equal(78); //=100 - 3sellerFee - (10 +5)Royalties - (3+4)originLeft

      expect(await erc20.balanceOf(wallet3.address)).to.equal(3); //originleft
      expect(await erc20.balanceOf(wallet4.address)).to.equal(4); //originleft
      expect(await erc20.balanceOf(wallet5.address)).to.equal(5); //originRight
      expect(await erc20.balanceOf(wallet6.address)).to.equal(10); //Royalties
      expect(await erc20.balanceOf(wallet7.address)).to.equal(5); //Royalties
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(7);
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(3);
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
    });

    it('ETH(DataV1) to ERC720(DataV1) protocol, origin, no royalties', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = [
        [wallet5.address, 500],
        [wallet6.address, 600],
      ];
      const addrOriginRight = [[wallet7.address, 700]];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 222, async () =>
        //200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft.address, -186, async () =>
          //200 -6seller - 14 originright
          verifyBalanceChange(wallet5.address, -10, async () =>
            verifyBalanceChange(wallet6.address, -12, async () =>
              verifyBalanceChange(wallet7.address, -14, async () =>
                verifyBalanceChange(protocol.address, 0, () =>
                  asSigner.matchOrders(left, signature, right, '0x', {
                    from: makerRight.address,
                    value: 300,
                    gasPrice: 0,
                  })
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('ETH(DataV1) to ERC720(DataV1) protocol, origin fees comes from OrderNFT, no royalties', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft: any[] = [];
      const addrOriginRight = [
        [wallet5.address, 500],
        [wallet6.address, 600],
        [wallet7.address, 700],
      ];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 200, async () =>
        //200+6buyerFee+  (94back)
        verifyBalanceChange(makerLeft.address, -164, async () =>
          //200 -6seller - (10+ 12+ 14) originright
          verifyBalanceChange(wallet5.address, -10, async () =>
            verifyBalanceChange(wallet6.address, -12, async () =>
              verifyBalanceChange(wallet7.address, -14, async () =>
                verifyBalanceChange(protocol.address, 0, () =>
                  asSigner.matchOrders(left, signature, right, '0x', {
                    from: makerRight.address,
                    value: 300,
                    gasPrice: 0,
                  })
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('ETH(DataV1) to ERC720(DataV1) protocol, origin fees comes from OrderETH, no royalties', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = [
        [wallet5.address, 500],
        [wallet6.address, 600],
        [wallet7.address, 700],
      ];
      const addrOriginRight: any[] = [];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 236, async () =>
        //200+6buyerFee+ (10 +12 +14 origin left) (72back)
        verifyBalanceChange(makerLeft.address, -200, async () =>
          //200 -6seller -
          verifyBalanceChange(wallet5.address, -10, async () =>
            verifyBalanceChange(wallet6.address, -12, async () =>
              verifyBalanceChange(wallet7.address, -14, async () =>
                verifyBalanceChange(protocol.address, 0, () =>
                  asSigner.matchOrders(left, signature, right, '0x', {
                    from: makerRight.address,
                    value: 300,
                    gasPrice: 0,
                  })
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('ETH(DataV1) to ERC720(DataV1) protocol, no royalties, origin fees comes from OrderETH, not enough ETH', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = [
        [wallet5.address, 500],
        [wallet6.address, 600],
        [wallet7.address, 1000],
        [wallet3.address, 3000],
      ];
      const addrOriginRight: any[] = [];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const asSigner = exchangeV2Proxy.connect(makerLeft);
      await expect(
        asSigner.matchOrders(left, '0x', right, await EIP712.sign(right, makerRight.address, exchangeV2Proxy.address), {
          from: makerLeft.address,
          value: 300,
          gasPrice: 0,
        })
      ).to.be.revertedWith('LibTransfer BaseCurrency transfer failed');
    });

    it('ETH(DataV1) to ERC720(DataV1) protocol, no royalties, origin fees comes from OrderNFT, not enough ETH for lastOrigin and makerLeft', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft: any[] = [];
      const addrOriginRight = [
        [wallet3.address, 9000],
        [wallet5.address, 500],
        [wallet6.address, 600],
        [wallet7.address, 700],
      ];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[[makerLeft.address, 10000]], addrOriginRight]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(right, makerRight.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerLeft);
      await verifyBalanceChange(makerLeft.address, 200, async () =>
        //200+6buyerFee+
        verifyBalanceChange(makerRight.address, 0, async () =>
          //200 -6seller -(180 + 10 + 12(really 10) + 14(really 0) origin left)
          verifyBalanceChange(wallet3.address, -180, async () =>
            verifyBalanceChange(wallet5.address, -10, async () =>
              verifyBalanceChange(wallet6.address, -10, async () =>
                verifyBalanceChange(wallet7.address, 0, async () =>
                  verifyBalanceChange(protocol.address, 0, () =>
                    asSigner.matchOrders(left, '0x', right, signature, {
                      from: makerLeft.address,
                      value: 300,
                      gasPrice: 0,
                    })
                  )
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });
  });

  describe('matchOrders, ordersType == V1, multiple beneficiary', () => {
    it('ERC20(100) to ERC20(200) protocol, origin, no royalties, payouts: 1)20/80%, 2)50/50%', async () => {
      const erc20 = await prepareERC20(makerLeft, '104');
      const t2 = await prepareERC20(makerRight, '200');

      const addrOriginLeft = [[wallet3.address, 100]];
      const addrOriginRight = [[wallet4.address, 200]];
      const encDataLeft = await encDataV1([
        [
          [makerLeft.address, 5000],
          [wallet5.address, 5000],
        ],
        addrOriginLeft,
      ]);
      const encDataRight = await encDataV1([
        [
          [makerRight.address, 2000],
          [wallet6.address, 8000],
        ],
        addrOriginRight,
      ]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC20, enc(t2.address), '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(t2.address), '200'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      const tx = await asSigner.matchOrders(left, signature, right, '0x', {from: makerRight.address});
      const receipt = await tx.wait();
      // console.log('ERC20 <=> ERC20 PAYOUTS:', receipt.gasUsed.toString());

      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(left))).to.equal(200);

      expect(await erc20.balanceOf(makerLeft.address)).to.equal(3); //=104 - (100amount + 3byuerFee +1originleft)
      expect(await erc20.balanceOf(makerRight.address)).to.equal(19); //=(100 - 3sellerFee - 2originRight)*20%
      expect(await erc20.balanceOf(wallet6.address)).to.equal(79); //=(100 - 3sellerFee - 2originRight)*80%
      expect(await erc20.balanceOf(wallet3.address)).to.equal(1);
      expect(await erc20.balanceOf(wallet4.address)).to.equal(2);
      expect(await t2.balanceOf(makerLeft.address)).to.equal(100); //50%
      expect(await t2.balanceOf(wallet5.address)).to.equal(100); //50%
      expect(await t2.balanceOf(makerRight.address)).to.equal(0);
    });

    it('ERC721(DataV1) to ERC20(NO DataV1) protocol, origin, no royalties, payouts: 50/50%', async () => {
      const erc20 = await prepareERC20(makerRight, '105');
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = [
        [wallet3.address, 100],
        [wallet4.address, 100],
      ];
      const encDataLeft = await encDataV1([
        [
          [makerLeft.address, 5000],
          [wallet5.address, 5000],
        ],
        addrOriginLeft,
      ]);
      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.matchOrders(left, signature, right, '0x', {from: makerRight.address});

      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(left))).to.equal(100);

      expect(await erc20.balanceOf(makerLeft.address)).to.equal(49); //=100 - 3sellerFee - 2originRight -1originleft 50%
      expect(await erc20.balanceOf(wallet5.address)).to.equal(49); //=100 - 3sellerFee - 2originRight -1originleft 50%
      expect(await erc20.balanceOf(makerRight.address)).to.equal(5); //=105 - (100amount + 3byuerFee )
      expect(await erc20.balanceOf(wallet3.address)).to.equal(1);
      expect(await erc20.balanceOf(wallet4.address)).to.equal(1);
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
      expect(await erc20.balanceOf(community.address)).to.equal(0);
    });

    it('ERC721(DataV1) to ERC20(NO DataV1) protocol, origin, no royalties, payouts: 110%, throw', async () => {
      const erc20 = await prepareERC20(makerRight, '105');
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = [
        [wallet3.address, 100],
        [wallet4.address, 200],
      ];
      const encDataLeft = await encDataV1([
        [
          [makerLeft.address, 5000],
          [wallet5.address, 6000],
        ],
        addrOriginLeft,
      ]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.revertedWith('Sum payouts Bps not equal 100%');
    });

    it('ETH(DataV1) to ERC721(DataV1) protocol, origin, no royalties, payouts: 50/50%', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = [
        [wallet5.address, 500],
        [wallet6.address, 600],
      ];
      const addrOriginRight = [[wallet7.address, 700]];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([
        [
          [makerLeft.address, 5000],
          [wallet3.address, 5000],
        ],
        addrOriginRight,
      ]);

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 222, async () =>
        //200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(wallet3.address, -93, async () =>
          //200 -6seller - 14 originright *50%
          verifyBalanceChange(makerLeft.address, -93, async () =>
            //200 -6seller - 14 originright *50%
            verifyBalanceChange(wallet5.address, -10, async () =>
              verifyBalanceChange(wallet6.address, -12, async () =>
                verifyBalanceChange(wallet7.address, -14, async () =>
                  verifyBalanceChange(protocol.address, 0, () =>
                    asSigner.matchOrders(left, signature, right, '0x', {
                      from: makerRight.address,
                      value: 300,
                      gasPrice: 0,
                    })
                  )
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });

    it('ETH(DataV1) to ERC721(DataV1) protocol, origin, no royalties, payouts: empy 100% to order.maker', async () => {
      const erc721 = await prepareERC721(makerLeft);

      const addrOriginLeft = [
        [wallet5.address, 500],
        [wallet6.address, 600],
      ];
      const addrOriginRight = [[wallet7.address, 700]];

      const encDataLeft = await encDataV1([[[makerRight.address, 10000]], addrOriginLeft]);
      const encDataRight = await encDataV1([[], addrOriginRight]); //empty payout

      const left = Order(
        makerLeft.address,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
        '1',
        0,
        0,
        ORDER_DATA_V1,
        encDataLeft
      );

      const signature = await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address);

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerRight.address, 222, async () =>
        //200+6buyerFee+ (10 +12 origin left) (72back)
        verifyBalanceChange(makerLeft.address, -186, async () =>
          //200 -6seller - 14 originright *100%
          verifyBalanceChange(wallet5.address, -10, async () =>
            verifyBalanceChange(wallet6.address, -12, async () =>
              verifyBalanceChange(wallet7.address, -14, async () =>
                verifyBalanceChange(protocol.address, 0, () =>
                  asSigner.matchOrders(left, signature, right, '0x', {
                    from: makerRight.address,
                    value: 300,
                    gasPrice: 0,
                  })
                )
              )
            )
          )
        )
      );
      expect(await erc721.balanceOf(makerLeft.address)).to.equal(0);
      expect(await erc721.balanceOf(makerRight.address)).to.equal(1);
    });
  });

  describe('matchOrders, orderType = V2', () => {
    it('should correctly calculate make-side fill for isMakeFill = true ', async () => {
      const buyer1 = wallet3;

      const erc1155 = await prepareERC1155(makerLeft, '200');

      const encDataLeft = await encDataV2([[], [], true]);
      const encDataRight = await encDataV2([[], [], false]);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ETH, '0x', '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '500'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerLeft.address, -500, async () =>
        verifyBalanceChange(makerRight.address, 500, async () =>
          asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
            from: makerRight.address,
            value: 600,
            gasPrice: 0,
          })
        )
      );
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(100);
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(100);

      const leftOrderHash = await testHelper.hashKey(left);
      const test_hash = await testHelper.hashV2(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        Asset(ETH, '0x', '1000'),
        1,
        encDataLeft
      );
      expect(leftOrderHash).to.equal(test_hash);
      expect(await exchangeV2Proxy.fills(leftOrderHash)).to.equal(100);

      const lefterc20 = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ETH, '0x', '600'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const righerc20 = Order(
        buyer1.address,
        Asset(ETH, '0x', '300'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const asSigner2 = exchangeV2Proxy.connect(buyer1);
      await verifyBalanceChange(makerLeft.address, -300, async () =>
        verifyBalanceChange(buyer1.address, 300, async () =>
          asSigner2.matchOrders(
            lefterc20,
            await EIP712.sign(lefterc20, makerLeft.address, exchangeV2Proxy.address),
            righerc20,
            '0x',
            {
              from: buyer1.address,
              value: 600,
              gasPrice: 0,
            }
          )
        )
      );
      expect(await exchangeV2Proxy.fills(leftOrderHash)).to.equal(200);
      expect(await erc1155.balanceOf(buyer1.address, erc1155TokenId1)).to.equal(100);
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(0);
    });

    it('should correctly calculate take-side fill for isMakeFill = false ', async () => {
      const buyer1 = wallet3;

      const erc1155 = await prepareERC1155(makerLeft, '200');

      const encDataLeft = await encDataV2([[], [], false]);
      const encDataRight = await encDataV2([[], [], false]);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ETH, '0x', '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '500'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerLeft.address, -500, async () =>
        verifyBalanceChange(makerRight.address, 500, async () =>
          asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
            from: makerRight.address,
            value: 600,
            gasPrice: 0,
          })
        )
      );
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1), '100');
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1), '100');

      const leftOrderHash = await testHelper.hashKey(left);
      expect(await exchangeV2Proxy.fills(leftOrderHash)).to.equal(500);

      const leferc20 = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ETH, '0x', '2000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const righerc20 = Order(
        buyer1.address,
        Asset(ETH, '0x', '1000'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const asSigner2 = exchangeV2Proxy.connect(buyer1);
      await verifyBalanceChange(makerLeft.address, -1000, async () =>
        verifyBalanceChange(buyer1.address, 1000, async () =>
          asSigner2.matchOrders(
            leferc20,
            await EIP712.sign(leferc20, makerLeft.address, exchangeV2Proxy.address),
            righerc20,
            '0x',
            {
              from: buyer1.address,
              value: 1100,
              gasPrice: 0,
            }
          )
        )
      );

      expect(await erc1155.balanceOf(buyer1.address, erc1155TokenId1)).to.equal(100);
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(0);
      expect(await exchangeV2Proxy.fills(leftOrderHash)).to.equal(1500);
    });

    it('should correctly calculate make-side fill for isMakeFill = true and LibPartToUints ', async () => {
      const buyer1 = wallet3;

      const erc1155 = await prepareERC1155(makerLeft, '200');

      const encDataLeft = await encDataV2([[[makerLeft.address, 10000]], [[wallet5.address, 1000]], true]);
      const encDataRight = await encDataV2([[], [], false]);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ETH, '0x', '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '500'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await verifyBalanceChange(makerLeft.address, -450, async () =>
        verifyBalanceChange(makerRight.address, 500, async () =>
          verifyBalanceChange(wallet5.address, -50, async () =>
            asSigner.matchOrders(
              left,
              await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
              right,
              '0x',
              {
                from: makerRight.address,
                value: 600,
                gasPrice: 0,
              }
            )
          )
        )
      );
      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1), '100');
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1), '100');

      const leftOrderHash = await testHelper.hashKey(left);
      const test_hash = await testHelper.hashV2(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        Asset(ETH, '0x', '1000'),
        1,
        encDataLeft
      );
      expect(leftOrderHash).to.equal(test_hash);
      expect(await exchangeV2Proxy.fills(leftOrderHash)).to.equal(100);

      const leferc20 = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ETH, '0x', '600'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const righerc20 = Order(
        buyer1.address,
        Asset(ETH, '0x', '300'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const asSigner2 = exchangeV2Proxy.connect(buyer1);
      await verifyBalanceChange(makerLeft.address, -270, async () =>
        verifyBalanceChange(buyer1.address, 300, async () =>
          verifyBalanceChange(wallet5.address, -30, async () =>
            asSigner2.matchOrders(
              leferc20,
              await EIP712.sign(leferc20, makerLeft.address, exchangeV2Proxy.address),
              righerc20,
              '0x',
              {
                from: buyer1.address,
                value: 600,
                gasPrice: 0,
              }
            )
          )
        )
      );
      expect(await exchangeV2Proxy.fills(leftOrderHash)).to.equal(200);
      expect(await erc1155.balanceOf(buyer1.address, erc1155TokenId1), '100');
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1), '0');
    });

    it('should correctly behave if origin fees are too big', async () => {
      const erc1155 = await prepareERC1155(makerLeft, '200');

      const encDataLeft = await encDataV2([[[makerLeft.address, 10000]], [[wallet5.address, 1000]], true]);
      const encDataRight = await encDataV2([[], [[wallet5.address, '79228162514264337593543949336']], false]);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ETH, '0x', '1000'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ETH, '0x', '500'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
          value: '600',
        })
      ).to.be.revertedWith('wrong origin fees');
    });
  });

  describe('matchOrders, orderType = V3', () => {
    it('should correctly pay to everyone involved in a match ', async () => {
      const originBuyer = wallet3;
      const originSeller = wallet4;
      const creator = wallet5;
      const erc20 = await prepareERC20(makerRight, '1000');
      const erc1155 = await prepareERC1155(makerLeft, '1000');

      const encDataLeft = await encDataV3_BUY([0, await LibPartToUint(originBuyer.address, 300), 0, MARKET_MARKER_BUY]);
      const encDataRight = await encDataV3_SELL([
        0,
        await LibPartToUint(originSeller.address, 400),
        0,
        1000,
        MARKET_MARKER_SELL,
      ]);

      await royaltiesRegistryProxy.setRoyaltiesByToken(erc1155.address, [[creator.address, 1000] as any]); //set royalties by token

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '200'),
        '1',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {from: makerRight.address}
      );

      expect(await erc1155.balanceOf(makerRight.address, erc1155TokenId1)).to.equal(200);
      expect(await erc1155.balanceOf(makerLeft.address, erc1155TokenId1)).to.equal(800);

      // 3% to protocol
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
      // 3% to originBuyer
      expect(await erc20.balanceOf(originBuyer.address)).to.equal(3);
      // 4% to originSeller
      expect(await erc20.balanceOf(originSeller.address)).to.equal(4);
      // 10% to creator as royalties, 80 left
      expect(await erc20.balanceOf(creator.address)).to.equal(10);
      // 100% of what's left (80) to makerLeft
      expect(await erc20.balanceOf(makerLeft.address)).to.equal(83);

      //checking fills
      // sell-order has make-side fills
      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(right))).to.equal(200);
      //buy-order has take-side fills
      expect(await exchangeV2Proxy.fills(await testHelper.hashKey(left))).to.equal(200);
    });

    it("should not match when there's a problem with order types ", async () => {
      const originBuyer = wallet3;
      const originSeller = wallet4;
      const erc20 = await prepareERC20(makerRight, '1000');
      const erc1155 = await prepareERC1155(makerLeft, '1000');

      const encDataRight = await encDataV3_BUY([
        0,
        await LibPartToUint(originBuyer.address, 300),
        0,
        MARKET_MARKER_BUY,
      ]);
      const encDataLeft = await encDataV3_SELL([
        0,
        await LibPartToUint(originSeller.address, 400),
        0,
        1000,
        MARKET_MARKER_SELL,
      ]);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataRight
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );

      // wrong => sell order has V3_BUY type and buy order has V3_SELL type
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.reverted;

      // wrong => sell order has no type (buy order is correct)
      changeOrderData(left, encDataLeft);
      changeOrderData(right, encDataRight);

      changeOrderType(right, ORDER_DATA_V3_BUY);
      changeOrderType(left, '0xffffffff');
      const asSigner2 = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner2.matchOrders(right, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.revertedWith(`assets don't match`);

      // wrong => sell order has V1 type (buy order is correct)
      changeOrderType(left, ORDER_DATA_V1);
      const asSigner3 = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner3.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.reverted;

      // wrong => sell order has V2 type (buy order is correct)
      changeOrderType(left, ORDER_DATA_V2);
      const asSigner4 = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner4.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.reverted;

      // wrong => buy order has no type (sell order is coorect)
      changeOrderType(right, '0xffffffff');
      changeOrderType(left, ORDER_DATA_V3_SELL);
      const asSigner5 = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner5.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.reverted;

      // wrong => buy order has V1 type (sell order is coorect)
      changeOrderType(right, ORDER_DATA_V1);
      const asSigner6 = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner6.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.reverted;

      // wrong => buy order has V2 type (sell order is coorect)
      changeOrderType(right, ORDER_DATA_V2);
      const asSigner7 = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner7.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.reverted;

      // make type right
      changeOrderType(right, ORDER_DATA_V3_BUY);
      const asSigner8 = exchangeV2Proxy.connect(makerRight);
      await asSigner8.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {from: makerRight.address}
      );
    });

    it("should not match when there's a problem with fees sum", async () => {
      const originBuyer = wallet3;
      const originSeller = wallet4;
      const erc20 = await prepareERC20(makerRight, '1000');
      const erc1155 = await prepareERC1155(makerLeft, '1000');

      const encDataLeft = await encDataV3_SELL([
        0,
        await LibPartToUint(originSeller.address, 400),
        0,
        1000,
        MARKET_MARKER_SELL,
      ]);
      const encDataRight = await encDataV3_BUY([
        0,
        await LibPartToUint(originBuyer.address, 700),
        0,
        MARKET_MARKER_BUY,
      ]);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.revertedWith('wrong maxFee');

      changeOrderData(
        right,
        await encDataV3_BUY([0, await LibPartToUint(originBuyer.address, 400), 0, MARKET_MARKER_SELL])
      );

      const asSigner2 = exchangeV2Proxy.connect(makerRight);
      await asSigner2.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {from: makerRight.address}
      );
    });

    it("should not match when there's a problem with max fee", async () => {
      const originBuyer = wallet3;
      const erc20 = await prepareERC20(makerRight, '1000');
      const erc1155 = await prepareERC1155(makerLeft, '1000');

      const encDataLeft = await encDataV3_SELL([
        0,
        await LibPartToUint(originBuyer.address, 300),
        0,
        200,
        MARKET_MARKER_SELL,
      ]);
      const encDataRight = await encDataV3_BUY([0, await LibPartToUint(), 0, MARKET_MARKER_BUY]);

      const left = Order(
        makerLeft.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataRight
      );

      // wrong, maxfee = 2%, protocolFee = 3%
      const asSigner = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.revertedWith('wrong maxFee');

      changeOrderData(left, await encDataV3_SELL([0, await LibPartToUint(), 0, 0, MARKET_MARKER_SELL]));
      const asSigner2 = exchangeV2Proxy.connect(makerRight);
      await expect(
        asSigner2.matchOrders(left, await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address), right, '0x', {
          from: makerRight.address,
        })
      ).to.be.revertedWith('wrong maxFee');

      //setting maxFee at 1% works
      changeOrderData(left, await encDataV3_SELL([0, await LibPartToUint(), 0, 100, MARKET_MARKER_SELL]));
      const asSigner3 = exchangeV2Proxy.connect(makerRight);
      await asSigner3.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {from: makerRight.address}
      );
    });

    it('should work with 2 origin fees', async () => {
      const originBuyer = wallet3;
      const originSeller = wallet4;
      const originBuyer2 = wallet6;
      const originSeller2 = wallet7;
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '1000');

      const encDataLeft = await encDataV3_BUY([
        0,
        await LibPartToUint(originBuyer.address, 100),
        await LibPartToUint(originBuyer2.address, 200),
        MARKET_MARKER_BUY,
      ]);
      const encDataRight = await encDataV3_SELL([
        0,
        await LibPartToUint(originSeller.address, 300),
        await LibPartToUint(originSeller2.address, 400),
        1000,
        MARKET_MARKER_SELL,
      ]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {from: makerRight.address}
      );

      // 0% to protocol
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
      // 1% to originBuyer
      expect(await erc20.balanceOf(originBuyer.address)).to.equal(1);
      // 2% to originBuyer2
      expect(await erc20.balanceOf(originBuyer2.address)).to.equal(2);
      // 3% to originSeller
      expect(await erc20.balanceOf(originSeller.address)).to.equal(3);
      // 4% to originSeller2
      expect(await erc20.balanceOf(originSeller2.address)).to.equal(4);
      // 100% of what's left to makerRight
      expect(await erc20.balanceOf(makerRight.address)).to.equal(90);
    });

    it('should work when using only second origin', async () => {
      const originBuyer2 = wallet6;
      const originSeller2 = wallet7;
      const erc20 = await prepareERC20(makerLeft, '1000');
      const erc1155 = await prepareERC1155(makerRight, '1000');

      const encDataLeft = await encDataV3_BUY([
        0,
        0,
        await LibPartToUint(originBuyer2.address, 200),
        MARKET_MARKER_SELL,
      ]);
      const encDataRight = await encDataV3_SELL([
        0,
        0,
        await LibPartToUint(originSeller2.address, 400),
        1000,
        MARKET_MARKER_SELL,
      ]);

      const left = Order(
        makerLeft.address,
        Asset(ERC20, enc(erc20.address), '100'),
        ZERO,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_BUY,
        encDataLeft
      );
      const right = Order(
        makerRight.address,
        Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
        ZERO,
        Asset(ERC20, enc(erc20.address), '100'),
        '1',
        0,
        0,
        ORDER_DATA_V3_SELL,
        encDataRight
      );

      const asSigner = exchangeV2Proxy.connect(makerRight);
      await asSigner.matchOrders(
        left,
        await EIP712.sign(left, makerLeft.address, exchangeV2Proxy.address),
        right,
        '0x',
        {from: makerRight.address}
      );

      // 0% to protocol
      expect(await erc20.balanceOf(protocol.address)).to.equal(0);
      // 2% to originBuyer2
      expect(await erc20.balanceOf(originBuyer2.address)).to.equal(2);
      // 4% to originSeller2
      expect(await erc20.balanceOf(originSeller2.address)).to.equal(4);
      // 100% of what's left to makerRight
      expect(await erc20.balanceOf(makerRight.address)).to.equal(94);
    });

    function changeOrderData(order: any, data: any) {
      order.data = data;
    }

    function changeOrderType(order: any, type: any) {
      order.dataType = type;
    }
  });

  async function prepare_ERC_1155V1_Orders(erc1155amount = 10) {
    await ghostERC1155.mintGhost(
      wallet1.address,
      erc1155amount,
      DATA,
      [
        {recipient: wallet3.address, value: 1000},
        {recipient: wallet4.address, value: 500},
      ],
      'ext_uri',
      ''
    );
    const erc1155TokenId1 = (await getLastTokenID(ghostERC1155)).toString();

    const erc1155AsSigner = ghostERC1155.connect(wallet1);

    await erc1155AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});

    const left = Order(
      wallet2.address,
      Asset(ETH, '0x', '200'),
      ZERO,
      Asset(ERC1155, enc(ghostERC1155.address, erc1155TokenId1), '4'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const right = Order(
      wallet1.address,
      Asset(ERC1155, enc(ghostERC1155.address, erc1155TokenId1), '4'),
      ZERO,
      Asset(ETH, '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    return {left, right, erc1155TokenId1};
  }

  async function prepareMultiple2Orders(orderAmount: number) {
    const ordersArray = [];
    let i = 0;
    while (i < orderAmount) {
      i++;
      const {left, right} = await prepare2Orders();
      const orderLeftRight = [left, right];
      ordersArray.push(orderLeftRight);
    }
    return ordersArray;
  }

  async function prepare2Orders(t1Amount = 100, t2Amount = 200) {
    await t1.mint(wallet1.address, t1Amount);
    await t2.mint(wallet2.address, t2Amount);

    const t1AsSigner = t1.connect(wallet1);
    const t2AsSigner = t1.connect(wallet2);
    await t1AsSigner.approve(erc20TransferProxy.address, 10000000, {from: wallet1.address});
    await t2AsSigner.approve(erc20TransferProxy.address, 10000000, {from: wallet2.address});

    const left = Order(
      wallet1.address,
      Asset(ERC20, enc(t1.address), '100'),
      ZERO,
      Asset(ERC20, enc(t2.address), '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const right = Order(
      wallet2.address,
      Asset(ERC20, enc(t2.address), '200'),
      ZERO,
      Asset(ERC20, enc(t1.address), '100'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    return {left, right};
  }

  async function prepareERC20(user: SignerWithAddress, value = '1000') {
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    testERC20 = await TestERC20.deploy();
    const asSigner = testERC20.connect(user);
    await asSigner.mint(user.address, value);
    await asSigner.approve(erc20TransferProxy.address, value, {from: user.address});
    return asSigner;
  }

  async function prepareERC721(user: SignerWithAddress, tokenId = erc721TokenId1, royalties: any[] = []) {
    const asSigner = erc721WithRoyalties.connect(user);
    await asSigner.mint(user.address, tokenId, royalties, {from: user.address});
    await asSigner.setApprovalForAll(transferProxy.address, true, {from: user.address});
    return asSigner;
  }

  async function prepareERC1155(
    user: SignerWithAddress,
    value = '100',
    tokenId = erc1155TokenId1,
    royalties: any[] = []
  ) {
    const asSigner = erc1155WithRoyalties.connect(user);
    await asSigner.mint(user.address, tokenId, value, royalties, {from: user.address});
    await asSigner.setApprovalForAll(transferProxy.address, true, {from: user.address});
    return asSigner;
  }

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

  async function LibPartToUint(account = ZERO, value = 0) {
    return await testHelper.encodeOriginFeeIntoUint(account, value);
  }
});
