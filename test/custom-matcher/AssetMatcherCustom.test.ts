import {expect} from '../utils/chai-setup';
import {ethers} from 'hardhat';
import {AssetMatcherCollection} from '../../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {enc, ETH, ERC20, ERC721, ERC1155, COLLECTION} from '../utils/assets';
import {AssetType} from '../utils/order';

describe('AssetMatcherCustom Test', function () {
  let assetMatcherCollection: AssetMatcherCollection;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    const AssetMatcherCollection = await ethers.getContractFactory('AssetMatcherCollection');
    assetMatcherCollection = await AssetMatcherCollection.deploy();
    await assetMatcherCollection.deployed();
  });

  it('should work COLLECTION <-> ERC1155 matches!', async () => {
    const tokenId = '3000';
    const encoded = enc(wallet2.address);
    const encodedNFT = enc(wallet2.address, tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155, encodedNFT));
    expect(result[0]).to.be.equal(ERC1155);
    expect(result[1]).to.be.equal(encodedNFT);
  });

  it('should work COLLECTION <-> ERC721 matches!', async () => {
    const tokenId = '3000';
    const encoded = enc(wallet2.address);
    const encodedNFT = enc(wallet2.address, tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721, encodedNFT));
    expect(result[0]).to.be.equal(ERC721);
    expect(result[1]).to.be.equal(encodedNFT);
  });

  it('should fail COLLECTION <-> ERC1155 (another collection) don`t match!', async () => {
    const tokenId = '3000';
    const encoded = enc(wallet2.address);
    const encodedNFT = enc(wallet3.address, tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155, encodedNFT));
    expect(ethers.BigNumber.from(result[0])).to.be.equal(0);
  });

  it('should fail COLLECTION <-> ERC721 (another collection) don`t match!', async () => {
    const tokenId = '3000';
    const encoded = enc(wallet2.address);
    const encodedNFT = enc(wallet3.address, tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721, encodedNFT));
    expect(ethers.BigNumber.from(result[0])).to.be.equal(0);
  });

  it('should fail COLLECTION <-> ERC20 don`t match', async () => {
    const encoded = enc(wallet2.address);
    const encodedERC20 = enc(wallet2.address);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC20, encodedERC20));
    expect(ethers.BigNumber.from(result[0])).to.be.equal(0);
  });

  it('should fail COLLECTION <-> COLLECTION don`t match', async () => {
    const encoded = enc(wallet2.address);
    const encodedCollection = enc(wallet2.address);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(COLLECTION, encodedCollection));
    expect(ethers.BigNumber.from(result[0])).to.be.equal(0);
  });

  it('should fail COLLECTION <-> ETH don`t match', async () => {
    const encoded = enc(wallet2.address);
    const encodedETH = enc(wallet2.address);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ETH, encodedETH));
    expect(ethers.BigNumber.from(result[0])).to.be.equal(0);
  });
});
