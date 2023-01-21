import {expect} from './utils/chai-setup';
import {ethers} from 'hardhat';
import {ERC721WithRoyalties} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ZERO} from './utils/assets';
import {INTERFACE_ID_ERC165, INTERFACE_ID_ERC721, INTERFACE_ID_ROYALTIES_EIP2981} from './utils/constants';

describe('ERC721WithRoyalties Test', () => {
  let deployer: SignerWithAddress;
  let royaltiesRecipient: SignerWithAddress;
  let erc721WithRoyalties: ERC721WithRoyalties;

  beforeEach(async () => {
    [deployer, royaltiesRecipient] = await ethers.getSigners();
    const ERC721WithRoyalties = await ethers.getContractFactory('ERC721WithRoyalties');
    erc721WithRoyalties = await ERC721WithRoyalties.deploy('ERC721WithRoyalties', '2981');
  });

  it('should have all the right interfaces', async function () {
    expect(await erc721WithRoyalties.supportsInterface(INTERFACE_ID_ERC165), 'Error Royalties 165').to.be.true;
    expect(await erc721WithRoyalties.supportsInterface(INTERFACE_ID_ROYALTIES_EIP2981), 'Error Royalties 2981').to.be
      .true;
    expect(await erc721WithRoyalties.supportsInterface(INTERFACE_ID_ERC721), 'Error Royalties 721').to.be.true;
  });

  it('should throw if royalties more than 100%', async function () {
    const tx = erc721WithRoyalties.mint(
      deployer.address,
      royaltiesRecipient.address,
      10001 // 100.01%
    );
    await expect(tx).to.be.revertedWith('ERC2981Royalties: Too high');
  });

  it('should have the right royalties for tokenId', async function () {
    await erc721WithRoyalties.mint(
      deployer.address,
      royaltiesRecipient.address,
      250 // 2.50%
    );
    const info = await erc721WithRoyalties.royaltyInfo(1, 10000);
    expect(info[1].toNumber()).to.be.equal(250);
    expect(info[0]).to.be.equal(royaltiesRecipient.address);
  });

  it('should be able to set address(0) as royalties recipient', async function () {
    // 0.01% royalties
    await erc721WithRoyalties.mint(deployer.address, ZERO, 1);
    const info = await erc721WithRoyalties.royaltyInfo(1, 10000);
    expect(info[1].toNumber()).to.be.equal(1);
    expect(info[0]).to.be.equal(ZERO);
  });

  it('should have no royalties if not set', async function () {
    await erc721WithRoyalties.mint(deployer.address, royaltiesRecipient.address, 0);
    const info = await erc721WithRoyalties.royaltyInfo(1, 100);
    expect(info[1].toNumber()).to.be.equal(0);
    expect(info[0]).to.be.equal(ZERO);
  });

  it('should have each token with the right royalties when minting batch', async function () {
    const recipients = [deployer.address, deployer.address, deployer.address, deployer.address];
    const royaltyRecipients = [deployer.address, deployer.address, ZERO, deployer.address];
    const royaltyValues = [1000, 800, 5000, 0];
    await erc721WithRoyalties.mintBatch(recipients, royaltyRecipients, royaltyValues);
    /*for (const [index, id] of ids.entries()) {
      const info = await erc721WithRoyalties.royaltyInfo(id, 100);
      expect(info[1].toNumber()).to.be.equal(royaltyValues[index] / 100);
      if (info[1].toNumber() !== 0) {
        expect(info[0]).to.be.equal(royaltyRecipients[index]);
      }
    }*/
  });
});
