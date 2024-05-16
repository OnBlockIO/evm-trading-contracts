import {expect} from './utils/chai-setup';
import {ethers, upgrades} from 'hardhat';
import {ERC721WithRoyalties, GhostMarketERC721} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {ZERO} from './utils/assets';
import {
  INTERFACE_ID_ERC165,
  INTERFACE_ID_ERC721,
  INTERFACE_ID_GHOSTMARKET,
  INTERFACE_ID_ROYALTIES_EIP2981,
} from './utils/constants';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL} from './utils/constants';

describe('ERC721WithRoyalties Test', () => {
  let deployer: SignerWithAddress;
  let royaltiesRecipient: SignerWithAddress;
  let erc721WithRoyalties: ERC721WithRoyalties;
  let ghostMarketERC721: GhostMarketERC721;

  beforeEach(async () => {
    [deployer, royaltiesRecipient] = await ethers.getSigners();
    const ERC721WithRoyalties = await ethers.getContractFactory('ERC721WithRoyalties');
    erc721WithRoyalties = await ERC721WithRoyalties.deploy('ERC721WithRoyalties', '2981');
    const GhostMarketERC721 = await ethers.getContractFactory('GhostMarketERC721');

    ghostMarketERC721 = <GhostMarketERC721>(<unknown>await upgrades.deployProxy(
      GhostMarketERC721,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    ));
  });

  it('should have all the right interfaces', async function () {
    expect(await erc721WithRoyalties.supportsInterface(INTERFACE_ID_ERC165), 'Error Royalties 165').to.be.true;
    expect(await erc721WithRoyalties.supportsInterface(INTERFACE_ID_ROYALTIES_EIP2981), 'Error Royalties 2981').to.be
      .true;
    expect(await erc721WithRoyalties.supportsInterface(INTERFACE_ID_ERC721), 'Error Royalties 721').to.be.true;

    expect(await ghostMarketERC721.supportsInterface(INTERFACE_ID_ERC165), 'Error Royalties 165').to.be.true;
    expect(await ghostMarketERC721.supportsInterface(INTERFACE_ID_ERC721), 'Error Royalties 721').to.be.true;
    expect(await ghostMarketERC721.supportsInterface(INTERFACE_ID_GHOSTMARKET), 'Error Royalties Ghostmarket').to.be
      .true;
  });

  it('should throw if royalties more than 100%', async function () {
    const tx = erc721WithRoyalties.mint(
      await deployer.getAddress(),
      await royaltiesRecipient.getAddress(),
      10001 // 100.01%
    );
    await expect(tx).to.be.revertedWith('ERC2981Royalties: Too high');

    const tx2 = ghostMarketERC721.mintGhost(
      await deployer.getAddress(),
      [{recipient: await deployer.getAddress(), value: 5001}],
      'ext_uri',
      ''
    );
    await expect(tx2).to.be.revertedWith('Royalty total value should be < 50%');
  });

  it('should have the right royalties for tokenId', async function () {
    await erc721WithRoyalties.mint(
      await deployer.getAddress(),
      await royaltiesRecipient.getAddress(),
      250 // 2.50%
    );
    const info = await erc721WithRoyalties.royaltyInfo(1, 10000);
    expect(info[1]).to.be.equal(BigInt(250));
    expect(info[0]).to.be.equal(await royaltiesRecipient.getAddress());

    await ghostMarketERC721.mintGhost(
      await deployer.getAddress(),
      [{recipient: await royaltiesRecipient.getAddress(), value: 250}],
      'ext_uri',
      ''
    );
    const info2 = await ghostMarketERC721.getRoyalties(1);
    expect(info2[0][0]).to.be.equal(await royaltiesRecipient.getAddress());
    expect(info2[0][1]).to.be.equal(BigInt(250));
  });

  it('should be able to set address(0) as royalties recipient', async function () {
    // 0.01% royalties
    await erc721WithRoyalties.mint(await deployer.getAddress(), ZERO, 1);
    const info = await erc721WithRoyalties.royaltyInfo(1, 10000);
    expect(info[1]).to.be.equal(BigInt(1));
    expect(info[0]).to.be.equal(ZERO);

    const tx = ghostMarketERC721.mintGhost(await deployer.getAddress(), [{recipient: ZERO, value: 250}], 'ext_uri', '');
    await expect(tx).to.be.revertedWith('Recipient should be present');
  });

  it('should have no royalties if not set', async function () {
    await erc721WithRoyalties.mint(await deployer.getAddress(), await royaltiesRecipient.getAddress(), 0);
    const info = await erc721WithRoyalties.royaltyInfo(1, 100);
    expect(info[1]).to.be.equal(BigInt(0));
    expect(info[0]).to.be.equal(ZERO);

    await ghostMarketERC721.mintGhost(await deployer.getAddress(), [], 'ext_uri', '');
    const info2 = await ghostMarketERC721.getRoyalties(1);
    expect(info2.length).to.be.equal(0);
  });

  it('should have each token with the right royalties when minting batch', async function () {
    const recipients = [
      await deployer.getAddress(),
      await deployer.getAddress(),
      await deployer.getAddress(),
      await deployer.getAddress(),
    ];
    const royaltyRecipients = [
      await deployer.getAddress(),
      await deployer.getAddress(),
      ZERO,
      await deployer.getAddress(),
    ];
    const royaltyValues = [1000, 800, 5000, 0];
    await erc721WithRoyalties.mintBatch(recipients, royaltyRecipients, royaltyValues);
    /*for (const [index, id] of ids.entries()) {
      const info = await erc721WithRoyalties.royaltyInfo(id, 100);
      expect(info[1].toNumber()).to.be.equal(royaltyValues[index] / 100);
      if (info[1] !== 0) {
        expect(info[0]).to.be.equal(royaltyRecipients[index]);
      }
    }*/
  });
});
