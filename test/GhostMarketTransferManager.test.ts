/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {
  ERC20TransferProxy,
  TransferProxy,
  RoyaltiesRegistry,
  TestERC20,
  TestERC721RoyaltiesV2,
  TestERC1155RoyaltiesV2,
  GhostMarketTransferManagerTest,
  ERC721LazyMintTest,
  ERC721LazyMintTransferProxy,
  ERC1155LazyMintTransferProxy,
  ERC1155LazyMintTest,
} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Asset, Order} from './utils/order';
import {ZERO, ORDER_DATA_V1, ERC721, ERC1155, ERC20, ETH, enc, id} from './utils/assets';
import {ethers, upgrades} from 'hardhat';
import {verifyBalanceChange} from './utils/helpers';

describe('GhostMarketTransferManager Test', async function () {
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let royaltiesRegistryProxy: RoyaltiesRegistry;
  let gtm: GhostMarketTransferManagerTest;
  let testERC20: TestERC20;
  let erc721_lazy: ERC721LazyMintTest;
  let erc1155_lazy: ERC1155LazyMintTest;
  let erc721_lazy_proxy: ERC721LazyMintTransferProxy;
  let erc1155_lazy_proxy: ERC1155LazyMintTransferProxy;
  let erc721WithRoyalties: TestERC721RoyaltiesV2;
  let erc1155WithRoyalties: TestERC1155RoyaltiesV2;
  let wallet0: SignerWithAddress;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;
  let wallet4: SignerWithAddress;
  let wallet5: SignerWithAddress;
  let wallet6: SignerWithAddress;
  let community: SignerWithAddress;
  let protocol: SignerWithAddress;
  const erc721TokenId0 = '52';
  const erc721TokenId1 = '53';
  const erc1155TokenId1 = '54';
  const erc1155TokenId2 = '55';

  before(async function () {
    const accounts = await ethers.getSigners();
    wallet0 = accounts[0];
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    wallet4 = accounts[4];
    wallet5 = accounts[5];
    wallet6 = accounts[6];
    community = accounts[8];
    protocol = accounts[9];
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    const GTM = await ethers.getContractFactory('GhostMarketTransferManagerTest');
    const ERC721LazyMintTest = await ethers.getContractFactory('ERC721LazyMintTest');
    const ERC1155LazyMintTest = await ethers.getContractFactory('ERC1155LazyMintTest');
    const ERC721LazyMintTransferProxy = await ethers.getContractFactory('ERC721LazyMintTransferProxy');
    const ERC1155LazyMintTransferProxy = await ethers.getContractFactory('ERC1155LazyMintTransferProxy');
    const ERC721WithRoyalties = await ethers.getContractFactory('TestERC721RoyaltiesV2');
    const ERC1155WithRoyalties = await ethers.getContractFactory('TestERC1155RoyaltiesV2');

    transferProxy = await TransferProxyTest.deploy();
    await transferProxy.__TransferProxy_init();

    erc20TransferProxy = await ERC20TransferProxyTest.deploy();
    await erc20TransferProxy.__ERC20TransferProxy_init();

    royaltiesRegistryProxy = await RoyaltiesRegistry.deploy();
    await royaltiesRegistryProxy.__RoyaltiesRegistry_init();

    gtm = <GhostMarketTransferManagerTest>(
      await upgrades.deployProxy(
        GTM,
        [transferProxy.address, erc20TransferProxy.address, 300, community.address, royaltiesRegistryProxy.address],
        {initializer: 'init____'}
      )
    );

    await transferProxy.addOperator(gtm.address);
    await erc20TransferProxy.addOperator(gtm.address);

    erc721_lazy_proxy = await ERC721LazyMintTransferProxy.deploy();
    await erc721_lazy_proxy.__OperatorRole_init();
    await erc721_lazy_proxy.addOperator(gtm.address);
    erc1155_lazy_proxy = await ERC1155LazyMintTransferProxy.deploy();
    await erc1155_lazy_proxy.__OperatorRole_init();
    await erc1155_lazy_proxy.addOperator(gtm.address);
    erc721_lazy = await ERC721LazyMintTest.deploy();
    erc1155_lazy = await ERC1155LazyMintTest.deploy();

    erc721WithRoyalties = await ERC721WithRoyalties.deploy();
    erc1155WithRoyalties = await ERC1155WithRoyalties.deploy();
  });

  describe('doTransfersExternal', () => {
    it('should work for transfer from ETH to ERC721', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc721 = await prepareERC721(wallet2);
        const left = Order(
          wallet1.address,
          Asset(ETH, '0x', '100'),
          ZERO,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          ZERO,
          Asset(ETH, '0x', '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        const asSigner = gtm.connect(wallet1);
        await verifyBalanceChange(wallet1.address, 100, () =>
          verifyBalanceChange(wallet2.address, -100, () =>
            verifyBalanceChange(protocol.address, 0, async () =>
              asSigner.doTransfersExternal(left, right, {value: 100, from: wallet1.address, gasPrice: 0})
            )
          )
        );
        expect((await erc721.balanceOf(wallet1.address)).toString()).to.equal('1');
        expect((await erc721.balanceOf(wallet2.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ETH to ERC1155', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc1155 = await prepareERC1155(wallet2, '10');
        const left = Order(
          wallet1.address,
          Asset(ETH, '0x', '100'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
          ZERO,
          Asset(ETH, '0x', '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        const asSigner = gtm.connect(wallet1);
        await verifyBalanceChange(wallet1.address, 100, () =>
          verifyBalanceChange(wallet2.address, -100, () =>
            verifyBalanceChange(protocol.address, 0, async () =>
              asSigner.doTransfersExternal(left, right, {value: 100, from: wallet1.address, gasPrice: 0})
            )
          )
        );
        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('7');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).toString()).to.equal('3');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ETH to ERC20', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet2, '105');
        const left = Order(
          wallet1.address,
          Asset(ETH, '0x', '100'),
          ZERO,
          Asset(ERC20, enc(erc20.address, erc721TokenId1), '50'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC20, enc(erc20.address, erc721TokenId1), '50'),
          ZERO,
          Asset(ETH, '0x', '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        const asSigner = gtm.connect(wallet1);
        await verifyBalanceChange(wallet1.address, 100, () =>
          verifyBalanceChange(wallet2.address, -100, () =>
            verifyBalanceChange(protocol.address, 0, async () =>
              asSigner.doTransfersExternal(left, right, {value: 100, from: wallet1.address, gasPrice: 0})
            )
          )
        );
        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('50');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('55');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC721 to ERC721', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc721 = await prepareERC721(wallet1);

        await erc721.mint(wallet2.address, erc721TokenId0, []);
        const asSigner2 = erc721.connect(wallet2);
        await asSigner2.setApprovalForAll(transferProxy.address, true, {from: wallet2.address});

        const data = await encDataV1([[], []]);
        const left = Order(
          wallet1.address,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          ZERO,
          Asset(ERC721, enc(erc721.address, erc721TokenId0), '1'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          data
        );
        const right = Order(
          wallet2.address,
          Asset(ERC721, enc(erc721.address, erc721TokenId0), '1'),
          ZERO,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          data
        );

        await gtm.doTransfersExternal(left, right);
        expect((await erc721.ownerOf(erc721TokenId1)).toString()).to.equal(wallet2.address);
        expect((await erc721.ownerOf(erc721TokenId0)).toString()).to.equal(wallet1.address);
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC721 to ERC1155, (buyerFee4%, sellerFee6%), orders dataType == V1', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc721 = await prepareERC721(wallet1);
        const erc1155 = await prepareERC1155(wallet2, '120');
        const addrOriginLeft = [
          [wallet3.address, 100],
          [wallet5.address, 300],
        ];
        const addrOriginRight = [
          [wallet4.address, 200],
          [wallet6.address, 400],
        ];
        const encDataLeft = await encDataV1([[[wallet1.address, 10000]], addrOriginLeft]);
        const encDataRight = await encDataV1([[[wallet2.address, 10000]], addrOriginRight]);
        const left = Order(
          wallet1.address,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          encDataLeft
        );
        const right = Order(
          wallet2.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
          ZERO,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          encDataRight
        );

        const asSigner = gtm.connect(wallet1);
        await asSigner.doTransfersExternal(left, right);

        expect((await erc721.balanceOf(wallet1.address)).toString()).to.equal('0');
        expect((await erc721.balanceOf(wallet2.address)).toString()).to.equal('1');
        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('96');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).toString()).to.equal('14');
        expect((await erc1155.balanceOf(community.address, erc1155TokenId1)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC1155 to ERC1155: 2 to 10, 50% 50% for payouts', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc1155 = await prepareERC1155(wallet1, '100');
        await erc1155.mint(wallet2.address, erc1155TokenId2, 100, []);
        const asSigner = erc1155.connect(wallet2);
        await asSigner.setApprovalForAll(transferProxy.address, true, {from: wallet2.address});

        const encDataLeft = await encDataV1([
          [
            [wallet3.address, 5000],
            [wallet5.address, 5000],
          ],
          [],
        ]);
        const encDataRight = await encDataV1([
          [
            [wallet4.address, 5000],
            [wallet6.address, 5000],
          ],
          [],
        ]);
        const left = Order(
          wallet1.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '2'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '10'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          encDataLeft
        );
        const right = Order(
          wallet2.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '10'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '2'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          encDataRight
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('98');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).toString()).to.equal('0');
        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId2)).toString()).to.equal('0');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId2)).toString()).to.equal('90');

        expect((await erc1155.balanceOf(wallet3.address, erc1155TokenId2)).toString()).to.equal('5');
        expect((await erc1155.balanceOf(wallet5.address, erc1155TokenId2)).toString()).to.equal('5');
        expect((await erc1155.balanceOf(wallet4.address, erc1155TokenId1)).toString()).to.equal('1');
        expect((await erc1155.balanceOf(wallet6.address, erc1155TokenId1)).toString()).to.equal('1');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work but rounding error transfer from ERC1155 to ERC1155: 1 to 5, 50% 50% for payouts', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc1155 = await prepareERC1155(wallet1, '100');

        await erc1155.mint(wallet2.address, erc1155TokenId2, 100, []);
        const asSigner = erc1155.connect(wallet2);
        await asSigner.setApprovalForAll(transferProxy.address, true, {from: wallet2.address});
        const encDataLeft = await encDataV1([
          [
            [wallet3.address, 5000],
            [wallet5.address, 5000],
          ],
          [],
        ]);
        const encDataRight = await encDataV1([
          [
            [wallet4.address, 5000],
            [wallet6.address, 5000],
          ],
          [],
        ]);
        const left = Order(
          wallet1.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '1'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '5'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          encDataLeft
        );
        const right = Order(
          wallet2.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '5'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '1'),
          '1',
          0,
          0,
          ORDER_DATA_V1,
          encDataRight
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('99');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).toString()).to.equal('0');
        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId2)).toString()).to.equal('0');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId2)).toString()).to.equal('95');

        expect((await erc1155.balanceOf(wallet3.address, erc1155TokenId2)).toString()).to.equal('2');
        expect((await erc1155.balanceOf(wallet5.address, erc1155TokenId2)).toString()).to.equal('3');
        expect((await erc1155.balanceOf(wallet4.address, erc1155TokenId1)).toString()).to.equal('0');
        expect((await erc1155.balanceOf(wallet6.address, erc1155TokenId1)).toString()).to.equal('1');
        expect((await erc1155.balanceOf(community.address, erc1155TokenId1)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC1155 to ERC721', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc721 = await prepareERC721(wallet2);
        const erc1155 = await prepareERC1155(wallet1, '105');

        const left = Order(
          wallet1.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
          ZERO,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc721.balanceOf(wallet2.address)).toString()).to.equal('0');
        expect((await erc721.balanceOf(wallet1.address)).toString()).to.equal('1');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).toString()).to.equal('100');
        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('5');
        expect((await erc1155.balanceOf(protocol.address, erc1155TokenId1)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC20 to ERC1155', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet1, '105');
        const erc1155 = await prepareERC1155(wallet2, '10');

        const left = Order(
          wallet1.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), '7'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('5');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('100');
        expect((await erc1155.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('7');
        expect((await erc1155.balanceOf(wallet2.address, erc1155TokenId1)).toString()).to.equal('3');
        expect((await erc20.balanceOf(protocol.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC1155 to ERC20', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet4, '105');
        const erc1155 = await prepareERC1155(wallet3, '10', erc1155TokenId2);

        const left = Order(
          wallet3.address,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '7'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet4.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), '7'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc20.balanceOf(wallet3.address)).toString()).to.equal('100');
        expect((await erc20.balanceOf(wallet4.address)).toString()).to.equal('5');
        expect((await erc1155.balanceOf(wallet3.address, erc1155TokenId2)).toString()).to.equal('3');
        expect((await erc1155.balanceOf(wallet4.address, erc1155TokenId2)).toString()).to.equal('7');
        expect((await erc20.balanceOf(protocol.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC20 to ERC721', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet1, '105');
        const erc721 = await prepareERC721(wallet2);

        const left = Order(
          wallet1.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('5');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('100');
        expect((await erc721.balanceOf(wallet1.address)).toString()).to.equal('1');
        expect((await erc721.balanceOf(wallet2.address)).toString()).to.equal('0');
        expect((await erc20.balanceOf(protocol.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC721 to ERC20', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet2, '105');
        const erc721 = await prepareERC721(wallet1);

        const left = Order(
          wallet1.address,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(ERC721, enc(erc721.address, erc721TokenId1), '1'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('100');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('5');
        expect((await erc721.balanceOf(wallet1.address)).toString()).to.equal('0');
        expect((await erc721.balanceOf(wallet2.address)).toString()).to.equal('1');
        expect((await erc20.balanceOf(protocol.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC20 to ERC20', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet1, '105');
        const t2 = await prepareERC20(wallet2, '220');

        const left = Order(
          wallet1.address,
          Asset(ERC20, enc(erc20.address), '100'),
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
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('5');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('100');
        expect((await t2.balanceOf(wallet1.address)).toString()).to.equal('200');
        expect((await t2.balanceOf(wallet2.address)).toString()).to.equal('20');
        expect((await erc20.balanceOf(protocol.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });
  });

  describe('lazy with royalties', () => {
    it('should work for transfer from ERC721Lazy to ERC20 ', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        await gtm.setTransferProxy(id('ERC721_LAZY'), erc721_lazy_proxy.address);

        const erc20 = await prepareERC20(wallet2, '106');

        const encodedMintData = await erc721_lazy.encode({
          tokenId: 1,
          tokenURI: 'uri',
          minter: wallet1.address,
          royalties: [
            {account: wallet5.address, value: '2000'},
            {account: wallet6.address, value: '1000'},
          ],
          signature: [],
        });

        const left = Order(
          wallet1.address,
          Asset(id('ERC721_LAZY'), encodedMintData, '1'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(id('ERC721_LAZY'), encodedMintData, '1'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc721_lazy.ownerOf(1)).toString()).to.equal(wallet2.address);
        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('70');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('6');
        expect((await erc20.balanceOf(wallet5.address)).toString()).to.equal('20');
        expect((await erc20.balanceOf(wallet6.address)).toString()).to.equal('10');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC1155Lazy to ERC20 ', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        await gtm.setTransferProxy(id('ERC1155_LAZY'), erc1155_lazy_proxy.address);

        const erc20 = await prepareERC20(wallet2, '106');

        const encodedMintData = await erc1155_lazy.encode({
          tokenId: 1,
          tokenURI: 'uri',
          amount: 5,
          minter: wallet1.address,
          royalties: [
            {account: wallet5.address, value: '2000'},
            {account: wallet6.address, value: '1000'},
          ],
          signature: [],
        });

        const left = Order(
          wallet1.address,
          Asset(id('ERC1155_LAZY'), encodedMintData, '5'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(id('ERC1155_LAZY'), encodedMintData, '5'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc1155_lazy.balanceOf(wallet2.address, 1)).toString()).to.equal('5');
        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('70');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('6');
        expect((await erc20.balanceOf(wallet5.address)).toString()).to.equal('20');
        expect((await erc20.balanceOf(wallet6.address)).toString()).to.equal('10');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ETH to ERC721Lazy', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        await gtm.setTransferProxy(id('ERC721_LAZY'), erc721_lazy_proxy.address);
        const encodedMintData = await erc721_lazy.encode({
          tokenId: 1,
          tokenURI: 'uri',
          minter: wallet2.address,
          royalties: [
            {account: wallet5.address, value: '2000'},
            {account: wallet6.address, value: '1000'},
          ],
          signature: [],
        });

        const left = Order(
          wallet1.address,
          Asset(ETH, '0x', '100'),
          ZERO,
          Asset(id('ERC721_LAZY'), encodedMintData, '1'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(id('ERC721_LAZY'), encodedMintData, '1'),
          ZERO,
          Asset(ETH, '0x', '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        const asSigner = gtm.connect(wallet1);
        await verifyBalanceChange(wallet1.address, 100, () =>
          verifyBalanceChange(wallet2.address, -70, () =>
            verifyBalanceChange(wallet5.address, -20, () =>
              verifyBalanceChange(wallet6.address, -10, () =>
                verifyBalanceChange(protocol.address, 0, () =>
                  asSigner.doTransfersExternal(left, right, {value: 100, from: wallet1.address, gasPrice: 0})
                )
              )
            )
          )
        );
        expect((await erc721_lazy.ownerOf(1)).toString()).to.equal(wallet1.address);
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ETH to ERC1155Lazy', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        await gtm.setTransferProxy(id('ERC1155_LAZY'), erc1155_lazy_proxy.address);
        const encodedMintData = await erc1155_lazy.encode({
          tokenId: 1,
          tokenURI: 'uri',
          amount: 5,
          minter: wallet2.address,
          royalties: [
            {account: wallet5.address, value: '2000'},
            {account: wallet6.address, value: '1000'},
          ],
          signature: [],
        });

        const left = Order(
          wallet1.address,
          Asset(ETH, '0x', '100'),
          ZERO,
          Asset(id('ERC1155_LAZY'), encodedMintData, '5'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet2.address,
          Asset(id('ERC1155_LAZY'), encodedMintData, '5'),
          ZERO,
          Asset(ETH, '0x', '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        const asSigner = gtm.connect(wallet1);
        await verifyBalanceChange(wallet1.address, 100, () =>
          verifyBalanceChange(wallet2.address, -70, () =>
            verifyBalanceChange(wallet5.address, -20, () =>
              verifyBalanceChange(wallet6.address, -10, () =>
                verifyBalanceChange(protocol.address, 0, () =>
                  asSigner.doTransfersExternal(left, right, {value: 100, from: wallet1.address, gasPrice: 0})
                )
              )
            )
          )
        );
        expect((await erc1155_lazy.balanceOf(wallet1.address, 1)).toString()).to.equal('5');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });
  });

  describe('doTransfersExternal with royalties fees', () => {
    it('should work for transfer from ERC20 to ERC721, royalties 15%', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet1, '105');
        const erc721V2 = await prepareERC721(wallet0, erc721TokenId1);

        await royaltiesRegistryProxy.setRoyaltiesByToken(erc721V2.address, [
          [wallet2.address, 1000],
          [wallet3.address, 500],
        ] as any);

        const left = Order(
          wallet1.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(ERC721, enc(erc721V2.address, erc721TokenId1), '1'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet0.address,
          Asset(ERC721, enc(erc721V2.address, erc721TokenId1), '1'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('5');
        expect((await erc20.balanceOf(wallet0.address)).toString()).to.equal('85');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('10');
        expect((await erc20.balanceOf(wallet3.address)).toString()).to.equal('5');
        expect((await erc721V2.balanceOf(wallet1.address)).toString()).to.equal('1');
        expect((await erc721V2.balanceOf(wallet0.address)).toString()).to.equal('0');
        expect((await erc20.balanceOf(protocol.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ERC20 to ERC1155, royalties 15%', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet1, '105');
        const erc1155V2 = await prepareERC1155(wallet0, '8');

        await royaltiesRegistryProxy.setRoyaltiesByToken(erc1155V2.address, [
          [wallet2.address, 1000],
          [wallet3.address, 500],
        ] as any);

        const left = Order(
          wallet1.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), '6'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet0.address,
          Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), '6'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await gtm.doTransfersExternal(left, right);

        expect((await erc20.balanceOf(wallet1.address)).toString()).to.equal('5');
        expect((await erc20.balanceOf(wallet0.address)).toString()).to.equal('85');
        expect((await erc20.balanceOf(wallet2.address)).toString()).to.equal('10');
        expect((await erc20.balanceOf(wallet3.address)).toString()).to.equal('5');
        expect((await erc1155V2.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('6');
        expect((await erc1155V2.balanceOf(wallet0.address, erc1155TokenId1)).toString()).to.equal('2');
        expect((await erc20.balanceOf(protocol.address)).toString()).to.equal('0');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should fail for transfer from ERC20 to ERC1155, royalties are too high', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc20 = await prepareERC20(wallet1, '105');
        const erc1155V2 = await prepareERC1155(wallet0, '8');

        await royaltiesRegistryProxy.setRoyaltiesByToken(erc1155V2.address, [
          [wallet2.address, 2000],
          [wallet3.address, 3001],
        ] as any); //set royalties by token
        const left = Order(
          wallet1.address,
          Asset(ERC20, enc(erc20.address), '100'),
          ZERO,
          Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), '6'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet0.address,
          Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), '6'),
          ZERO,
          Asset(ERC20, enc(erc20.address), '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        const tx = gtm.doTransfersExternal(left, right);

        await expect(tx).to.be.reverted; // Royalties are too high (>50%)
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });

    it('should work for transfer from ETH to ERC1155V2, 15% royalties', async () => {
      const snapshot = await ethers.provider.send('evm_snapshot', []);
      try {
        const erc1155V2 = await prepareERC1155(wallet1, '10', undefined, [
          [wallet2.address, 1000],
        ] as any);

        const info = await erc1155V2.royaltyInfo(erc1155TokenId1, '1000');
        expect(info[1].toNumber()).to.be.equal(100);
        expect(info[0]).to.be.equal(wallet2.address);

        await royaltiesRegistryProxy.setRoyaltiesByToken(erc1155V2.address, [
          [wallet2.address, 1000],
          [wallet3.address, 500],
        ] as any);

        const left = Order(
          wallet0.address,
          Asset(ETH, '0x', '100'),
          ZERO,
          Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), '7'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );
        const right = Order(
          wallet1.address,
          Asset(ERC1155, enc(erc1155V2.address, erc1155TokenId1), '7'),
          ZERO,
          Asset(ETH, '0x', '100'),
          '1',
          0,
          0,
          '0xffffffff',
          '0x'
        );

        await verifyBalanceChange(wallet0.address, 100, () =>
          verifyBalanceChange(wallet1.address, -85, () =>
            verifyBalanceChange(wallet2.address, -10, () =>
              verifyBalanceChange(wallet3.address, -5, () =>
                verifyBalanceChange(protocol.address, 0, () =>
                  gtm.doTransfersExternal(left, right, {value: 100, from: wallet0.address, gasPrice: 0})
                )
              )
            )
          )
        );
        expect((await erc1155V2.balanceOf(wallet0.address, erc1155TokenId1)).toString()).to.equal('7');
        expect((await erc1155V2.balanceOf(wallet1.address, erc1155TokenId1)).toString()).to.equal('3');
      } finally {
        await ethers.provider.send('evm_revert', [snapshot]);
      }
    });
  });

  function encDataV1(tuple: any) {
    return gtm.encode(tuple);
  }

  async function prepareERC20(user: SignerWithAddress, value = '1000') {
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    testERC20 = await TestERC20.deploy();
    const asSigner = testERC20.connect(user);
    await asSigner.mint(user.address, value);
    await asSigner.approve(erc20TransferProxy.address, value, {from: user.address});
    return asSigner;
  }

  async function prepareERC721(user: SignerWithAddress, tokenId = erc721TokenId1, royalties = []) {
    const asSigner = erc721WithRoyalties.connect(user);
    await asSigner.mint(user.address, tokenId, royalties, {from: user.address});
    await asSigner.setApprovalForAll(transferProxy.address, true, {from: user.address});
    return asSigner;
  }

  async function prepareERC1155(user: SignerWithAddress, value = '100', tokenId = erc1155TokenId1, royalties = []) {
    const asSigner = erc1155WithRoyalties.connect(user);
    await asSigner.mint(user.address, tokenId, value, royalties, {from: user.address});
    await asSigner.setApprovalForAll(transferProxy.address, true, {from: user.address});
    return asSigner;
  }

  function revertReason(reason: string) {
    return `VM Exception while processing transaction: reverted with reason string '${reason}'`;
  }
});
