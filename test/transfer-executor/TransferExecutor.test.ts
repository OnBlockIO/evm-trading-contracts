import {expect} from '../utils/chai-setup';
import {ethers, upgrades} from 'hardhat';
import {
  TransferProxy,
  ERC20TransferProxy,
  TransferExecutorTest,
  TestERC20,
  GhostMarketERC721,
  GhostMarketERC1155,
} from '../../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {Asset} from '../utils/order';
import {ZERO, ETH, ERC20, ERC721, ERC1155, enc} from '../utils/assets';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL, DATA} from '../utils/constants';
import {expectEqualStringValues} from '../utils/helpers';

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
    await transferExecutorContract.__TransferExecutorTest_init(transferProxy.address, erc20TransferProxy.address);
    erc20Token = await TestERC20.deploy();

    ghostMarketERC721Token = <GhostMarketERC721>await upgrades.deployProxy(
      GhostMarketERC721,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    );

    ghostERC1155Token = <GhostMarketERC1155>await upgrades.deployProxy(
      GhostERC1155contract,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    );

    await transferProxy.addOperator(transferExecutorContract.address);
    await erc20TransferProxy.addOperator(transferExecutorContract.address);
  });

  it('should support ETH transfers', async () => {
    await transferExecutorContract.transferTest(Asset(ETH, '0x', '500'), ZERO, wallet1.address, {value: 500});
  });

  it('should support ERC20 transfers', async () => {
    await erc20Token.mint(wallet1.address, 100);
    const t1AsSigner = erc20Token.connect(wallet1);
    await t1AsSigner.approve(erc20TransferProxy.address, 100, {from: wallet1.address});
    const acc1AsSigner = transferExecutorContract.connect(wallet1);
    await acc1AsSigner.transferTest(Asset(ERC20, enc(erc20Token.address), '40'), wallet1.address, wallet2.address);
    expectEqualStringValues(await erc20Token.balanceOf(wallet1.address), 60);
    expectEqualStringValues(await erc20Token.balanceOf(wallet2.address), 40);
  });

  it('should support ERC721 transfers', async () => {
    await ghostMarketERC721Token.mintGhost(wallet1.address, [], 'ext_uri', '');
    const erc721TokenId1 = await ghostMarketERC721Token.getLastTokenID();
    const account1AsSigner = ghostMarketERC721Token.connect(wallet1);
    await account1AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    const acc1AsSigner = transferExecutorContract.connect(wallet1);
    await expect(
      acc1AsSigner.transferTest(
        Asset(ERC721, enc(ghostMarketERC721Token.address, '1'), '2'),
        wallet1.address,
        wallet2.address
      )
    ).revertedWith('erc721 value error');
    await acc1AsSigner.transferTest(
      Asset(ERC721, enc(ghostMarketERC721Token.address, '1'), '1'),
      wallet1.address,
      wallet2.address
    );
    expectEqualStringValues(await ghostMarketERC721Token.ownerOf(erc721TokenId1), wallet2.address);
  });

  it('should support ERC1155 transfers', async () => {
    const erc1155amount = 100;
    await ghostERC1155Token.mintGhost(wallet1.address, erc1155amount, DATA, [], 'ext_uri', '');
    const account1AsSigner = ghostERC1155Token.connect(wallet1);
    await account1AsSigner.setApprovalForAll(transferProxy.address, true, {from: wallet1.address});
    const acc1AsSigner = transferExecutorContract.connect(wallet1);
    await acc1AsSigner.transferTest(
      Asset(ERC1155, enc(ghostERC1155Token.address, '1'), '40'),
      wallet1.address,
      wallet2.address
    );
    expectEqualStringValues(await ghostERC1155Token.balanceOf(wallet1.address, 1), 60);
    expectEqualStringValues(await ghostERC1155Token.balanceOf(wallet2.address, 1), 40);
  });
});
