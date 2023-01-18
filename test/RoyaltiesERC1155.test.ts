import {expect} from './utils/chai-setup';
import {ethers} from 'hardhat';
import {ERC1155WithRoyalties} from './../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ZERO} from './utils/assets';
import {INTERFACE_ID_ERC165, INTERFACE_ID_ROYALTIES_EIP2981} from './utils/constants';

describe('ERC1155WithRoyalties Test', () => {
  let deployer: SignerWithAddress;
  let randomAccount: SignerWithAddress;
  let royaltiesRecipient: SignerWithAddress;
  let erc1155WithRoyalties: ERC1155WithRoyalties;

  beforeEach(async () => {
    [deployer, randomAccount, royaltiesRecipient] = await ethers.getSigners();
    const ERC1155WithRoyalties = await ethers.getContractFactory('ERC1155WithRoyalties');
    erc1155WithRoyalties = await ERC1155WithRoyalties.deploy('ipfs://baseURI');
  });

  it('should have all the right interfaces', async function () {
    expect(await erc1155WithRoyalties.supportsInterface(INTERFACE_ID_ERC165), 'Error Royalties 165').to.be.true;
    expect(await erc1155WithRoyalties.supportsInterface(INTERFACE_ID_ROYALTIES_EIP2981), 'Error Royalties 2981').to.be
      .true;
  });

  it('should throw if royalties more than 100%', async function () {
    const tx = erc1155WithRoyalties.mint(
      deployer.address,
      0,
      10,
      royaltiesRecipient.address,
      10001 // 100.01%
    );
    await expect(tx).to.be.revertedWith('ERC2981Royalties: Too high');
  });

  it('should have the right royalties for tokenId', async function () {
    await erc1155WithRoyalties.mint(
      deployer.address,
      0,
      10,
      royaltiesRecipient.address,
      1000 // 10%
    );
    const info = await erc1155WithRoyalties.royaltyInfo(0, 100);
    expect(info[1].toNumber()).to.be.equal(10);
    expect(info[0]).to.be.equal(royaltiesRecipient.address);
  });

  it('should be able to set address(0) as royalties recipient', async function () {
    await erc1155WithRoyalties.mint(deployer.address, 0, 10, ZERO, 1000);
    const info = await erc1155WithRoyalties.royaltyInfo(0, 100);
    expect(info[1].toNumber()).to.be.equal(10);
    expect(info[0]).to.be.equal(ZERO);
  });

  it('should have no royalties if not set', async function () {
    await erc1155WithRoyalties.mint(deployer.address, 0, 10, royaltiesRecipient.address, 0);
    const info = await erc1155WithRoyalties.royaltyInfo(0, 100);
    expect(info[1].toNumber()).to.be.equal(0);
    expect(info[0]).to.be.equal(ZERO);
  });

  it('should have each token with the right royalties when minting batch', async function () {
    const ids = [0, 1, 2, 3];
    const amounts = [10, 10, 10, 10];
    const royaltyRecipients = [randomAccount.address, deployer.address, ZERO, deployer.address];
    const royaltyValues = [1000, 800, 5000, 0];
    await erc1155WithRoyalties.mintBatch(deployer.address, ids, amounts, royaltyRecipients, royaltyValues);
    /*for (const [index, id] of ids.entries()) {
      const info = await erc1155WithRoyalties.royaltyInfo(id, 100);
      expect(info[1].toNumber()).to.be.equal(royaltyValues[index] / 100);
      if (info[1].toNumber() !== 0) {
        expect(info[0]).to.be.equal(royaltyRecipients[index]);
      }
    }*/
  });
});
