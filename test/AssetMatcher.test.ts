import {expect} from './utils/chai-setup';
import {ethers} from 'hardhat';
import {AssetMatcherTest, TestAssetMatcher} from '../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {enc, id, ETH, ERC20, ERC721, ERC1155} from './utils/assets';
import {AssetType} from './utils/order';

describe('AssetMatcher Test', function () {
  let testAssetMatcher: TestAssetMatcher;
  let assetMatcherTest: AssetMatcherTest;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet4: SignerWithAddress;
  let wallet5: SignerWithAddress;

  before(async () => {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet4 = accounts[4];
    wallet5 = accounts[5];
    const AssetMatcherTest = await ethers.getContractFactory('AssetMatcherTest');
    assetMatcherTest = await AssetMatcherTest.deploy();
    await assetMatcherTest.deployed();
    await assetMatcherTest.__AssetMatcherTest_init();
  });

  it('should work setAssetMatcher', async () => {
    const encoded = enc(wallet5.address);
    await expect(
      assetMatcherTest.matchAssetsTest(AssetType(ERC20, encoded), AssetType(id('BLA'), encoded))
    ).revertedWith('not found IAssetMatcher');

    const TestAssetMatcher = await ethers.getContractFactory('TestAssetMatcher');
    testAssetMatcher = await TestAssetMatcher.deploy();
    await testAssetMatcher.deployed();

    await assetMatcherTest.setAssetMatcher(id('BLA'), testAssetMatcher.address);
    const result = await assetMatcherTest.matchAssetsTest(AssetType(ERC20, encoded), AssetType(id('BLA'), encoded));
    expect(result[0]).to.equal(ERC20);
    expect(result[1]).to.equal(encoded);
  });

  describe('ETH', () => {
    it('should extract ETH type if both are ETHs', async () => {
      const result = await assetMatcherTest.matchAssetsTest(AssetType(ETH, '0x'), AssetType(ETH, '0x'));
      expect(result[0]).to.equal(ETH);
    });

    it('should extract nothing if one is not ETH', async () => {
      const result = await assetMatcherTest.matchAssetsTest(AssetType(ETH, '0x'), AssetType(ERC20, '0x'));
      expect(result[0]).to.equal('0x00000000');
    });
  });

  describe('ERC20', () => {
    it('should extract ERC20 type if both are and addresses equal', async () => {
      const encoded = enc(wallet5.address);
      const result = await assetMatcherTest.matchAssetsTest(AssetType(ERC20, encoded), AssetType(ERC20, encoded));
      expect(result[0]).to.equal(ERC20);
      expect(result[1]).to.equal(encoded);
    });

    it("should extract nothing if erc20 don't match", async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType(ERC20, enc(wallet1.address)),
        AssetType(ERC20, enc(wallet2.address))
      );
      expect(result[0]).to.equal('0x00000000');
    });

    it('should extract nothing if other type is not ERC20', async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType(ERC20, enc(wallet1.address)),
        AssetType(ETH, '0x')
      );
      expect(result[0]).to.equal('0x00000000');
    });
  });

  describe('ERC721', () => {
    it('should extract ERC721 type if both are equal', async () => {
      const encoded = enc(wallet5.address, '100');
      const result = await assetMatcherTest.matchAssetsTest(AssetType(ERC721, encoded), AssetType(ERC721, encoded));
      expect(result[0]).to.equal(ERC721);
      expect(result[1]).to.equal(encoded);
    });

    it("should extract nothing if tokenIds don't match", async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType(ERC721, enc(wallet5.address, '100')),
        AssetType(ERC721, enc(wallet5.address, '101'))
      );
      expect(result[0]).to.equal('0x00000000');
    });

    it("should extract nothing if addresses don't match", async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType(ERC721, enc(wallet4.address, '100')),
        AssetType(ERC721, enc(wallet5.address, '100'))
      );
      expect(result[0]).to.equal('0x00000000');
    });

    it('should extract nothing if other type is not ERC721', async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType(ERC721, enc(wallet5.address, '100')),
        AssetType(ETH, '0x')
      );
      expect(result[0]).to.equal('0x00000000');
    });
  });

  describe('ERC1155', () => {
    it('should extract ERC1155 type if both are equal', async () => {
      const encoded = enc(wallet5.address, '100');
      const result = await assetMatcherTest.matchAssetsTest(AssetType(ERC1155, encoded), AssetType(ERC1155, encoded));
      expect(result[0]).to.equal(ERC1155);
      expect(result[1]).to.equal(encoded);
    });

    it("should extract nothing if tokenIds don't match", async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType(ERC1155, enc(wallet5.address, '100')),
        AssetType(ERC1155, enc(wallet5.address, '101'))
      );
      expect(result[0]).to.equal('0x00000000');
    });

    it("should extract nothing if addresses don't match", async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType(ERC1155, enc(wallet4.address, '100')),
        AssetType(ERC1155, enc(wallet5.address, '100'))
      );
      expect(result[0]).to.equal('0x00000000');
    });

    it('should extract nothing if other type is not erc1155', async () => {
      const encoded = enc(wallet5.address, '100');
      const result = await assetMatcherTest.matchAssetsTest(AssetType(ERC1155, encoded), AssetType(ERC721, encoded));
      expect(result[0]).to.equal('0x00000000');
    });
  });

  describe('generic', () => {
    it('should extract left type if asset types are equal', async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType('0x00112233', '0x1122'),
        AssetType('0x00112233', '0x1122')
      );
      expect(result[0]).to.equal('0x00112233');
      expect(result[1]).to.equal('0x1122');
    });

    it('should extract nothing single byte differs', async () => {
      const result = await assetMatcherTest.matchAssetsTest(
        AssetType('0x00112233', '0x1122'),
        AssetType('0x00112233', '0x1111')
      );
      expect(result[0]).to.equal('0x00000000');
    });
  });
});
