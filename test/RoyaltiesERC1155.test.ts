import {expect} from './utils/chai-setup';
import {ethers, upgrades} from 'hardhat';
import {ERC1155WithRoyalties, GhostMarketERC1155} from './../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {ZERO} from './utils/assets';
import {INTERFACE_ID_ERC165, INTERFACE_ID_GHOSTMARKET, INTERFACE_ID_ROYALTIES_EIP2981} from './utils/constants';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL} from './utils/constants';

describe('ERC1155WithRoyalties Test', () => {
  let deployer: SignerWithAddress;
  let randomAccount: SignerWithAddress;
  let royaltiesRecipient: SignerWithAddress;
  let erc1155WithRoyalties: ERC1155WithRoyalties;
  let ghostMarketERC1155: GhostMarketERC1155;

  beforeEach(async () => {
    [deployer, randomAccount, royaltiesRecipient] = await ethers.getSigners();
    const ERC1155WithRoyalties = await ethers.getContractFactory('ERC1155WithRoyalties');
    erc1155WithRoyalties = await ERC1155WithRoyalties.deploy('ipfs://baseURI');
    const GhostMarketERC1155 = await ethers.getContractFactory('GhostMarketERC1155');

    ghostMarketERC1155 = <GhostMarketERC1155>(<unknown>await upgrades.deployProxy(
      GhostMarketERC1155,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    ));
  });

  it('should have all the right interfaces', async function () {
    expect(await erc1155WithRoyalties.supportsInterface(INTERFACE_ID_ERC165), 'Error Royalties 165').to.be.true;
    expect(await erc1155WithRoyalties.supportsInterface(INTERFACE_ID_ROYALTIES_EIP2981), 'Error Royalties 2981').to.be
      .true;

    expect(await ghostMarketERC1155.supportsInterface(INTERFACE_ID_ERC165), 'Error Royalties 165').to.be.true;
    expect(await ghostMarketERC1155.supportsInterface(INTERFACE_ID_GHOSTMARKET), 'Error Royalties Ghostmarket').to.be
      .true;
  });

  it('should throw if royalties more than 100%', async function () {
    const tx = erc1155WithRoyalties.mint(
      await deployer.getAddress(),
      0,
      10,
      await royaltiesRecipient.getAddress(),
      10001 // 100.01%
    );
    await expect(tx).to.be.revertedWith('ERC2981Royalties: Too high');

    const tx2 = ghostMarketERC1155.mintGhost(
      await deployer.getAddress(),
      1,
      '0x',
      [{recipient: await deployer.getAddress(), value: 5001}],
      'ext_uri',
      ''
    );
    await expect(tx2).to.be.revertedWith('Royalty total value should be < 50%');
  });

  it('should have the right royalties for tokenId', async function () {
    await erc1155WithRoyalties.mint(
      await deployer.getAddress(),
      0,
      10,
      await royaltiesRecipient.getAddress(),
      1000 // 10%
    );
    const info = await erc1155WithRoyalties.royaltyInfo(0, 100);
    expect(info[1]).to.be.equal(BigInt(10));
    expect(info[0]).to.be.equal(await royaltiesRecipient.getAddress());

    await ghostMarketERC1155.mintGhost(
      await deployer.getAddress(),
      1,
      '0x',
      [{recipient: await royaltiesRecipient.getAddress(), value: 250}],
      'ext_uri',
      ''
    );
    const info2 = await ghostMarketERC1155.getRoyalties(1);
    expect(info2[0][0]).to.be.equal(await royaltiesRecipient.getAddress());
    expect(info2[0][1]).to.be.equal(BigInt(250));
  });

  it('should be able to set address(0) as royalties recipient', async function () {
    await erc1155WithRoyalties.mint(await deployer.getAddress(), 0, 10, ZERO, 1000);
    const info = await erc1155WithRoyalties.royaltyInfo(0, 100);
    expect(info[1]).to.be.equal(BigInt(10));
    expect(info[0]).to.be.equal(ZERO);

    const tx = ghostMarketERC1155.mintGhost(
      await deployer.getAddress(),
      1,
      '0x',
      [{recipient: ZERO, value: 250}],
      'ext_uri',
      ''
    );
    await expect(tx).to.be.revertedWith('Recipient should be present');
  });

  it('should have no royalties if not set', async function () {
    await erc1155WithRoyalties.mint(await deployer.getAddress(), 0, 10, await royaltiesRecipient.getAddress(), 0);
    const info = await erc1155WithRoyalties.royaltyInfo(0, 100);
    expect(info[1]).to.be.equal(BigInt(0));
    expect(info[0]).to.be.equal(ZERO);

    await ghostMarketERC1155.mintGhost(await deployer.getAddress(), 1, '0x', [], 'ext_uri', '');
    const info2 = await ghostMarketERC1155.getRoyalties(1);
    expect(info2.length).to.be.equal(0);
  });

  it('should have each token with the right royalties when minting batch', async function () {
    const ids = [0, 1, 2, 3];
    const amounts = [10, 10, 10, 10];
    const royaltyRecipients = [
      await randomAccount.getAddress(),
      await deployer.getAddress(),
      ZERO,
      await deployer.getAddress(),
    ];
    const royaltyValues = [1000, 800, 5000, 0];
    await erc1155WithRoyalties.mintBatch(await deployer.getAddress(), ids, amounts, royaltyRecipients, royaltyValues);
    /*for (const [index, id] of ids.entries()) {
      const info = await erc1155WithRoyalties.royaltyInfo(id, 100);
      expect(info[1].toNumber()).to.be.equal(royaltyValues[index] / 100);
      if (info[1] !== 0) {
        expect(info[0]).to.be.equal(royaltyRecipients[index]);
      }
    }*/
  });
});
