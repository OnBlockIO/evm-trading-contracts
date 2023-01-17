/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '../utils/chai-setup';
import {ethers} from 'hardhat';
import {
  RoyaltiesRegistry,
  TestERC721WithRoyaltiesV2OwnableUpgradeable,
  RoyaltiesProviderTest,
  TestERC721WithRoyaltyV2981,
} from '../../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

describe('RoyaltiesType Test', () => {
  const ADDRESS_ZERO = ethers.constants.AddressZero;
  let royaltiesRegistry: RoyaltiesRegistry;
  let testERC721WithRoyaltiesV2981: TestERC721WithRoyaltyV2981;
  let testRoyaltiesProvider: RoyaltiesProviderTest;
  let testERC721WithRoyaltiesV2OwnableUpgradeable: TestERC721WithRoyaltiesV2OwnableUpgradeable;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;
  let wallet4: SignerWithAddress;
  let wallet5: SignerWithAddress;
  let wallet6: SignerWithAddress;
  let wallet7: SignerWithAddress;
  let defaultRoyalties: any[];
  let defaultTokenId1: number;
  let defaultTokenId2: number;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    wallet4 = accounts[4];
    wallet5 = accounts[5];
    wallet6 = accounts[6];
    wallet7 = accounts[7];
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    const TestERC721WithRoyaltiesV2981 = await ethers.getContractFactory('TestERC721WithRoyaltyV2981');
    const TestRoyaltiesProvider = await ethers.getContractFactory('RoyaltiesProviderTest');
    const TestERC721WithRoyaltiesV2OwnableUpgradeable = await ethers.getContractFactory(
      'TestERC721WithRoyaltiesV2OwnableUpgradeable'
    );
    royaltiesRegistry = await RoyaltiesRegistry.deploy();
    await royaltiesRegistry.__RoyaltiesRegistry_init();
    testERC721WithRoyaltiesV2981 = await TestERC721WithRoyaltiesV2981.connect(wallet7).deploy();
    await testERC721WithRoyaltiesV2981.connect(wallet7).initialize();
    testRoyaltiesProvider = await TestRoyaltiesProvider.deploy();
    testERC721WithRoyaltiesV2OwnableUpgradeable = await TestERC721WithRoyaltiesV2OwnableUpgradeable.connect(
      wallet7
    ).deploy();
    await testERC721WithRoyaltiesV2OwnableUpgradeable.connect(wallet7).initialize();
    defaultRoyalties = [
      [wallet5.address, 1000],
      [wallet6.address, 500],
    ];
    defaultTokenId1 = 533;
    defaultTokenId2 = 644;
  });

  describe('royalties types are set correctly', () => {
    it('should test royalties type = 1, royalties set in royaltiesByToken', async () => {
      const token = royaltiesRegistry.address;

      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, 'setRoyaltiesByToken type = 1');

      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(0, 'correct royalties type');

      const tx1 = await royaltiesRegistry['getRoyalties(address,uint256)'](token, defaultTokenId1);
      await tx1.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, 'correct royalties type');
      // console.log('royaltiesByToken gas used first request', (await tx1.wait()).gasUsed.toString());

      const tx2 = await royaltiesRegistry['getRoyalties(address,uint256)'](token, defaultTokenId2);
      await tx2.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, 'correct royalties type');
      // console.log('royaltiesByToken gas used second request', (await tx2.wait()).gasUsed.toString());
    });

    it('should test royalties type = 2, royalties v2', async () => {
      await testERC721WithRoyaltiesV2OwnableUpgradeable.mint(wallet2.address, defaultTokenId1, defaultRoyalties);
      await testERC721WithRoyaltiesV2OwnableUpgradeable.mint(wallet2.address, defaultTokenId2, defaultRoyalties);

      const tx1 = await royaltiesRegistry['getRoyalties(address,uint256)'](
        testERC721WithRoyaltiesV2OwnableUpgradeable.address,
        defaultTokenId1
      );
      await tx1.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(testERC721WithRoyaltiesV2OwnableUpgradeable.address)).to.be.equal(
        2,
        'correct royalties type'
      );
      // console.log('royalties v2 gas used first request', (await tx1.wait()).gasUsed.toString());

      const tx2 = await royaltiesRegistry['getRoyalties(address,uint256)'](
        testERC721WithRoyaltiesV2OwnableUpgradeable.address,
        defaultTokenId2
      );
      await tx2.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(testERC721WithRoyaltiesV2OwnableUpgradeable.address)).to.be.equal(
        2,
        'correct royalties type'
      );
      // console.log('royalties v2 gas used second request', (await tx2.wait()).gasUsed.toString());
    });

    it('should test royalties type = 4, royalties from external provider', async () => {
      const token = royaltiesRegistry.address;

      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);

      await royaltiesRegistry.setProviderByToken(token, testRoyaltiesProvider.address);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(4, 'external provider type = 4');

      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(0, 'correct royalties type');

      const tx1 = await royaltiesRegistry['getRoyalties(address,uint256)'](token, defaultTokenId1);
      await tx1.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(4, 'correct royalties type');
      // console.log('external provider gas used first request', (await tx1.wait()).gasUsed.toString());

      const tx2 = await royaltiesRegistry['getRoyalties(address,uint256)'](token, defaultTokenId2);
      await tx2.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(4, 'correct royalties type');
      // console.log('external provider gas used second request', (await tx2.wait()).gasUsed.toString());
    });

    it('should test royalties type = 5, royalties 2981', async () => {
      const tokenId1 = wallet1.address + 'b00000000000000000000001';
      const tokenId2 = wallet2.address + 'b00000000000000000000002';

      const tx1 = await royaltiesRegistry['getRoyalties(address,uint256)'](
        testERC721WithRoyaltiesV2981.address,
        tokenId1
      );
      await tx1.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(testERC721WithRoyaltiesV2981.address)).to.be.equal(
        5,
        'correct royalties type'
      );
      // console.log('royalties 2981 gas used first request', (await tx1.wait()).gasUsed.toString());

      const tx2 = await royaltiesRegistry['getRoyalties(address,uint256)'](
        testERC721WithRoyaltiesV2981.address,
        tokenId2
      );
      await tx2.wait();
      expect(await royaltiesRegistry.getRoyaltiesType(testERC721WithRoyaltiesV2981.address)).to.be.equal(
        5,
        'correct royalties type'
      );
      // console.log('royalties 2981 gas used second request', (await tx2.wait()).gasUsed.toString());
    });

    it('should test royalties type = 6, no royalties contract', async () => {
      const token = royaltiesRegistry.address;

      await royaltiesRegistry['getRoyalties(address,uint256)'](token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(6, 'type 6 ');
      expect(
        (await royaltiesRegistry.callStatic['getRoyalties(address,uint256)'](token, defaultTokenId1)).length
      ).to.be.equal(0, 'royalties 0');
    });

    it('should change royalties types correctly', async () => {
      const token = royaltiesRegistry.address;

      //firstly type = 6, no royalties
      await royaltiesRegistry['getRoyalties(address,uint256)'](token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(6, 'type 6 ');
      expect(
        (await royaltiesRegistry.callStatic['getRoyalties(address,uint256)'](token, defaultTokenId1)).length
      ).to.be.equal(0, 'royalties 0');

      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);

      // then we set external provider, now type is 4
      await royaltiesRegistry.setProviderByToken(token, testRoyaltiesProvider.address);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(4, 'external provider type = 4');

      // then we use setRoyaltiesByToken
      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, 'setRoyaltiesByToken type = 1');

      // finally clear type
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(0, 'correct royalties type');
    });

    it('should work for royalties types with zero address', async () => {
      expect(await royaltiesRegistry.getRoyaltiesType(ADDRESS_ZERO)).to.be.equal(0, 'unset royalties type = 0');
    });
  });

  describe('royalties types set correctly from external methods', () => {
    it('should test setRoyaltiesByToken sets royalties type = 1', async () => {
      const token = wallet4.address;

      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties);
      expect(await royaltiesRegistry.getProvider(token)).to.be.equal(ADDRESS_ZERO, 'provider is not set');
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(1, 'setRoyaltiesByToken type = 1');

      //forceSetRoyaltiesType = 3
      await royaltiesRegistry.forceSetRoyaltiesType(token, 3);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(3, 'forceSetRoyaltiesType 3');
      expect(await royaltiesRegistry.getProvider(token)).to.be.equal(ADDRESS_ZERO, 'provider is not set');

      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(0, 'clearRoyaltiesType ');
      expect(await royaltiesRegistry.getProvider(token)).to.be.equal(ADDRESS_ZERO, 'provider is not set');
    });

    it('should test setProvider sets royalties type = 4, forceSetRoyaltiesType = 3, clearRoyaltiesType', async () => {
      const token = wallet4.address;
      const provider = wallet5.address;

      await royaltiesRegistry.setProviderByToken(token, provider);
      expect(await royaltiesRegistry.getProvider(token)).to.be.equal(provider, 'setProviderByToken works');
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(4, 'external provider type = 4');

      //forceSetRoyaltiesType = 3
      await royaltiesRegistry.forceSetRoyaltiesType(token, 3);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(3, 'forceSetRoyaltiesType 3');
      expect(await royaltiesRegistry.getProvider(token)).to.be.equal(provider, 'provider is set');

      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(0, 'clearRoyaltiesType ');
      expect(await royaltiesRegistry.getProvider(token)).to.be.equal(provider, 'provider is set');
    });

    it('should test forceSetRoyaltiesType + clearRoyaltiesType', async () => {
      const token = wallet4.address;

      //forceSetRoyaltiesType not from owner
      await expect(royaltiesRegistry.connect(wallet3).forceSetRoyaltiesType(token, 1)).to.be.reverted;

      //can't set royalties type to 0
      await expect(royaltiesRegistry.forceSetRoyaltiesType(token, 0)).to.be.reverted;

      //forceSetRoyaltiesType from 1 to 5 works
      for (let i = 1; i <= 6; i++) {
        await royaltiesRegistry.forceSetRoyaltiesType(token, i);
        expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(i, 'forceSetRoyaltiesType ' + i);
        expect(await royaltiesRegistry.getProvider(token)).to.be.equal(ADDRESS_ZERO, 'provider is not set');
      }

      //can't set royalties type to 7, max value is 6
      await expect(royaltiesRegistry.forceSetRoyaltiesType(token, 7)).to.be.reverted;

      //only owner can clear royalties
      await expect(royaltiesRegistry.connect(wallet3).clearRoyaltiesType(token)).to.be.reverted;

      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.be.equal(0, 'clearRoyaltiesType ');
      expect(await royaltiesRegistry.getProvider(token)).to.be.equal(ADDRESS_ZERO, 'provider is not set');
    });
  });
});
