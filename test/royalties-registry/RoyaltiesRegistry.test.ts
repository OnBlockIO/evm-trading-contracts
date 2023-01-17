/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '../utils/chai-setup';
import {ethers} from 'hardhat';
import {
  RoyaltiesRegistry,
  RoyaltiesRegistryTest,
  TestERC721WithRoyaltiesV2OwnableUpgradeable,
  TestERC721RoyaltyV2Legacy,
  RoyaltiesProviderV2Legacy,
  TestERC721ArtBlocks,
  RoyaltiesProviderArtBlocks,
  TestERC721WithRoyaltyV2981,
} from '../../typechain';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {inReceipt} from '../utils/expectEvent';

describe('RoyaltiesRegistry Test', () => {
  const erc721TokenId1 = 51;
  let royaltiesRegistry: RoyaltiesRegistry;
  let royaltiesRegistryTest: RoyaltiesRegistryTest;
  let testERC721RoyaltyV2OwnUpgrd: TestERC721WithRoyaltiesV2OwnableUpgradeable;
  let testERC721RoyaltyV2Legacy: TestERC721RoyaltyV2Legacy;
  let royaltiesProviderV2Legacy: RoyaltiesProviderV2Legacy;
  let testERC721ArtBlocks: TestERC721ArtBlocks;
  let royaltiesProviderArtBlocks: RoyaltiesProviderArtBlocks;
  let testERC721WithRoyaltiesV2981: TestERC721WithRoyaltyV2981;
  let deployer: SignerWithAddress;
  let wallet1: SignerWithAddress;
  let wallet2: SignerWithAddress;
  let wallet3: SignerWithAddress;
  let wallet4: SignerWithAddress;
  let wallet5: SignerWithAddress;
  let wallet6: SignerWithAddress;
  let wallet7: SignerWithAddress;
  let wallet8: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    wallet1 = accounts[1];
    wallet2 = accounts[2];
    wallet3 = accounts[3];
    wallet4 = accounts[4];
    wallet5 = accounts[5];
    wallet6 = accounts[6];
    wallet7 = accounts[7];
    wallet8 = accounts[8];
    const RoyaltiesRegistry = await ethers.getContractFactory('RoyaltiesRegistry');
    const RoyaltiesRegistryTest = await ethers.getContractFactory('RoyaltiesRegistryTest');
    const TestERC721RoyaltyV2OwnUpgrd = await ethers.getContractFactory('TestERC721WithRoyaltiesV2OwnableUpgradeable');
    const TestERC721RoyaltyV2Legacy = await ethers.getContractFactory('TestERC721RoyaltyV2Legacy');
    const RoyaltiesProviderV2Legacy = await ethers.getContractFactory('RoyaltiesProviderV2Legacy');
    const TestERC721ArtBlocks = await ethers.getContractFactory('TestERC721ArtBlocks');
    const RoyaltiesProviderArtBlocks = await ethers.getContractFactory('RoyaltiesProviderArtBlocks');
    const TestERC721WithRoyaltiesV2981 = await ethers.getContractFactory('TestERC721WithRoyaltyV2981');
    royaltiesRegistry = await RoyaltiesRegistry.deploy();
    await royaltiesRegistry.__RoyaltiesRegistry_init();
    royaltiesRegistryTest = await RoyaltiesRegistryTest.deploy();
    testERC721WithRoyaltiesV2981 = await TestERC721WithRoyaltiesV2981.deploy();
    testERC721RoyaltyV2OwnUpgrd = await TestERC721RoyaltyV2OwnUpgrd.deploy();
    testERC721RoyaltyV2Legacy = await TestERC721RoyaltyV2Legacy.deploy();
    royaltiesProviderV2Legacy = await RoyaltiesProviderV2Legacy.deploy();
    testERC721ArtBlocks = await TestERC721ArtBlocks.deploy();
    royaltiesProviderArtBlocks = await RoyaltiesProviderArtBlocks.deploy();
  });

  describe('RoyaltiesRegistry token supports IERC2981', () => {
    it('should test get royalties by token, use RoyaltiesRegistryTest (event)', async () => {
      const getRoyalties = wallet1.address;
      const tokenId = getRoyalties + 'b00000000000000000000001';
      await testERC721WithRoyaltiesV2981.initialize(); //set 2981 interface

      const part = await (
        await royaltiesRegistryTest._getRoyalties(
          royaltiesRegistry.address,
          testERC721WithRoyaltiesV2981.address,
          tokenId
        )
      ).wait();
      inReceipt(part, 'getRoyaltiesTest', Array([[getRoyalties, ethers.BigNumber.from(1000)]]));
    });

    it('should test get royalties by token, use RoyaltiesRegistry (call)', async () => {
      const getRoyalties = wallet1.address;
      const tokenId = getRoyalties + 'b00000000000000000000001';
      await testERC721WithRoyaltiesV2981.initialize(); //set 2981 interface

      const part = await royaltiesRegistry.callStatic['getRoyalties(address,uint256)'](
        testERC721WithRoyaltiesV2981.address,
        tokenId
      );
      expect(part[0].value).to.be.equal(1000);
      expect(part[0].account).to.be.equal(getRoyalties);
      expect(part.length).to.be.equal(1);
    });
  });

  describe('RoyaltiesRegistry methods', () => {
    it('should test simple V2 royalties', async () => {
      testERC721RoyaltyV2OwnUpgrd.initialize(); //set V2 interface

      await testERC721RoyaltyV2OwnUpgrd.mint(wallet2.address, erc721TokenId1, [
        [wallet5.address, 700],
        [wallet6.address, 800],
        [wallet7.address, 900],
        [wallet8.address, 1000],
      ] as any[]);
      const part = await (
        await royaltiesRegistryTest._getRoyalties(
          royaltiesRegistry.address,
          testERC721RoyaltyV2OwnUpgrd.address,
          erc721TokenId1
        )
      ).wait();
      inReceipt(
        part,
        'getRoyaltiesTest',
        Array([
          [wallet5.address, ethers.BigNumber.from(700)],
          [wallet6.address, ethers.BigNumber.from(800)],
          [wallet7.address, ethers.BigNumber.from(900)],
          [wallet8.address, ethers.BigNumber.from(1000)],
        ])
      );
    });

    it('should test simple V2 royalties, set empty, check empty', async () => {
      await testERC721RoyaltyV2OwnUpgrd.mint(wallet2.address, erc721TokenId1, []); //set royalties by contract empty
      const part = await (
        await royaltiesRegistryTest._getRoyalties(
          royaltiesRegistry.address,
          testERC721RoyaltyV2OwnUpgrd.address,
          erc721TokenId1
        )
      ).wait();
      inReceipt(part, 'getRoyaltiesTest', Array([]));
    });

    it('should test setRoyaltiesByToken, initialize by Owner, emit get', async () => {
      await royaltiesRegistry.setRoyaltiesByToken(wallet5.address, [
        [wallet3.address, 600],
        [wallet4.address, 1100],
      ] as any[]); //set royalties by token and tokenId
      await royaltiesRegistry.setRoyaltiesByToken(wallet5.address, [
        [wallet3.address, 600],
        [wallet4.address, 1100],
      ] as any[]); //set royalties by token and tokenId
      const part = await (
        await royaltiesRegistryTest._getRoyalties(royaltiesRegistry.address, wallet5.address, erc721TokenId1)
      ).wait();
      inReceipt(
        part,
        'getRoyaltiesTest',
        Array([
          [wallet3.address, ethers.BigNumber.from(600)],
          [wallet4.address, ethers.BigNumber.from(1100)],
        ])
      );
    });
  });

  describe('ExternalProviders', () => {
    it('should test using royaltiesProvider v2 legacy', async () => {
      await royaltiesRegistry.setProviderByToken(testERC721RoyaltyV2Legacy.address, royaltiesProviderV2Legacy.address);

      const royaltiesToSet = [[wallet1.address, 1000] as any];
      await testERC721RoyaltyV2Legacy.mint(wallet2.address, erc721TokenId1);
      await testERC721RoyaltyV2Legacy._saveRoyalties(erc721TokenId1, royaltiesToSet);

      const royalties = await royaltiesRegistry.callStatic['getRoyalties(address,uint256)'](
        testERC721RoyaltyV2Legacy.address,
        erc721TokenId1
      );
      expect(royalties[0][0]).to.be.equal(royaltiesToSet[0][0], 'royalty recipient 0');
      expect(royalties[0][1]).to.be.equal(royaltiesToSet[0][1], 'token address 0');
    });

    it('should test using royaltiesProvider artBlocks', async () => {
      const artBlocksAddr = deployer.address;
      const artistAdrr = wallet2.address;
      const addPayeeAddr = wallet4.address;

      const owner = await royaltiesProviderArtBlocks.owner();
      expect(owner).to.be.equal(artBlocksAddr, 'owner');

      const artblocksPercentage = await royaltiesProviderArtBlocks.artblocksPercentage();
      expect(artblocksPercentage).to.be.equal(250, 'artblocksPercentage');

      //setting royaltiesProviderArtBlocks in registry
      await royaltiesRegistry.setProviderByToken(testERC721ArtBlocks.address, royaltiesProviderArtBlocks.address);

      //creating token and setting royalties
      await testERC721ArtBlocks.mint(artistAdrr, erc721TokenId1);
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 44);
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

      //getting royalties for testERC721ArtBlocks
      const royaltiesFromProvider = await royaltiesProviderArtBlocks.getRoyalties(
        testERC721ArtBlocks.address,
        erc721TokenId1
      );

      expect(royaltiesFromProvider[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider[0].value).to.be.equal(250, 'artBlocks royalty percentage');

      expect(royaltiesFromProvider[1].account).to.be.equal(artistAdrr, 'artist royalty address');
      expect(royaltiesFromProvider[1].value).to.be.equal(840, 'artBlocks royalty percentage');

      expect(royaltiesFromProvider[2].account).to.be.equal(addPayeeAddr, 'additional payee royalty address');
      expect(royaltiesFromProvider[2].value).to.be.equal(660, 'additional payee royalty percentage');

      //changing artBlocksAddr
      const newArtBlocksAddr = wallet6.address;
      const txSetAddr = await (
        await royaltiesProviderArtBlocks.connect(deployer).transferOwnership(newArtBlocksAddr)
      ).wait();
      inReceipt(txSetAddr, 'OwnershipTransferred', {
        previousOwner: artBlocksAddr,
        newOwner: newArtBlocksAddr,
      });

      await expect(royaltiesProviderArtBlocks.connect(deployer).transferOwnership(newArtBlocksAddr)).to.be.reverted;

      //checking royalties
      const royalties = await royaltiesRegistry.callStatic['getRoyalties(address,uint256)'](
        testERC721ArtBlocks.address,
        erc721TokenId1
      );

      expect(royalties[0].account).to.be.equal(newArtBlocksAddr, 'artBlocks addr');
      expect(royalties[0].value).to.be.equal(250, 'artBlocks value');

      expect(royalties[1].account).to.be.equal(artistAdrr, 'artist addr');
      expect(royalties[1].value).to.be.equal(840, 'artist value');

      expect(royalties[2].account).to.be.equal(addPayeeAddr, 'additional payee addr');
      expect(royalties[2].value).to.be.equal(660, 'additional payee value');

      //setting new artblocksPercentage
      const txChangePercentage = await (
        await royaltiesProviderArtBlocks.connect(wallet6).setArtblocksPercentage(300)
      ).wait();
      inReceipt(txChangePercentage, 'ArtblocksPercentageChanged', {
        _who: newArtBlocksAddr,
        _old: 250,
        _new: 300,
      });

      //only owner can set %
      await expect(royaltiesProviderArtBlocks.connect(deployer).setArtblocksPercentage(0)).to.be.reverted;

      //_artblocksPercentage can't be over 10000
      await expect(royaltiesProviderArtBlocks.connect(wallet6).setArtblocksPercentage(100000)).to.be.reverted;
    });

    it('should test using royaltiesProvider artBlocks royalties edge cases', async () => {
      const artBlocksAddr = deployer.address;
      const artistAdrr = wallet2.address;
      const addPayeeAddr = wallet4.address;

      const owner = await royaltiesProviderArtBlocks.owner();
      expect(owner).to.be.equal(artBlocksAddr, 'owner');

      const artblocksPercentage = await royaltiesProviderArtBlocks.artblocksPercentage();
      expect(artblocksPercentage).to.be.equal(250, 'artblocksPercentage');

      //setting RoyaltiesProviderArtBlocks in registry
      await royaltiesRegistry.setProviderByToken(testERC721ArtBlocks.address, royaltiesProviderArtBlocks.address);

      //creating token and setting royalties
      await testERC721ArtBlocks.mint(artistAdrr, erc721TokenId1);
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

      //getting royalties for testERC721ArtBlocks
      //case artist = 15% additionalPatee = 0
      const royaltiesFromProvider = await royaltiesProviderArtBlocks.getRoyalties(
        testERC721ArtBlocks.address,
        erc721TokenId1
      );
      expect(royaltiesFromProvider[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider[0].value).to.be.equal(250, 'artBlocks royalty percentage');

      expect(royaltiesFromProvider[1].account).to.be.equal(artistAdrr, 'artist royalty address');
      expect(royaltiesFromProvider[1].value).to.be.equal(1500, 'artBlocks royalty percentage');

      expect(royaltiesFromProvider.length).to.be.equal(2, 'should be 2 royalties');

      //case artist = 15%, additionalPayee = 100% of 15%
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 100);
      const royaltiesFromProvider2 = await royaltiesProviderArtBlocks.getRoyalties(
        testERC721ArtBlocks.address,
        erc721TokenId1
      );

      expect(royaltiesFromProvider2[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider2[0].value).to.be.equal(250, 'artBlocks royalty percentage');

      expect(royaltiesFromProvider2[1].account).to.be.equal(addPayeeAddr, 'artist royalty address');
      expect(royaltiesFromProvider2[1].value).to.be.equal(1500, 'artBlocks royalty percentage');

      expect(royaltiesFromProvider2.length).to.be.equal(2, 'should be 2 royalties');

      //case additionalPayee > 100
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 110);
      await expect(royaltiesProviderArtBlocks.getRoyalties(testERC721ArtBlocks.address, erc721TokenId1)).revertedWith(
        'wrong royalties percentages from artBlocks'
      );
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);

      //case artist > 100
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 110);
      await expect(royaltiesProviderArtBlocks.getRoyalties(testERC721ArtBlocks.address, erc721TokenId1)).revertedWith(
        'wrong royalties percentages from artBlocks'
      );
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 0);

      //case artist = 0, additionalPayee = 0
      const royaltiesFromProvider3 = await royaltiesProviderArtBlocks.getRoyalties(
        testERC721ArtBlocks.address,
        erc721TokenId1
      );
      expect(royaltiesFromProvider3[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider3[0].value).to.be.equal(250, 'artBlocks royalty percentage');
      expect(royaltiesFromProvider3.length).to.be.equal(1, 'should be 1 royalties');

      //case artist = 0, additionalPayee = 0, artBlocks = 0
      await royaltiesProviderArtBlocks.setArtblocksPercentage(0, {from: artBlocksAddr});
      const royaltiesFromProvider4 = await royaltiesProviderArtBlocks.getRoyalties(
        testERC721ArtBlocks.address,
        erc721TokenId1
      );
      expect(royaltiesFromProvider4.length).to.be.equal(0, 'should be 0 royalties');
    });
  });
});
