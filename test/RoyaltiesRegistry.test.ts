/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from './utils/chai-setup';
import {ethers, upgrades} from 'hardhat';
import {
  RoyaltiesRegistry,
  RoyaltiesRegistryTest,
  TestERC721WithRoyaltiesV2OwnableUpgradeable,
  TestERC721RoyaltyV2Legacy,
  RoyaltiesProviderV2Legacy,
  TestERC721ArtBlocks,
  RoyaltiesProviderArtBlocks,
  TestERC721WithRoyaltyV2981,
  GhostMarketERC721,
} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {BASE_URI, TOKEN_NAME, TOKEN_SYMBOL} from './utils/constants';

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
  let ghostERC721: GhostMarketERC721;
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
    const GhostMarketERC721 = await ethers.getContractFactory('GhostMarketERC721');
    royaltiesRegistry = await RoyaltiesRegistry.deploy();
    await royaltiesRegistry.__RoyaltiesRegistry_init();
    royaltiesRegistryTest = await RoyaltiesRegistryTest.deploy();
    testERC721WithRoyaltiesV2981 = await TestERC721WithRoyaltiesV2981.deploy();
    testERC721RoyaltyV2OwnUpgrd = await TestERC721RoyaltyV2OwnUpgrd.deploy();
    testERC721RoyaltyV2Legacy = await TestERC721RoyaltyV2Legacy.deploy();
    royaltiesProviderV2Legacy = await RoyaltiesProviderV2Legacy.deploy();
    testERC721ArtBlocks = await TestERC721ArtBlocks.deploy();
    royaltiesProviderArtBlocks = await RoyaltiesProviderArtBlocks.deploy();
    ghostERC721 = <GhostMarketERC721>(<unknown>await upgrades.deployProxy(
      GhostMarketERC721,
      [TOKEN_NAME, TOKEN_SYMBOL, BASE_URI],
      {
        initializer: 'initialize',
        unsafeAllowCustomTypes: true,
      }
    ));
  });

  describe('RoyaltiesRegistry token supports IERC2981', () => {
    it('should test get royalties by token, use RoyaltiesRegistryTest (event)', async () => {
      const getRoyalties = await wallet1.getAddress();
      const tokenId = getRoyalties + 'b00000000000000000000001';
      await testERC721WithRoyaltiesV2981.initialize(); //set 2981 interface

      await (
        await royaltiesRegistryTest._getRoyalties(
          await royaltiesRegistry.getAddress(),
          await testERC721WithRoyaltiesV2981.getAddress(),
          tokenId
        )
      ).wait();

      const filter = royaltiesRegistryTest.filters.GetRoyaltiesTest;
      const events = await royaltiesRegistryTest.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('GetRoyaltiesTest');
      const args = event.args;
      expect(Array(args[0])).to.deep.equal(Array([[getRoyalties, BigInt(1000)]]));
    });

    it('should test get royalties by token, use RoyaltiesRegistry (call)', async () => {
      const getRoyalties = await wallet1.getAddress();
      const tokenId = getRoyalties + 'b00000000000000000000001';
      await testERC721WithRoyaltiesV2981.initialize(); //set 2981 interface

      const part = await royaltiesRegistry['getRoyalties(address,uint256)'].staticCall(
        await testERC721WithRoyaltiesV2981.getAddress(),
        tokenId
      );
      expect(part[0].value).to.be.equal(BigInt(1000));
      expect(part[0].account).to.be.equal(getRoyalties);
      expect(part.length).to.be.equal(1);
    });
  });

  describe('RoyaltiesRegistry methods', () => {
    it('should test simple V2 royalties', async () => {
      testERC721RoyaltyV2OwnUpgrd.initialize(); //set V2 interface

      await testERC721RoyaltyV2OwnUpgrd.mint(await wallet2.getAddress(), erc721TokenId1, [
        [await wallet5.getAddress(), 700],
        [await wallet6.getAddress(), 800],
        [await wallet7.getAddress(), 900],
        [await wallet8.getAddress(), 1000],
      ] as any[]);
      await (
        await royaltiesRegistryTest._getRoyalties(
          await royaltiesRegistry.getAddress(),
          await testERC721RoyaltyV2OwnUpgrd.getAddress(),
          erc721TokenId1
        )
      ).wait();

      const filter = royaltiesRegistryTest.filters.GetRoyaltiesTest;
      const events = await royaltiesRegistryTest.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('GetRoyaltiesTest');
      const args = event.args;
      expect(Array(args[0])).to.deep.equal(
        Array([
          [await wallet5.getAddress(), BigInt(700)],
          [await wallet6.getAddress(), BigInt(800)],
          [await wallet7.getAddress(), BigInt(900)],
          [await wallet8.getAddress(), BigInt(1000)],
        ])
      );
    });

    it('should test ghostmarket royalties', async () => {
      await ghostERC721.mintGhost(
        await wallet1.getAddress(),
        [
          {recipient: await wallet2.getAddress(), value: 300},
          {recipient: await wallet3.getAddress(), value: 400},
        ],
        'ext_uri',
        ''
      );
      const erc721TokenId1 = (await ghostERC721.getLastTokenID()).toString();
      await (
        await royaltiesRegistryTest._getRoyalties(
          await royaltiesRegistry.getAddress(),
          await ghostERC721.getAddress(),
          erc721TokenId1
        )
      ).wait();

      const filter = royaltiesRegistryTest.filters.GetRoyaltiesTest;
      const events = await royaltiesRegistryTest.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('GetRoyaltiesTest');
      const args = event.args;
      expect(Array(args[0])).to.deep.equal(
        Array([
          [await wallet2.getAddress(), BigInt(300)],
          [await wallet3.getAddress(), BigInt(400)],
        ])
      );
    });

    it('should test simple V2 royalties, set empty, check empty', async () => {
      await testERC721RoyaltyV2OwnUpgrd.mint(await wallet2.getAddress(), erc721TokenId1, []); //set royalties by contract empty
      await (
        await royaltiesRegistryTest._getRoyalties(
          await royaltiesRegistry.getAddress(),
          await testERC721RoyaltyV2OwnUpgrd.getAddress(),
          erc721TokenId1
        )
      ).wait();

      const filter = royaltiesRegistryTest.filters.GetRoyaltiesTest;
      const events = await royaltiesRegistryTest.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('GetRoyaltiesTest');
      const args = event.args;
      expect(Array(args[0])).to.deep.equal(Array([]));
    });

    it('should test setRoyaltiesByToken, initialize by Owner, emit get', async () => {
      await royaltiesRegistry.setRoyaltiesByToken(await wallet5.getAddress(), [
        [await wallet3.getAddress(), 600],
        [await wallet4.getAddress(), 1100],
      ] as any[]); //set royalties by token and tokenId
      await royaltiesRegistry.setRoyaltiesByToken(await wallet5.getAddress(), [
        [await wallet3.getAddress(), 600],
        [await wallet4.getAddress(), 1100],
      ] as any[]); //set royalties by token and tokenId
      await (
        await royaltiesRegistryTest._getRoyalties(
          await royaltiesRegistry.getAddress(),
          await wallet5.getAddress(),
          erc721TokenId1
        )
      ).wait();

      const filter = royaltiesRegistryTest.filters.GetRoyaltiesTest;
      const events = await royaltiesRegistryTest.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('GetRoyaltiesTest');
      const args = event.args;
      expect(Array(args[0])).to.deep.equal(
        Array([
          [await wallet3.getAddress(), BigInt(600)],
          [await wallet4.getAddress(), BigInt(1100)],
        ])
      );
    });
  });

  describe('ExternalProviders', () => {
    it('should test using royaltiesProvider v2 legacy', async () => {
      await royaltiesRegistry.setProviderByToken(
        await testERC721RoyaltyV2Legacy.getAddress(),
        await royaltiesProviderV2Legacy.getAddress()
      );

      const royaltiesToSet = [[await wallet1.getAddress(), 1000] as any];
      await testERC721RoyaltyV2Legacy.mint(await wallet2.getAddress(), erc721TokenId1);
      await testERC721RoyaltyV2Legacy._saveRoyalties(erc721TokenId1, royaltiesToSet);

      const royalties = await royaltiesRegistry['getRoyalties(address,uint256)'].staticCall(
        await testERC721RoyaltyV2Legacy.getAddress(),
        erc721TokenId1
      );

      expect(royalties[0][0]).to.be.equal(royaltiesToSet[0][0], 'royalty recipient 0');
      expect(royalties[0][1]).to.be.equal(BigInt(royaltiesToSet[0][1]), 'royalty value 0');
    });

    it('should test using royaltiesProvider artBlocks', async () => {
      const artBlocksAddr = await deployer.getAddress();
      const artistAdrr = await wallet2.getAddress();
      const addPayeeAddr = await wallet4.getAddress();

      const owner = await royaltiesProviderArtBlocks.owner();
      expect(owner).to.be.equal(artBlocksAddr, 'owner');

      const artblocksPercentage = await royaltiesProviderArtBlocks.artblocksPercentage();
      expect(artblocksPercentage).to.be.equal(BigInt(250), 'artblocksPercentage');

      //setting royaltiesProviderArtBlocks in registry
      await royaltiesRegistry.setProviderByToken(
        await testERC721ArtBlocks.getAddress(),
        await royaltiesProviderArtBlocks.getAddress()
      );

      //creating token and setting royalties
      await testERC721ArtBlocks.mint(artistAdrr, erc721TokenId1);
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 44);
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

      //getting royalties for testERC721ArtBlocks
      const royaltiesFromProvider = await royaltiesProviderArtBlocks.getRoyalties(
        await testERC721ArtBlocks.getAddress(),
        erc721TokenId1
      );

      expect(royaltiesFromProvider[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider[0].value).to.be.equal(BigInt(250), 'artBlocks royalty percentage');

      expect(royaltiesFromProvider[1].account).to.be.equal(artistAdrr, 'artist royalty address');
      expect(royaltiesFromProvider[1].value).to.be.equal(BigInt(840), 'artBlocks royalty percentage');

      expect(royaltiesFromProvider[2].account).to.be.equal(addPayeeAddr, 'additional payee royalty address');
      expect(royaltiesFromProvider[2].value).to.be.equal(BigInt(660), 'additional payee royalty percentage');

      //changing artBlocksAddr
      const newArtBlocksAddr = await wallet6.getAddress();
      await (await royaltiesProviderArtBlocks.connect(deployer).transferOwnership(newArtBlocksAddr)).wait();

      const filter = royaltiesProviderArtBlocks.filters.OwnershipTransferred;
      const events = await royaltiesProviderArtBlocks.queryFilter(filter, -1);
      const event = events[0];
      expect(event.fragment.name).to.equal('OwnershipTransferred');
      const args = event.args;
      expect(args.previousOwner).to.equal(artBlocksAddr);
      expect(args.newOwner).to.equal(newArtBlocksAddr);

      await expect(royaltiesProviderArtBlocks.connect(deployer).transferOwnership(newArtBlocksAddr)).to.be.reverted;

      //checking royalties
      const royalties = await royaltiesRegistry['getRoyalties(address,uint256)'].staticCall(
        await testERC721ArtBlocks.getAddress(),
        erc721TokenId1
      );

      expect(royalties[0].account).to.be.equal(newArtBlocksAddr, 'artBlocks addr');
      expect(royalties[0].value).to.be.equal(BigInt(250), 'artBlocks value');

      expect(royalties[1].account).to.be.equal(artistAdrr, 'artist addr');
      expect(royalties[1].value).to.be.equal(BigInt(840), 'artist value');

      expect(royalties[2].account).to.be.equal(addPayeeAddr, 'additional payee addr');
      expect(royalties[2].value).to.be.equal(BigInt(660), 'additional payee value');

      //setting new artblocksPercentage
      await (await royaltiesProviderArtBlocks.connect(wallet6).setArtblocksPercentage(300)).wait();

      const filter2 = royaltiesProviderArtBlocks.filters.ArtblocksPercentageChanged;
      const events2 = await royaltiesProviderArtBlocks.queryFilter(filter2, -1);
      const event2 = events2[0];
      expect(event2.fragment.name).to.equal('ArtblocksPercentageChanged');
      const args2 = event2.args;
      expect(args2._who).to.equal(newArtBlocksAddr);
      expect(args2._old).to.equal(BigInt(250));
      expect(args2._new).to.equal(BigInt(300));

      //only owner can set %
      await expect(royaltiesProviderArtBlocks.connect(deployer).setArtblocksPercentage(0)).to.be.reverted;

      //_artblocksPercentage can't be over 10000
      await expect(royaltiesProviderArtBlocks.connect(wallet6).setArtblocksPercentage(100000)).to.be.reverted;
    });

    it('should test using royaltiesProvider artBlocks royalties edge cases', async () => {
      const artBlocksAddr = await deployer.getAddress();
      const artistAdrr = await wallet2.getAddress();
      const addPayeeAddr = await wallet4.getAddress();

      const owner = await royaltiesProviderArtBlocks.owner();
      expect(owner).to.be.equal(artBlocksAddr, 'owner');

      const artblocksPercentage = await royaltiesProviderArtBlocks.artblocksPercentage();
      expect(artblocksPercentage).to.be.equal(BigInt(250), 'artblocksPercentage');

      //setting RoyaltiesProviderArtBlocks in registry
      await royaltiesRegistry.setProviderByToken(
        await testERC721ArtBlocks.getAddress(),
        await royaltiesProviderArtBlocks.getAddress()
      );

      //creating token and setting royalties
      await testERC721ArtBlocks.mint(artistAdrr, erc721TokenId1);
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15);

      //getting royalties for testERC721ArtBlocks
      //case artist = 15% additionalPatee = 0
      const royaltiesFromProvider = await royaltiesProviderArtBlocks.getRoyalties(
        await testERC721ArtBlocks.getAddress(),
        erc721TokenId1
      );
      expect(royaltiesFromProvider[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider[0].value).to.be.equal(BigInt(250), 'artBlocks royalty percentage');

      expect(royaltiesFromProvider[1].account).to.be.equal(artistAdrr, 'artist royalty address');
      expect(royaltiesFromProvider[1].value).to.be.equal(BigInt(1500), 'artBlocks royalty percentage');

      expect(royaltiesFromProvider.length).to.be.equal(2, 'should be 2 royalties');

      //case artist = 15%, additionalPayee = 100% of 15%
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 100);
      const royaltiesFromProvider2 = await royaltiesProviderArtBlocks.getRoyalties(
        await testERC721ArtBlocks.getAddress(),
        erc721TokenId1
      );

      expect(royaltiesFromProvider2[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider2[0].value).to.be.equal(BigInt(250), 'artBlocks royalty percentage');

      expect(royaltiesFromProvider2[1].account).to.be.equal(addPayeeAddr, 'artist royalty address');
      expect(royaltiesFromProvider2[1].value).to.be.equal(BigInt(1500), 'artBlocks royalty percentage');

      expect(royaltiesFromProvider2.length).to.be.equal(2, 'should be 2 royalties');

      //case additionalPayee > 100
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 110);
      await expect(
        royaltiesProviderArtBlocks.getRoyalties(await testERC721ArtBlocks.getAddress(), erc721TokenId1)
      ).revertedWith('wrong royalties percentages from artBlocks');
      await testERC721ArtBlocks.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0);

      //case artist > 100
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 110);
      await expect(
        royaltiesProviderArtBlocks.getRoyalties(await testERC721ArtBlocks.getAddress(), erc721TokenId1)
      ).revertedWith('wrong royalties percentages from artBlocks');
      await testERC721ArtBlocks.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 0);

      //case artist = 0, additionalPayee = 0
      const royaltiesFromProvider3 = await royaltiesProviderArtBlocks.getRoyalties(
        await testERC721ArtBlocks.getAddress(),
        erc721TokenId1
      );
      expect(royaltiesFromProvider3[0].account).to.be.equal(artBlocksAddr, 'artBlocks royalty address');
      expect(royaltiesFromProvider3[0].value).to.be.equal(BigInt(250), 'artBlocks royalty percentage');
      expect(royaltiesFromProvider3.length).to.be.equal(1, 'should be 1 royalties');

      //case artist = 0, additionalPayee = 0, artBlocks = 0
      await royaltiesProviderArtBlocks.setArtblocksPercentage(0, {from: artBlocksAddr});
      const royaltiesFromProvider4 = await royaltiesProviderArtBlocks.getRoyalties(
        await testERC721ArtBlocks.getAddress(),
        erc721TokenId1
      );
      expect(royaltiesFromProvider4.length).to.be.equal(0, 'should be 0 royalties');
    });
  });
});
