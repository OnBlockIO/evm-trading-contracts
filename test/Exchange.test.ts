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
    // const GhostMarketTransferManagerTest = await ethers.getContractFactory('GhostMarketTransferManagerTest');
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
    // await GhostMarketTransferManagerTest.deploy();
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

    //fee receiver for ETH transfer is the protocol address
    // await exchangeV2Proxy.setFeeReceiver(ZERO, protocol.address);
    //fee receiver for Token t1 transfer is the protocol address
    // await exchangeV2Proxy.setFeeReceiver(t1.address, protocol.address);
    await transferProxy.addOperator(exchangeV2Proxy.address);
    await erc20TransferProxy.addOperator(exchangeV2Proxy.address);

    erc721WithRoyalties = await ERC721WithRoyalties.deploy('ERC721WithRoyalties', '2981');

    if (addOperator) {
      await transferProxy.addOperator(exchangeV2Proxy.address);
      await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    }
  });

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
    await expect(tx2).to.be.revertedWith('revert');
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
    await expect(tx2).to.be.revertedWith('revert');
  });

  it('should work for bulk cancel ERC20 orders', async () => {
    //all orders are created with the same maker and taker account,
    //left (order) = account1 tries to bulk cancel his orders
    const orderArray = await prepareMultiple2Orders(3);

    const leftOrderArray: any[] = [];
    orderArray.forEach((ordersLR) => {
      leftOrderArray.push(ordersLR[0]);
    });
    const exchangeV2AsSigner2 = exchangeV2Proxy.connect(wallet1);
    await exchangeV2AsSigner2.bulkCancelOrders(leftOrderArray, {from: wallet1.address});
  });

  it('should work for ETH orders, rest is returned to taker (other side)', async () => {
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
    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      const tx = await exchangeV2AsSigner.matchOrders(left, '0x', right, signatureRight, {
        from: wallet2.address,
        value: 300,
      });
      tx.wait();
    } else {
      await verifyBalanceChange(wallet2.address, 206, async () =>
        verifyBalanceChange(wallet1.address, -200, async () =>
          verifyBalanceChange(protocol.address, -6, () =>
            exchangeV2AsSigner.matchOrders(left, '0x', right, signatureRight, {
              from: wallet2.address,
              value: 300,
              gasPrice: 0,
            })
          )
        )
      );

      expect((await t1.balanceOf(wallet1.address)).toString()).to.equal('0');
      expect((await t1.balanceOf(wallet2.address)).toString()).to.equal('100');
    }
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol, NO Origin fees, Royalties', async () => {
    await ghostERC721.mintGhost(
      wallet1.address,
      [
        {recipient: wallet2.address, value: 300},
        {recipient: wallet3.address, value: 400},
      ],
      'ext_uri',
      ''
    );
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const erc721V1AsSigner = ghostERC721.connect(wallet1);

    const result = erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    await expect(result)
      .to.emit(erc721V1AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    const left = Order(
      wallet0.address,
      Asset(ETH, '0x', '200'),
      ZERO,
      Asset(ERC721, enc(ghostERC721.address, erc721TokenId1), '1'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const right = Order(
      wallet1.address,
      Asset(ERC721, enc(ghostERC721.address, erc721TokenId1), '1'),
      ZERO,
      Asset(ETH, '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const signatureRight = await EIP712.sign(right, wallet1.address, exchangeV2Proxy.address);

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      const tx = await matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
        from: wallet0.address,
        value: 300,
      });
      tx.wait();
    } else {
      await verifyBalanceChange(wallet0.address, 206, async () =>
        //200+6buyerFee (72back)
        verifyBalanceChange(wallet1.address, -186, async () =>
          //200 - (6+8royalties)
          verifyBalanceChange(wallet2.address, -6, async () =>
            verifyBalanceChange(wallet3.address, -8, async () =>
              verifyBalanceChange(protocol.address, -6, () =>
                matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                  from: wallet0.address,
                  value: 300,
                  gasPrice: 0,
                })
              )
            )
          )
        )
      );

      expect((await ghostERC721.balanceOf(wallet1.address)).toString()).to.equal('0');
      expect((await ghostERC721.balanceOf(wallet0.address)).toString()).to.equal('1');
    }
  });

  it('should work from ETH(DataV1) to ERC721 2981 royalties standard, NO Origin fees, Royalties', async () => {
    //await erc721WithRoyalties.mint(wallet1.address, [[wallet2.address, 300], [wallet3.address, 400]], "ext_uri", "", "");
    await erc721WithRoyalties.mint(
      wallet1.address,
      wallet2.address,
      300 // 2.50%
    );

    const erc721TokenId1 = '1';
    const erc721V1AsSigner = erc721WithRoyalties.connect(wallet1);

    //test token approval status
    const result = erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    await expect(result)
      .to.emit(erc721V1AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    const left = Order(
      wallet0.address,
      Asset(ETH, '0x', '200'),
      ZERO,
      Asset(ERC721, enc(erc721WithRoyalties.address, erc721TokenId1), '1'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const right = Order(
      wallet1.address,
      Asset(ERC721, enc(erc721WithRoyalties.address, erc721TokenId1), '1'),
      ZERO,
      Asset(ETH, '0x', '200'),
      '1',
      0,
      0,
      '0xffffffff',
      '0x'
    );
    const signatureRight = await EIP712.sign(right, wallet1.address, exchangeV2Proxy.address);

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      const tx = await matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
        from: wallet0.address,
        value: 300,
      });
      tx.wait();
      //console.log("tx: ", tx)
    } else {
      await verifyBalanceChange(wallet0.address, 206, async () =>
        //200+6buyerFee (72back)
        verifyBalanceChange(wallet1.address, -194, async () =>
          //200 - (6+8royalties)
          verifyBalanceChange(wallet2.address, -6, async () =>
            verifyBalanceChange(protocol.address, -6, () =>
              matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                from: wallet0.address,
                value: 300,
                gasPrice: 0,
              })
            )
          )
        )
      );

      expect((await erc721WithRoyalties.balanceOf(wallet1.address)).toString()).to.equal('0');
      expect((await erc721WithRoyalties.balanceOf(wallet0.address)).toString()).to.equal('1');
    }
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol, Origin left and right fees, Royalties', async () => {
    await ghostERC721.mintGhost(
      wallet1.address,
      [
        {recipient: wallet2.address, value: 300},
        {recipient: wallet3.address, value: 400},
      ],
      'ext_uri',
      ''
    );
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const erc721V1AsSigner = ghostERC721.connect(wallet1);

    const result = erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    await expect(result)
      .to.emit(erc721V1AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const addrOriginLeft = [
      [wallet5.address, 500],
      [wallet6.address, 600],
    ];
    const addrOriginRight = [[wallet1.address, 700]];

    //ERC721 token will be transfered to this account
    const encDataLeft = encDataV1JS([[[wallet0.address, 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[[wallet1.address, 10000]], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //TODO fix "BigNumber.toString does not accept any parameters; base-10 is assumed"
    const left = Order(
      wallet0.address,
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

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      const tx = await matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
        from: wallet0.address,
        value: 300,
      });
      tx.wait();
    } else {
      await verifyBalanceChange(wallet0.address, 228, async () =>
        //200 + 6 buyerFee + 22 origin left  (72back)
        verifyBalanceChange(wallet1.address, -186, async () =>
          //200 - (6+8royalties)
          verifyBalanceChange(wallet2.address, -6, async () =>
            verifyBalanceChange(wallet3.address, -8, async () =>
              verifyBalanceChange(wallet6.address, -12, () =>
                verifyBalanceChange(wallet5.address, -10, () =>
                  verifyBalanceChange(protocol.address, -6, () =>
                    matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                      from: wallet0.address,
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

      expect((await ghostERC721.balanceOf(wallet1.address)).toString()).to.equal('0');
      expect((await ghostERC721.balanceOf(wallet0.address)).toString()).to.equal('1');
    }
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol, Origin left fees, no Royalties', async () => {
    const addrOriginLeft = [
      [wallet5.address, 500],
      [wallet6.address, 600],
    ];
    const addrOriginRight: any[] = [];
    const originDataLeft_buyer = [[wallet2.address, 10000]];
    const originDataRight_seller = [[wallet1.address, 10000]];
    await testOriginRoyalties(addrOriginLeft, addrOriginRight, originDataLeft_buyer, originDataRight_seller);
  });

  /*   it("From ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol, Origin left and right fees, no Royalties", async () => {
      let addrOriginLeft = [[wallet5.address, 500], [wallet6.address, 600]];
      let addrOriginRight = [[wallet2.address, 700]];

      let encDataLeft = await encDataV1JS([[[wallet2.address, 10000]], addrOriginLeft]);
      let encDataRight = await encDataV1JS([[[wallet1.address, 10000]], addrOriginRight]);

      await testOriginRoyalties(encDataLeft, encDataRight)

    }) */

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

  it('should work for buy ERC1155 with ETH; protocol fee and royalties', async () => {
    const matchSigner = exchangeV2Proxy.connect(wallet2);

    const {left, right, erc1155TokenId1} = await prepare_ERC_1155V1_Orders();
    const signatureRight = await EIP712.sign(right, wallet1.address, exchangeV2Proxy.address);

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      const tx = await matchSigner.matchOrders(left, '0x', right, signatureRight, {
        from: wallet2.address,
        value: 300,
      });
      tx.wait();
    } else {
      await verifyBalanceChange(wallet2.address, 206, async () =>
        //200 + 6 buyerFee (72back)
        verifyBalanceChange(wallet1.address, -170, async () =>
          //200 seller - 14
          verifyBalanceChange(wallet3.address, -20, async () =>
            verifyBalanceChange(wallet4.address, -10, async () =>
              verifyBalanceChange(protocol.address, -6, () =>
                matchSigner.matchOrders(left, '0x', right, signatureRight, {
                  from: wallet2.address,
                  value: 300,
                  gasPrice: 0,
                })
              )
            )
          )
        )
      );
      expectEqualStringValues(await ghostERC1155.balanceOf(wallet1.address, erc1155TokenId1), 6);
      expectEqualStringValues(await ghostERC1155.balanceOf(wallet2.address, erc1155TokenId1), 4);
    }
  });

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

  async function testOriginRoyalties(
    addrOriginLeft: any[],
    addrOriginRight: any[],
    originDataLeft_buyer: any[],
    originDataRight_seller: any[]
  ) {
    const encDataLeft = await encDataV1JS([originDataLeft_buyer, addrOriginLeft]);
    const encDataRight = await encDataV1JS([originDataRight_seller, addrOriginRight]);

    const royalties: any[] = [];
    const {left, right, signatureRight, matchOrdersSigner} = await prepare721sellingWithOptionalOriginRoyalties(
      encDataLeft,
      encDataRight,
      royalties
    );

    if (hre.network.name == 'testnet' || hre.network.name == 'testnet_nodeploy' || hre.network.name == 'hardhat') {
      const tx = await matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
        from: wallet2.address,
        value: 300,
      });
      tx.wait();
    } else {
      await verifyBalanceChange(wallet2.address, 228, async () =>
        // 200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
        verifyBalanceChange(wallet1.address, -200, async () =>
          // 200
          verifyBalanceChange(protocol.address, -6, () =>
            // protocol fee from buyer
            verifyBalanceChange(wallet6.address, -12, () =>
              // origin fee paid by buyer 6%
              verifyBalanceChange(
                wallet5.address,
                -10,
                () =>
                  // origin fee paid by buyer 5%
                  matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                    from: wallet2.address,
                    value: 300,
                    gasPrice: 0,
                  })
                //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: wallet2.address, value: 300 })
              )
            )
          )
        )
      );
    }
    expect((await ghostERC721.balanceOf(wallet1.address)).toString()).to.equal('0');
    expect((await ghostERC721.balanceOf(wallet2.address)).toString()).to.equal('1');
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
