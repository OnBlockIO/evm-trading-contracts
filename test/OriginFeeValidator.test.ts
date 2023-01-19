/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {
  ERC20TransferProxy,
  TransferProxy,
  ExchangeV2,
  RoyaltiesRegistry,
  GhostMarketERC721,
} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Asset, Order} from './utils/order';
import EIP712 from './utils/EIP712';
import {ZERO, ORDER_DATA_V1, ERC721, ETH, enc} from './utils/assets';
import hre, {ethers, upgrades} from 'hardhat';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL} from './utils/constants';
import {encDataV1JS, verifyBalanceChange} from './utils/helpers';

describe('OriginFeeValidator Test', async function () {
  let addOperator = false;
  let exchangeV2Proxy: ExchangeV2;
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let ghostERC721: GhostMarketERC721;
  let royaltiesRegistryProxy: RoyaltiesRegistry;
  let wallet0: SignerWithAddress;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;
  let wallet5: SignerWithAddress;
  let wallet6: SignerWithAddress;
  let protocol: SignerWithAddress;

  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    wallet0 = accounts[0];
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    wallet5 = accounts[5];
    wallet6 = accounts[6];
    protocol = accounts[1];
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const ExchangeV2Test = await ethers.getContractFactory('ExchangeV2');
    // const GhostMarketTransferManagerTest = await ethers.getContractFactory('GhostMarketTransferManagerTest');
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    const TestGhostERC721 = await ethers.getContractFactory('GhostMarketERC721');
    const TestRoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    addOperator = true;

    transferProxy = await TransferProxyTest.deploy();
    await transferProxy.__TransferProxy_init();

    erc20TransferProxy = await ERC20TransferProxyTest.deploy();
    await erc20TransferProxy.__ERC20TransferProxy_init();

    royaltiesRegistryProxy = await TestRoyaltiesRegistry.deploy();
    await royaltiesRegistryProxy.__RoyaltiesRegistry_init();

    exchangeV2Proxy = <ExchangeV2>await upgrades.deployProxy(
      ExchangeV2Test,
      [transferProxy.address, erc20TransferProxy.address, 300, protocol.address, royaltiesRegistryProxy.address],
      {
        initializer: '__ExchangeV2_init',
        unsafeAllowLinkedLibraries: true,
      }
    );

    // await GhostMarketTransferManagerTest.deploy();
    await TestERC20.deploy();

    ghostERC721 = <GhostMarketERC721>await upgrades.deployProxy(TestGhostERC721, [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI], {
      initializer: 'initialize',
      unsafeAllowCustomTypes: true,
    });

    //fee receiver for Token t1 transfer is the protocol address
    await transferProxy.addOperator(exchangeV2Proxy.address);
    await erc20TransferProxy.addOperator(exchangeV2Proxy.address);

    if (addOperator) {
      await transferProxy.addOperator(exchangeV2Proxy.address);
      await erc20TransferProxy.addOperator(exchangeV2Proxy.address);
    }
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol, Origin fees only left, no Royalties', async () => {
    await ghostERC721.mintGhost(wallet1.address, [], 'ext_uri', '');
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    const result = ghostERC721AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    //test token approval status
    await expect(result)
      .to.emit(ghostERC721AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const addrOriginLeft = [
      [wallet5.address, 500],
      [wallet6.address, 600],
    ];
    const addrOriginRight = [[wallet1.address, 700]]; // same as addrOriginRight = [] because wallet1.address is seller and buyer

    const encDataLeft = encDataV1JS([[[wallet0.address, 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[[wallet1.address, 10000]], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
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
        //200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
        verifyBalanceChange(wallet1.address, -200, async () =>
          //200 (-14 +14 origin fee from right => origin fee acount = seller/minter account )
          verifyBalanceChange(protocol.address, -6, () =>
            verifyBalanceChange(wallet6.address, -12, () =>
              verifyBalanceChange(
                wallet5.address,
                -10,
                () =>
                  matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                    from: wallet0.address,
                    value: 300,
                    gasPrice: 0,
                  })
                //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: wallet0.address, value: 300 })
              )
            )
          )
        )
      );

      expect((await ghostERC721.balanceOf(wallet1.address)).toString()).to.equal('0');
      expect((await ghostERC721.balanceOf(wallet0.address)).toString()).to.equal('1');
    }
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol, Origin fees from left and right, no Royalties,', async () => {
    await ghostERC721.mintGhost(wallet1.address, [], 'ext_uri', '');
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    const result = ghostERC721AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    //test token approval status
    await expect(result)
      .to.emit(ghostERC721AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const addrOriginLeft = [
      [wallet5.address, 500],
      [wallet6.address, 600],
    ];
    const addrOriginRight = [[wallet2.address, 700]];

    const encDataLeft = encDataV1JS([[[wallet0.address, 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[[wallet1.address, 10000]], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
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
        //200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
        verifyBalanceChange(wallet1.address, -186, async () =>
          //200 (- 14 origin fee right)
          verifyBalanceChange(protocol.address, -6, () =>
            verifyBalanceChange(wallet6.address, -12, () =>
              verifyBalanceChange(wallet5.address, -10, () =>
                verifyBalanceChange(
                  wallet2.address,
                  -14,
                  () =>
                    matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                      from: wallet0.address,
                      value: 300,
                      gasPrice: 0,
                    })
                  //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: wallet0.address, value: 300 })
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

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol, Origin fees, with Royalties,', async () => {
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
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    const result = ghostERC721AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    //test token approval status
    await expect(result)
      .to.emit(ghostERC721AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const addrOriginLeft = [
      [wallet5.address, 500],
      [wallet6.address, 600],
    ];
    const addrOriginRight: any[] = [];

    const encDataLeft = encDataV1JS([[[wallet0.address, 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[[wallet1.address, 10000]], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
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
        //200 + 6 buyerFee + (10+12 origin left) - (72 back payment)
        verifyBalanceChange(wallet1.address, -186, async () =>
          //200 - (10+12 royalties
          verifyBalanceChange(protocol.address, -6, () =>
            verifyBalanceChange(wallet6.address, -12, () =>
              verifyBalanceChange(wallet5.address, -10, () =>
                verifyBalanceChange(wallet2.address, -6, () =>
                  verifyBalanceChange(
                    wallet3.address,
                    -8,
                    () =>
                      matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                        from: wallet0.address,
                        value: 300,
                        gasPrice: 0,
                      })
                    //matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: wallet0.address, value: 300 })
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

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Protocol fee, 1 Origin fee address, 1 Royalties address', async () => {
    //set protocol fee to 2%
    // exchangeV2Proxy.setProtocolFee(200);

    await ghostERC721.mintGhost(wallet1.address, [{recipient: wallet6.address, value: 1000}], 'ext_uri', '');
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    const result = ghostERC721AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    //test token approval status
    await expect(result)
      .to.emit(ghostERC721AsSigner, 'ApprovalForAll')
      .withArgs(wallet1.address, transferProxy.address, true);

    const addrOriginLeft = [[wallet5.address, 300]];
    const addrOriginRight: any[] = [];

    const encDataLeft = encDataV1JS([[[wallet0.address, 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
    const left = Order(
      wallet0.address,
      Asset(ETH, '0x', '100'),
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
      Asset(ETH, '0x', '100'),
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
      await verifyBalanceChange(wallet0.address, 105, async () =>
        // 100 + (2 protocol fee) + (3 origin fee)
        verifyBalanceChange(wallet1.address, -90, async () =>
          // 100 - (10 royalties)
          verifyBalanceChange(protocol.address, -2, () =>
            verifyBalanceChange(wallet6.address, -10, () =>
              verifyBalanceChange(wallet5.address, -3, () =>
                matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                  from: wallet0.address,
                  value: 105,
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
});
