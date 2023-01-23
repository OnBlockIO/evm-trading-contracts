/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {
  ERC20TransferProxy,
  TransferProxy,
  ExchangeV2,
  RoyaltiesRegistry,
  TestERC20,
  GhostMarketERC1155,
  GhostMarketERC721,
  ERC721WithRoyalties,
} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Asset, Order} from './utils/order';
import EIP712 from './utils/EIP712';
import {ZERO, ORDER_DATA_V1, ERC721, ERC1155, ERC20, ETH, enc} from './utils/assets';
import hre, {ethers, upgrades} from 'hardhat';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL, DATA} from './utils/constants';
import {encDataV1JS, expectEqualStringValues, getLastTokenID, verifyBalanceChange} from './utils/helpers';

describe('Exchange Test', async function () {
  let addOperator = false;
  let exchangeV2Proxy: ExchangeV2;
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let ghostERC1155: GhostMarketERC1155;
  let ghostERC721: GhostMarketERC721;
  let royaltiesRegistryProxy: RoyaltiesRegistry;
  let t1: TestERC20;
  let t2: TestERC20;
  let erc721WithRoyalties: ERC721WithRoyalties;
  let wallet0: SignerWithAddress;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;
  let wallet4: SignerWithAddress;
  let wallet5: SignerWithAddress;
  let wallet6: SignerWithAddress;
  let protocol: SignerWithAddress;

  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    wallet0 = accounts[1];
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    wallet4 = accounts[4];
    wallet5 = accounts[5];
    wallet6 = accounts[6];
    protocol = accounts[1];
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const ExchangeV2Test = await ethers.getContractFactory('ExchangeV2');
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    const TestERC721V1 = await ethers.getContractFactory('GhostMarketERC721');
    const TestGhostERC1155 = await ethers.getContractFactory('GhostMarketERC1155');
    const ERC721WithRoyalties = await ethers.getContractFactory('ERC721WithRoyalties');
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');

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

    ghostERC721 = <GhostMarketERC721>await upgrades.deployProxy(TestERC721V1, [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI], {
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

    erc721WithRoyalties = await ERC721WithRoyalties.deploy('ERC721WithRoyalties', '2981');

    if (addOperator) {
      await transferProxy.addOperator(exchangeV2Proxy.address);
      await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    }
  });

  it('should be able to transfer ownership of contract', async function () {
    await exchangeV2Proxy.transferOwnership(wallet1.address);
    expect(await exchangeV2Proxy.owner()).to.equal(wallet1.address);
  });

  it('should be able to upgrade from new contract to another new one', async function () {
    const ExchangeV2_ContractFactory = await ethers.getContractFactory('ExchangeV2');
    const ExchangeV10_ContractFactory = await ethers.getContractFactory('ExchangeV10');

    const exchangeV2Core = await upgrades.deployProxy(
      ExchangeV2_ContractFactory,
      [wallet0.address, wallet0.address, 0, wallet0.address, wallet0.address],
      {initializer: '__ExchangeV2_init', unsafeAllowCustomTypes: true}
    );

    //upgrade
    const exchangeV2CoreV2 = await upgrades.upgradeProxy(
      exchangeV2Core.address,
      ExchangeV10_ContractFactory
    );

    //test new function
    expect(await exchangeV2CoreV2.getSomething()).to.equal(10);
  });

  it("should work only allow owner to change transfer proxy", async () => {
    const t1AsSigner = exchangeV2Proxy.connect(wallet1);
    const t2AsSigner = exchangeV2Proxy.connect(wallet2);
    await expect(
      t1AsSigner.setTransferProxy("0x00112233", wallet2.address, { from: wallet1.address })
    ).to.be.revertedWith('Ownable: caller is not the owner');
    t2AsSigner.setTransferProxy("0x00112233", wallet2.address, { from: wallet0.address });
  })

  it('should work for cancel ERC20 order', async () => {
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

  it('should fail for order with salt 0 cancel', async () => {
    const {left} = await prepare2Orders();
    left.salt = '0';

    const exchangeV2AsSigner = exchangeV2Proxy.connect(wallet1);

    const tx = exchangeV2AsSigner.cancel(left, {from: wallet1.address});

    await expect(tx).to.be.revertedWith("0 salt can't be used");
  });

  it('should work for cancel ERC1155 order', async () => {
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

  it('should work for bulk cancel ERC20 orders', async () => {
    const orderArray = await prepareMultiple2Orders(3);

    const leftOrderArray: any[] = [];
    orderArray.forEach((ordersLR) => {
      leftOrderArray.push(ordersLR[0]);
    });
    const exchangeV2AsSigner2 = exchangeV2Proxy.connect(wallet1);
    await exchangeV2AsSigner2.bulkCancelOrders(leftOrderArray, {from: wallet1.address});
  });

  it('should fail not allowing to fill more than 100% of the order', async () => {
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

  it('should not let proceed if taker is not correct', async () => {
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

  it('should not let proceed if one of the signatures is incorrect', async () => {
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

  it('should not let proceed if order dates are wrong', async () => {
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

  it('should throw if assets do not match', async () => {
    const {left, right} = await prepare2Orders();
    left.takeAsset.assetType.data = enc(wallet1.address);

    const leftSig = await EIP712.sign(left, wallet1.address, exchangeV2Proxy.address);
    const rightSig = await EIP712.sign(right, wallet2.address, exchangeV2Proxy.address);

    await expect(exchangeV2Proxy.matchOrders(left, leftSig, right, rightSig)).to.be.revertedWith(`assets don't match`);
  });

  it('should work for ETH orders, rest is returned to taker (other side)', async () => {
    const snapshot = await ethers.provider.send('evm_snapshot', []);
    try {
      await t1.mint(wallet1.address, 100);

      const t1AsSigner = t1.connect(wallet1);
      await t1AsSigner.approve(erc20TransferProxy.address, 10000000, {from: wallet1.address});

      const left = Order(
        wallet2.address,
        Asset(ETH, '0x', '200'),
        ZERO,
        Asset(ERC20, enc(t1.address), '100'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );
      const right = Order(
        wallet1.address,
        Asset(ERC20, enc(t1.address), '100'),
        ZERO,
        Asset(ETH, '0x', '200'),
        '1',
        0,
        0,
        '0xffffffff',
        '0x'
      );

      const signatureRight = await EIP712.sign(right, wallet1.address, exchangeV2Proxy.address);

      const exchangeV2AsSigner = exchangeV2Proxy.connect(wallet2);
      await verifyBalanceChange(wallet2.address, 200, async () =>
        verifyBalanceChange(wallet1.address, -200, async () =>
          exchangeV2AsSigner.matchOrders(left, '0x', right, signatureRight, {
            from: wallet2.address,
            value: 300,
            gasPrice: 0,
          })
        )
      );

      expect((await t1.balanceOf(wallet1.address)).toString()).to.equal('0');
      expect((await t1.balanceOf(wallet2.address)).toString()).to.equal('100');
    } finally {
      await ethers.provider.send('evm_revert', [snapshot]);
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

  async function prepare721sellingWithOptionalOriginRoyalties(
    encDataLeft: any,
    encDataRight: any,
    royalties: any[] = []
  ) {
    await ghostERC721.mintGhost(wallet1.address, royalties, 'ext_uri', '');
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const erc721V1AsSigner = ghostERC721.connect(wallet1);

    const result = erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    await expect(result)
      .to.emit(erc721V1AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet2);

    //origin fee is only working if ORDER_DATA_V1 is passed; we cant pass here "0xffffffff" because the NFT is not locked in an acution contract
    const left = Order(
      wallet2.address,
      Asset(ETH, '0x', '200'),
      ZERO,
      Asset(ERC721, enc(ghostERC721.address, erc721TokenId1), '1'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataLeft
    );
    const right = Order(
      wallet1.address,
      Asset(ERC721, enc(ghostERC721.address, erc721TokenId1), '1'),
      ZERO,
      Asset(ETH, '0x', '200'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataRight
    );
    const signatureRight = await EIP712.sign(right, wallet1.address, exchangeV2Proxy.address);
    return {left, right, signatureRight, matchOrdersSigner};
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
});
