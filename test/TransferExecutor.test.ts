import {expect} from './utils/chai-setup';
import {ethers, upgrades} from 'hardhat';
import {
  TransferProxy,
  ERC20TransferProxy,
  TransferExecutorTest,
  TestERC20,
  GhostMarketERC721,
  GhostMarketERC1155,
} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {Asset} from './utils/order';
import {ZERO, ETH, ERC20, ERC721, ERC1155, enc} from './utils/assets';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL, DATA} from './utils/constants';
import {expectEqualStringValues} from './utils/helpers';

describe('TransferExecutor Test', async function () {
  let erc20Token: TestERC20;
  let ghostMarketERC721Token: GhostMarketERC721;
  let ghostERC1155Token: GhostMarketERC1155;
  let transferProxy: TransferProxy;
  let erc20TransferProxy: ERC20TransferProxy;
  let transferExecutorContract: TransferExecutorTest;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    const TransferProxyTest = await ethers.getContractFactory('TransferProxy');
    const ERC20TransferProxyTest = await ethers.getContractFactory('ERC20TransferProxy');
    const TransferExecutorTest = await ethers.getContractFactory('TransferExecutorTest');
    const TestERC20 = await ethers.getContractFactory('TestERC20');
    const GhostMarketERC721 = await ethers.getContractFactory('GhostMarketERC721');
    const GhostERC1155contract = await ethers.getContractFactory('GhostMarketERC1155');
    erc20TransferProxy = await ERC20TransferProxyTest.deploy();
    await erc20TransferProxy.__ERC20TransferProxy_init();
    transferProxy = await TransferProxyTest.deploy();
    await transferProxy.__TransferProxy_init();
    transferExecutorContract = await TransferExecutorTest.deploy();
    await transferExecutorContract.__TransferExecutorTest_init(
      await transferProxy.getAddress(),
      await erc20TransferProxy.getAddress()
    );
    erc20Token = await TestERC20.deploy();

    ghostMarketERC721Token = <GhostMarketERC721>(<unknown>await upgrades.deployProxy(
      GhostMarketERC721,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    ));

    ghostERC1155Token = <GhostMarketERC1155>(<unknown>await upgrades.deployProxy(
      GhostERC1155contract,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    ));

    await transferProxy.addOperator(await transferExecutorContract.getAddress());
    await erc20TransferProxy.addOperator(await transferExecutorContract.getAddress());
  });

  it('should support ETH transfers', async () => {
    await transferExecutorContract.transferTest(Asset(ETH, '0x', '500'), ZERO, await wallet1.getAddress(), {
      value: 500,
    });
  });

  it('should support ERC20 transfers', async () => {
    await erc20Token.mint(await wallet1.getAddress(), 100);
    const t1AsSigner = erc20Token.connect(wallet1);
    await t1AsSigner.approve(await erc20TransferProxy.getAddress(), 100, {from: await wallet1.getAddress()});
    const acc1AsSigner = transferExecutorContract.connect(wallet1);
    await acc1AsSigner.transferTest(
      Asset(ERC20, enc(await erc20Token.getAddress()), '40'),
      await wallet1.getAddress(),
      await wallet2.getAddress()
    );
    expectEqualStringValues(await erc20Token.balanceOf(await wallet1.getAddress()), 60);
    expectEqualStringValues(await erc20Token.balanceOf(await wallet2.getAddress()), 40);
  });

  it('should support ERC721 transfers', async () => {
    await ghostMarketERC721Token.mintGhost(await wallet1.getAddress(), [], 'ext_uri', '');
    const erc721TokenId1 = await ghostMarketERC721Token.getLastTokenID();
    const account1AsSigner = ghostMarketERC721Token.connect(wallet1);
    await account1AsSigner.setApprovalForAll(await transferProxy.getAddress(), true, {
      from: await wallet1.getAddress(),
    });
    const acc1AsSigner = transferExecutorContract.connect(wallet1);
    await expect(
      acc1AsSigner.transferTest(
        Asset(ERC721, enc(await ghostMarketERC721Token.getAddress(), '1'), '2'),
        await wallet1.getAddress(),
        await wallet2.getAddress()
      )
    ).revertedWith('erc721 value error');
    await acc1AsSigner.transferTest(
      Asset(ERC721, enc(await ghostMarketERC721Token.getAddress(), '1'), '1'),
      await wallet1.getAddress(),
      await wallet2.getAddress()
    );
    expectEqualStringValues(await ghostMarketERC721Token.ownerOf(erc721TokenId1), await wallet2.getAddress());
  });

  it('should support ERC1155 transfers', async () => {
    const erc1155amount = 100;
    await ghostERC1155Token.mintGhost(await wallet1.getAddress(), erc1155amount, DATA, [], 'ext_uri', '');
    const account1AsSigner = ghostERC1155Token.connect(wallet1);
    await account1AsSigner.setApprovalForAll(await transferProxy.getAddress(), true, {
      from: await wallet1.getAddress(),
    });
    const acc1AsSigner = transferExecutorContract.connect(wallet1);
    await acc1AsSigner.transferTest(
      Asset(ERC1155, enc(await ghostERC1155Token.getAddress(), '1'), '40'),
      await wallet1.getAddress(),
      await wallet2.getAddress()
    );
    expectEqualStringValues(await ghostERC1155Token.balanceOf(await wallet1.getAddress(), 1), 60);
    expectEqualStringValues(await ghostERC1155Token.balanceOf(await wallet2.getAddress(), 1), 40);
  });
});
