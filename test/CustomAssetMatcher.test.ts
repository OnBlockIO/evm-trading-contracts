import {expect} from './utils/chai-setup';
import {ethers} from 'hardhat';
import {AssetMatcherCollection} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {enc, ETH, ERC20, ERC721, ERC1155, ERC721_LAZY, ERC1155_LAZY, COLLECTION} from './utils/assets';
import {AssetType} from './utils/order';

describe('CustomAssetMatcher Test', function () {
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
  });

  it('should work COLLECTION <-> ERC1155 matches!', async () => {
    const tokenId = '3000';
    const encoded = enc(await wallet2.getAddress());
    const encodedNFT = enc(await wallet2.getAddress(), tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155, encodedNFT));
    expect(result[0]).to.be.equal(ERC1155);
    expect(result[1]).to.be.equal(encodedNFT);
  });

  it('should work COLLECTION <-> ERC1155_LAZY matches!', async () => {
    const tokenId = '3000';
    const encoded = enc(await wallet2.getAddress());
    const encodedNFT = enc(await wallet2.getAddress(), tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155_LAZY, encodedNFT));
    expect(result[0]).to.be.equal(ERC1155_LAZY);
    expect(result[1]).to.be.equal(encodedNFT);
  });

  it('should work COLLECTION <-> ERC721 matches!', async () => {
    const tokenId = '3000';
    const encoded = enc(await wallet2.getAddress());
    const encodedNFT = enc(await wallet2.getAddress(), tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721, encodedNFT));
    expect(result[0]).to.be.equal(ERC721);
    expect(result[1]).to.be.equal(encodedNFT);
  });

  it('should work COLLECTION <-> ERC721_LAZY matches!', async () => {
    const tokenId = '3000';
    const encoded = enc(await wallet2.getAddress());
    const encodedNFT = enc(await wallet2.getAddress(), tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721_LAZY, encodedNFT));
    expect(result[0]).to.be.equal(ERC721_LAZY);
    expect(result[1]).to.be.equal(encodedNFT);
  });

  it('should fail COLLECTION <-> ERC1155 (another collection) don`t match!', async () => {
    const tokenId = '3000';
    const encoded = enc(await wallet2.getAddress());
    const encodedNFT = enc(await wallet3.getAddress(), tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC1155, encodedNFT));
    expect(BigInt(result[0])).to.be.equal(BigInt(0));
  });

  it('should fail COLLECTION <-> ERC721 (another collection) don`t match!', async () => {
    const tokenId = '3000';
    const encoded = enc(await wallet2.getAddress());
    const encodedNFT = enc(await wallet3.getAddress(), tokenId);
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC721, encodedNFT));
    expect(BigInt(result[0])).to.be.equal(BigInt(0));
  });

  it('should fail COLLECTION <-> ERC20 don`t match', async () => {
    const encoded = enc(await wallet2.getAddress());
    const encodedERC20 = enc(await wallet2.getAddress());
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ERC20, encodedERC20));
    expect(BigInt(result[0])).to.be.equal(BigInt(0));
  });

  it('should fail COLLECTION <-> COLLECTION don`t match', async () => {
    const encoded = enc(await wallet2.getAddress());
    const encodedCollection = enc(await wallet2.getAddress());
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(COLLECTION, encodedCollection));
    expect(BigInt(result[0])).to.be.equal(BigInt(0));
  });

  it('should fail COLLECTION <-> ETH don`t match', async () => {
    const encoded = enc(await wallet2.getAddress());
    const encodedETH = enc(await wallet2.getAddress());
    const result = await assetMatcherCollection
      .connect(wallet1)
      .matchAssets(AssetType(COLLECTION, encoded), AssetType(ETH, encodedETH));
    expect(BigInt(result[0])).to.be.equal(BigInt(0));
  });
});
