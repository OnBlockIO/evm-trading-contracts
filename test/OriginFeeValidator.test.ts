/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {ERC20TransferProxy, TransferProxy, ExchangeV2, RoyaltiesRegistry, GhostMarketERC721} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {Asset, Order} from './utils/order';
import EIP712 from './utils/EIP712';
import {ZERO, ORDER_DATA_V1, ERC721, ETH, enc} from './utils/assets';
import {ethers, upgrades} from 'hardhat';
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

    exchangeV2Proxy = <ExchangeV2>(<unknown>await upgrades.deployProxy(
      ExchangeV2Test,
      [
        await transferProxy.getAddress(),
        await erc20TransferProxy.getAddress(),
        300,
        await protocol.getAddress(),
        await royaltiesRegistryProxy.getAddress(),
      ],
      {
        initializer: '__ExchangeV2_init',
        unsafeAllowLinkedLibraries: true,
      }
    ));

    await TestERC20.deploy();

    ghostERC721 = <GhostMarketERC721>(<unknown>await upgrades.deployProxy(
      TestGhostERC721,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    ));

    await transferProxy.addOperator(await exchangeV2Proxy.getAddress());
    await erc20TransferProxy.addOperator(await exchangeV2Proxy.getAddress());

    if (addOperator) {
      await transferProxy.addOperator(await exchangeV2Proxy.getAddress());
      await erc20TransferProxy.addOperator(await exchangeV2Proxy.getAddress());
    }
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Origin fees only left, no Royalties', async () => {
    await ghostERC721.mintGhost(await wallet1.getAddress(), [], 'ext_uri', '');
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    await ghostERC721AsSigner.setApprovalForAll(await transferProxy.getAddress(), true, {
      from: await wallet1.getAddress(),
    });
    //test token approval status
    const filter = ghostERC721AsSigner.filters.ApprovalForAll;
    const events = await ghostERC721AsSigner.queryFilter(filter, -1);
    const event = events[0];
    expect(event.fragment.name).to.equal('ApprovalForAll');
    const args = event.args;
    expect(Array(args)).to.deep.equal(Array([await wallet1.getAddress(), await transferProxy.getAddress(), true]));

    const addrOriginLeft = [
      [await wallet5.getAddress(), 500],
      [await wallet6.getAddress(), 600],
    ];
    const addrOriginRight = [[await wallet1.getAddress(), 700]]; // same as addrOriginRight = [] because await wallet1.getAddress() is seller and buyer

    const encDataLeft = encDataV1JS([[[await wallet0.getAddress(), 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[[await wallet1.getAddress(), 10000]], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
    const left = Order(
      await wallet0.getAddress(),
      Asset(ETH, '0x', '200'),
      ZERO,
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataLeft
    );
    const right = Order(
      await wallet1.getAddress(),
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      ZERO,
      Asset(ETH, '0x', '200'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataRight
    );
    const signatureRight = await EIP712.sign(right, await wallet1.getAddress(), await exchangeV2Proxy.getAddress());

    await verifyBalanceChange(await wallet0.getAddress(), 222, async () =>
      //300 + (10+12 origin left) - (100 back payment)
      verifyBalanceChange(await wallet1.getAddress(), -200, async () =>
        //200 (-14 +14 origin fee from right => origin fee acount = seller/minter account )
        verifyBalanceChange(await wallet6.getAddress(), -12, async () =>
          verifyBalanceChange(await wallet5.getAddress(), -10, async () =>
            matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
              from: await wallet0.getAddress(),
              value: 300,
              gasPrice: 0,
            })
          )
        )
      )
    );

    expect((await ghostERC721.balanceOf(await wallet1.getAddress())).toString()).to.equal('0');
    expect((await ghostERC721.balanceOf(await wallet0.getAddress())).toString()).to.equal('1');
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Origin fees from left and right, no Royalties,', async () => {
    await ghostERC721.mintGhost(await wallet1.getAddress(), [], 'ext_uri', '');
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    await ghostERC721AsSigner.setApprovalForAll(await transferProxy.getAddress(), true, {
      from: await wallet1.getAddress(),
    });
    const filter = ghostERC721AsSigner.filters.ApprovalForAll;
    const events = await ghostERC721AsSigner.queryFilter(filter, -1);
    const event = events[0];
    expect(event.fragment.name).to.equal('ApprovalForAll');
    const args = event.args;
    expect(Array(args)).to.deep.equal(Array([await wallet1.getAddress(), await transferProxy.getAddress(), true]));

    const addrOriginLeft = [
      [await wallet5.getAddress(), 500],
      [await wallet6.getAddress(), 600],
    ];
    const addrOriginRight = [[await wallet2.getAddress(), 700]];

    const encDataLeft = encDataV1JS([[[await wallet0.getAddress(), 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[[await wallet1.getAddress(), 10000]], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
    const left = Order(
      await wallet0.getAddress(),
      Asset(ETH, '0x', '200'),
      ZERO,
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataLeft
    );
    const right = Order(
      await wallet1.getAddress(),
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      ZERO,
      Asset(ETH, '0x', '200'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataRight
    );
    const signatureRight = await EIP712.sign(right, await wallet1.getAddress(), await exchangeV2Proxy.getAddress());

    await verifyBalanceChange(await wallet0.getAddress(), 222, async () =>
      //300 + (10+12 origin left) - (100 back payment)
      verifyBalanceChange(await wallet1.getAddress(), -186, async () =>
        //200 (- 14 origin fee right)
        verifyBalanceChange(await wallet6.getAddress(), -12, async () =>
          verifyBalanceChange(await wallet5.getAddress(), -10, async () =>
            verifyBalanceChange(await wallet2.getAddress(), -14, async () =>
              matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                from: await wallet0.getAddress(),
                value: 300,
                gasPrice: 0,
              })
            )
          )
        )
      )
    );

    expect((await ghostERC721.balanceOf(await wallet1.getAddress())).toString()).to.equal('0');
    expect((await ghostERC721.balanceOf(await wallet0.getAddress())).toString()).to.equal('1');
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Origin fees, with Royalties,', async () => {
    await ghostERC721.mintGhost(
      await wallet1.getAddress(),
      [
        {recipient: await wallet2.getAddress(), value: 300},
        {recipient: await wallet3.getAddress(), value: 400},
      ],
      'ext_uri',
      ''
    );
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    await ghostERC721AsSigner.setApprovalForAll(await transferProxy.getAddress(), true, {
      from: await wallet1.getAddress(),
    });
    const filter = ghostERC721AsSigner.filters.ApprovalForAll;
    const events = await ghostERC721AsSigner.queryFilter(filter, -1);
    const event = events[0];
    expect(event.fragment.name).to.equal('ApprovalForAll');
    const args = event.args;
    expect(Array(args)).to.deep.equal(Array([await wallet1.getAddress(), await transferProxy.getAddress(), true]));

    const addrOriginLeft = [
      [await wallet5.getAddress(), 500],
      [await wallet6.getAddress(), 600],
    ];
    const addrOriginRight: any[] = [];

    const encDataLeft = encDataV1JS([[[await wallet0.getAddress(), 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[[await wallet1.getAddress(), 10000]], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
    const left = Order(
      await wallet0.getAddress(),
      Asset(ETH, '0x', '200'),
      ZERO,
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataLeft
    );
    const right = Order(
      await wallet1.getAddress(),
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      ZERO,
      Asset(ETH, '0x', '200'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataRight
    );
    const signatureRight = await EIP712.sign(right, await wallet1.getAddress(), await exchangeV2Proxy.getAddress());

    await verifyBalanceChange(await wallet0.getAddress(), 222, async () =>
      //300 + (10+12 origin left) - (100 back payment)
      verifyBalanceChange(await wallet1.getAddress(), -186, async () =>
        //200 - (6+8 royalties)
        verifyBalanceChange(await wallet6.getAddress(), -12, async () =>
          verifyBalanceChange(await wallet5.getAddress(), -10, async () =>
            verifyBalanceChange(await wallet2.getAddress(), -6, async () =>
              verifyBalanceChange(await wallet3.getAddress(), -8, async () =>
                matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
                  from: await wallet0.getAddress(),
                  value: 300,
                  gasPrice: 0,
                })
              )
            )
          )
        )
      )
    );

    expect((await ghostERC721.balanceOf(await wallet1.getAddress())).toString()).to.equal('0');
    expect((await ghostERC721.balanceOf(await wallet0.getAddress())).toString()).to.equal('1');
  });

  it('should work from ETH(DataV1) to ERC721(RoyaltiesV1, DataV1) Origin fee, with Royalties', async () => {
    await ghostERC721.mintGhost(
      await wallet1.getAddress(),
      [{recipient: await wallet6.getAddress(), value: 1000}],
      'ext_uri',
      ''
    );
    const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
    const ghostERC721AsSigner = ghostERC721.connect(wallet1);

    await ghostERC721AsSigner.setApprovalForAll(await transferProxy.getAddress(), true, {
      from: await wallet1.getAddress(),
    });

    const filter = ghostERC721AsSigner.filters.ApprovalForAll;
    const events = await ghostERC721AsSigner.queryFilter(filter, -1);
    const event = events[0];
    expect(event.fragment.name).to.equal('ApprovalForAll');
    const args = event.args;
    expect(Array(args)).to.deep.equal(Array([await wallet1.getAddress(), await transferProxy.getAddress(), true]));

    const addrOriginLeft = [[await wallet5.getAddress(), 300]];
    const addrOriginRight: any[] = [];

    const encDataLeft = encDataV1JS([[[await wallet0.getAddress(), 10000]], addrOriginLeft]);
    const encDataRight = encDataV1JS([[], addrOriginRight]);

    const matchOrdersSigner = exchangeV2Proxy.connect(wallet0);

    //origin fee is only working if ORDER_DATA_V1 is passed
    const left = Order(
      await wallet0.getAddress(),
      Asset(ETH, '0x', '100'),
      ZERO,
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataLeft
    );
    const right = Order(
      await wallet1.getAddress(),
      Asset(ERC721, enc(await ghostERC721.getAddress(), erc721TokenId1), '1'),
      ZERO,
      Asset(ETH, '0x', '100'),
      '1',
      0,
      0,
      ORDER_DATA_V1,
      encDataRight
    );
    const signatureRight = await EIP712.sign(right, await wallet1.getAddress(), await exchangeV2Proxy.getAddress());

    await verifyBalanceChange(await wallet0.getAddress(), 103, async () =>
      // 100 + (3 origin fee)
      verifyBalanceChange(await wallet1.getAddress(), -90, async () =>
        // 100 - (10 royalties)
        verifyBalanceChange(await wallet6.getAddress(), -10, async () =>
          verifyBalanceChange(await wallet5.getAddress(), -3, async () =>
            matchOrdersSigner.matchOrders(left, '0x', right, signatureRight, {
              from: await wallet0.getAddress(),
              value: 105,
              gasPrice: 0,
            })
          )
        )
      )
    );
    expect((await ghostERC721.balanceOf(await wallet1.getAddress())).toString()).to.equal('0');
    expect((await ghostERC721.balanceOf(await wallet0.getAddress())).toString()).to.equal('1');
  });
});
