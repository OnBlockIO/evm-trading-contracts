const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const { expect } = require('chai');
const GhostMarketTransferManagerTest = artifacts.require("GhostMarketTransferManagerTest.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const GhostMarketERC721 = artifacts.require("TestERC721WithRoyalties.sol");
const GhostMarketERC1155 = artifacts.require("TestERC1155WithRoyalties.sol");
const ERC721_V1_Error = artifacts.require("TestERC721WithRoyalties_Error.sol");
const ERC1155_V2_Error = artifacts.require("TestERC1155WithRoyalties_Error.sol");

const { Order, Asset, sign } = require("./order");
const EIP712 = require("./EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const eth = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, enc, encDataV2, id } = require("./assets");

const {
	BN,           // Big Number support
	constants,    // Common constants, like the zero address and largest integers
	expectEvent,  // Assertions for emitted events
	expectRevert, // Assertions for transactions that should fail
	ether
} = require('@openzeppelin/test-helpers');

const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID } = require('./include_in_tesfiles.js')


contract("GhostMarketTransferManagerTest:doTransferTest()", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let t1;
	let t2;
	let protocol = accounts[8];
	console.log("protocol address: ", protocol.address)
	let community = accounts[7];
	console.log("community address: ", community.address)
	let erc721;
	let erc1155;
	let ghostMarketERC721Token;
	let ghostMarketERC1155Token;
	let ghostMarketERC721Token_Error;
	let ghostMarketERC1155Token_Error;
	let erc721TokenId1 = 53;
	let erc1155TokenId1 = 54;
	let erc1155TokenId2 = 55;
	const data = '0x987654321';

	function encDataV1(tuple) {
		return testing.encode(tuple)
	}

	beforeEach(async () => {
		transferProxy = await TransferProxyTest.new();
		console.log("transferProxy address: ", transferProxy.address)
		erc20TransferProxy = await ERC20TransferProxy.new();
		console.log("erc20TransferProxy address: ", erc20TransferProxy.address)
		testing = await GhostMarketTransferManagerTest.new();
		console.log("testing address: ", testing.address)
		await testing.__TransferManager_init(transferProxy.address, erc20TransferProxy.address, 300, community);
		t1 = await TestERC20.new();
		t2 = await TestERC20.new();
		/*ERC721 */
		erc721 = await TestERC721.new(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
		/*ERC1155*/
		erc1155 = await TestERC1155.new(BASE_URI);
		await testing.setFeeReceiver(t1.address, protocol);//
		/*ETH*/
		await testing.setFeeReceiver(eth, protocol);//
		/*NFT 721 RoyalitiesV1*/
		ghostMarketERC721Token = await GhostMarketERC721.new();
		await ghostMarketERC721Token.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
		console.log("ghostMarketERC721Token address: ", ghostMarketERC721Token.address)
		/*1155 RoyalitiesV1*/
		ghostMarketERC1155Token = await GhostMarketERC1155.new();
		await ghostMarketERC1155Token.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
		console.log("ghostMarketERC1155Token address: ", ghostMarketERC1155Token.address)
		/*NFT 721 RoyalitiesV1 with interface error*/
		ghostMarketERC721Token_Error = await ERC721_V1_Error.new(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
		await ghostMarketERC721Token_Error.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
		console.log("ghostMarketERC721Token_Error address: ", ghostMarketERC721Token_Error.address)
		/*NFT 1155 RoyalitiesV2 with interface error*/
		ghostMarketERC1155Token_Error = await ERC1155_V2_Error.new();
		await ghostMarketERC1155Token_Error.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
		console.log("ghostMarketERC1155Token_Error address: ", ghostMarketERC1155Token_Error.address)
	});

	describe("Check doTransfers()", () => {

		it("Transfer from ETH to ERC1155, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepareETH_1155Orders(10)
 			await verifyBalanceChange(accounts[0], 103, () =>
				verifyBalanceChange(accounts[2], -100, () =>
					verifyBalanceChange(protocol, -3, () =>
						testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right,
							{ value: 103, from: accounts[0], gasPrice: 0 }
						)
					)
				)
			);
			assert.equal(await erc1155.balanceOf(accounts[0], erc1155TokenId1), 7);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 3);
		})

		async function prepareETH_1155Orders(t2Amount = 10) {
			await erc1155.mint(accounts[2], erc1155TokenId1, t2Amount);
			await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });

			const left = Order(accounts[0], Asset(ETH, "0x", 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from  ERC721 to ERC1155, (buyer pays 3% fee) of ERC1155 transfer to community, orders dataType == V1", async () => {
			const { left, right } = await prepare721_1155Orders(110)
			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [1, 100], left, right);
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
			assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 96);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 1);
			assert.equal(await erc1155.balanceOf(community, erc1155TokenId1), 3);
		})

		async function prepare721_1155Orders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc1155.mint(accounts[2], erc1155TokenId1, t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });
			/*in this: accounts[3] - address originLeftOrder, 100 - originLeftOrderFee(bp%)*/
			let addrOriginLeft = [[accounts[3], 100], [accounts[5], 300]];
			let addrOriginRight = [[accounts[4], 200], [accounts[6], 400]];
			let encDataLeft = await encDataV1([[[accounts[1], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[2], 10000]], addrOriginRight]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

		it("Transfer from ERC1155 to ERC721, (buyer pays 3% fee) of ERC1155 protocol (buyerFee3%, sallerFee3%)", async () => {
			const { left, right } = await prepare1155O_721rders(105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);
			assert.equal(await erc721.balanceOf(accounts[2]), 0);
			assert.equal(await erc721.balanceOf(accounts[1]), 1);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 100);
			assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 2);
			assert.equal(await erc1155.balanceOf(protocol, erc1155TokenId1), 3);
		})

		async function prepare1155O_721rders(t2Amount = 105) {
			await erc1155.mint(accounts[1], erc1155TokenId1, t2Amount);
			await erc721.mint(accounts[2], erc721TokenId1);
			await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });
			await testing.setFeeReceiver(erc1155.address, protocol);
			const left = Order(accounts[1], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC1155, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare20_1155Orders(105, 10)
			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right);
			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 100);
			assert.equal(await erc1155.balanceOf(accounts[1], erc1155TokenId1), 7);
			assert.equal(await erc1155.balanceOf(accounts[2], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 3);
		})

		async function prepare20_1155Orders(t1Amount = 105, t2Amount = 10) {
			await t1.mint(accounts[1], t1Amount);
			await erc1155.mint(accounts[2], erc1155TokenId1, t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC1155 to ERC20, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare1155_20Orders(10, 105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [7, 100], left, right);
			console.log("--------------- AFTER TRANSFER --------------- ")
			console.log("accounts[3] erc721 balance: ", (await t1.balanceOf(accounts[3])).toString())
			console.log("accounts[4] erc721  balance: ", (await t1.balanceOf(accounts[4])).toString())
			console.log("accounts[3] erc1155 balance: ", (await erc1155.balanceOf(accounts[3], erc1155TokenId2)).toString())
			console.log("accounts[4] erc1155 balance: ", (await erc1155.balanceOf(accounts[4], erc1155TokenId2)).toString())
			console.log("protocol  balance: ", (await t1.balanceOf(protocol)).toString())
			assert.equal(await t1.balanceOf(accounts[3]), 100);
			assert.equal(await t1.balanceOf(accounts[4]), 2);
			assert.equal(await erc1155.balanceOf(accounts[3], erc1155TokenId2), 3);
			assert.equal(await erc1155.balanceOf(accounts[4], erc1155TokenId2), 7);
			assert.equal(await t1.balanceOf(protocol), 3);
		})

		async function prepare1155_20Orders(t1Amount = 10, t2Amount = 105) {
			await erc1155.mint(accounts[3], erc1155TokenId2, t1Amount);
			await t1.mint(accounts[4], t2Amount);
			await erc1155.setApprovalForAll(transferProxy.address, true, { from: accounts[3] });
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[4] });

			const left = Order(accounts[3], Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[4], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155.address, erc1155TokenId2), 7), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC721, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare20_721Orders()

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right);
			console.log("--------------- AFTER TRANSFER --------------- ")
			console.log("accounts[1] erc721 balance: ", (await t1.balanceOf(accounts[1])).toString())
			console.log("accounts[2] erc721  balance: ", (await t1.balanceOf(accounts[2])).toString())
			console.log("accounts[1] erc1155 balance: ", (await erc721.balanceOf(accounts[1])).toString())
			console.log("accounts[2] erc1155 balance: ", (await erc721.balanceOf(accounts[2])).toString())
			console.log("protocol  balance: ", (await t1.balanceOf(protocol)).toString())
			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 100);
			assert.equal(await erc721.balanceOf(accounts[1]), 1);
			assert.equal(await erc721.balanceOf(accounts[2]), 0);
			assert.equal(await t1.balanceOf(protocol), 3);
		})

		async function prepare20_721Orders(t1Amount = 105) {
			await t1.mint(accounts[1], t1Amount);
			await erc721.mint(accounts[2], erc721TokenId1);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC721 to ERC20, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare721_20Orders()
			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [1, 100], left, right);
			assert.equal(await t1.balanceOf(accounts[1]), 100);
			assert.equal(await t1.balanceOf(accounts[2]), 2);
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
			assert.equal(await t1.balanceOf(protocol), 3);
		})

		async function prepare721_20Orders(t1Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t1.mint(accounts[2], t1Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC20, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare2Orders()
			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 200], left, right);
			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[2]), 67);
			assert.equal(await t2.balanceOf(accounts[1]), 200);
			assert.equal(await t2.balanceOf(accounts[2]), 20);
			assert.equal(await t1.balanceOf(protocol), 6);
		})
		async function prepare2Orders(t1Amount = 105, t2Amount = 220) {
			await t1.mint(accounts[1], t1Amount);
			await t2.mint(accounts[2], t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}
	})

	describe("Check doTransfers() with Royalties fees", () => {
		it("Transfer from ERC721(RoyaltiesV1) to ERC20 , protocol fee 3% (buyer pays 3% fee)", async () => {
			console.log("ETH_ASSET_CLASS keccak256 ETH", stringToKeccak256bytes4("ETH"))
			console.log("ERC20_ASSET_CLASS keccak256 ETH", stringToKeccak256bytes4("ERC20"))
			console.log("ERC721_ASSET_CLASS keccak256 ETH", stringToKeccak256bytes4("ERC721"))
			console.log("ERC1155_ASSET_CLASS keccak256 ETH", stringToKeccak256bytes4("ERC1155"))

			const { left, right } = await prepare721V1_20Orders(105)

			console.log("left Order", left)
			console.log("right Order", right)
			console.log("accounts[0] token balance: ", (await t1.balanceOf(accounts[0])).toString())
			console.log("accounts[1] token balance: ", (await t1.balanceOf(accounts[1])).toString())
			console.log("accounts[2] token balance: ", (await t1.balanceOf(accounts[2])).toString())
			console.log("accounts[3] token balance: ", (await t1.balanceOf(accounts[3])).toString())
			console.log("accounts[0] ghostMarketERC721Token balance: ", (await ghostMarketERC721Token.balanceOf(accounts[0])).toString())
			console.log("accounts[1] ghostMarketERC721Token balance: ", (await ghostMarketERC721Token.balanceOf(accounts[1])).toString())
			console.log("protocol token balance: ", (await t1.balanceOf(protocol)).toString())

			expect(await ghostMarketERC721Token.balanceOf(accounts[0])).to.be.bignumber.equal('1')
			assert.equal((await ghostMarketERC721Token.supportsInterface("0xee40ffc1")).toString(), 'true');

			/**  
			 * accounts[1] intial balance 105
			 * 
			 * Selling 1 NFT for 100 ERC20 Token
			 * LibFill [1, 100] makeValue: 1 takeValue: 100
			 * 
			 * accounts[2] gets 10% royalty = 10 
			 * accounts[3] gets 5% royalty = 5
			 * 
			 * protocol accout gets 6% = 6
			 * 
			 * seller accounts[0] will have 82 tokens
			 * buyer accounts[1] will have 2 tokens left after payment
			 * 
			 * contracts/GhostMarketTransferManager.sol LibFeeSide.FeeSide.TAKE will execute
			*/
			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [1, 100], left, right);
			console.log("--------------- AFTER TRANSFER --------------- ")
			console.log("accounts[0] token balance: ", (await t1.balanceOf(accounts[0])).toString())
			console.log("accounts[1] token balance: ", (await t1.balanceOf(accounts[1])).toString())
			console.log("accounts[2] token balance: ", (await t1.balanceOf(accounts[2])).toString())
			console.log("accounts[3] token balance: ", (await t1.balanceOf(accounts[3])).toString())
			console.log("accounts[0] ghostMarketERC721Token balance: ", (await ghostMarketERC721Token.balanceOf(accounts[0])).toString())
			console.log("accounts[1] ghostMarketERC721Token balance: ", (await ghostMarketERC721Token.balanceOf(accounts[1])).toString())
			console.log("protocol token balance: ", (await t1.balanceOf(protocol)).toString())

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 85);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			assert.equal(await ghostMarketERC721Token.balanceOf(accounts[1]), 1);
			assert.equal(await ghostMarketERC721Token.balanceOf(accounts[0]), 0);
			assert.equal(await t1.balanceOf(protocol), 3);
		})
		function stringToKeccak256bytes4(string_to_keccak256) {
			return web3.utils.keccak256(string_to_keccak256).substr(0, 10)
		}

		async function prepare721V1_20Orders(t1Amount = 105) {
			//await ghostMarketERC721Token.mint(accounts[0], erc721TokenId1, []);
			const erc721TokenId1 = 1
			await ghostMarketERC721Token.mintGhost(accounts[0], [[accounts[2], 1000], [accounts[3], 500]], "ext_uri", "", "");
			console.log("minted token id: ", (await ghostMarketERC721Token.getLastTokenID()).toString())

			await t1.mint(accounts[1], t1Amount);
			await ghostMarketERC721Token.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });


			/** 
			 * Order: maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data
			 * 
			 * Asset: assetClass, assetData, value
			 * 
			 * left.makeAsset.assetType.assetClass = ERC721 
			 * left.takeAsset.assetType.assetClass = ERC20
			 * 
			 * right.makeAsset.assetType.assetClass = ERC20
			 * right.takeAsset.assetType.assetClass = ERC721
			 * 
			 * salt: 1
			 * 
			 * start: 0
			 * end: 0
			 *  
			 * dataType: 0xffffffff = 0x00000001 = 1
			 * data: 0x
			 */
			const left = Order(accounts[0], Asset(ERC721, enc(ghostMarketERC721Token.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ghostMarketERC721Token.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from  ERC1155(RoyaltiesV1) to ERC20, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare1155V1_20Orders(8, 105)

			await testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [5, 100], left, right);

			assert.equal(await t1.balanceOf(accounts[1]), 2);
			assert.equal(await t1.balanceOf(accounts[0]), 85);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t1.balanceOf(accounts[3]), 5);
			const erc1155TokenId1 = await getLastTokenID(ghostMarketERC1155Token)
			assert.equal(await ghostMarketERC1155Token.balanceOf(accounts[1], erc1155TokenId1), 5);
			assert.equal(await ghostMarketERC1155Token.balanceOf(accounts[0], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 3);
		})

		async function prepare1155V1_20Orders(t1Amount = 10, t2Amount = 105) {
			
			//await ghostMarketERC1155Token.mintGhost(accounts[0], t1Amount, "", [[accounts[2], 1000], [accounts[3], 500]], "ext_uri", "", "")
			await ghostMarketERC1155Token.mintGhost(accounts[0], t1Amount, data, [{ recipient: accounts[2], value: 1000 }, { recipient: accounts[3], value: 500 }], "ext_uri", "", "")
      //await this.GhostMarketERC1155.mintGhost(transferToAccount, mintAmount, data, [{ recipient: minter, value: value }], "ext_uri", "", "");

			
			const erc1155TokenId1 = await getLastTokenID(ghostMarketERC1155Token)
			console.log("minted token id: ", erc1155TokenId1)

			await t1.mint(accounts[1], t2Amount);
			await ghostMarketERC1155Token.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[0], Asset(ERC1155, enc(ghostMarketERC1155Token.address, erc1155TokenId1), 5), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(ghostMarketERC1155Token.address, erc1155TokenId1), 5), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it.only("Transfer from ETH to ghostMarketERC1155Token, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepareETH_1155V2Orders(10)
			const erc1155TokenId1 = await getLastTokenID(ghostMarketERC1155Token)
			await verifyBalanceChange(accounts[0], 103, () =>
				verifyBalanceChange(accounts[1], -85, () =>
					verifyBalanceChange(accounts[2], -10, () =>
						verifyBalanceChange(accounts[3], -5, () =>
							verifyBalanceChange(protocol, -3, () =>
								testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right,
									{ value: 103, from: accounts[0], gasPrice: 0 }
								)
							)
						)
					)
				)
			);
			assert.equal(await ghostMarketERC1155Token.balanceOf(accounts[0], erc1155TokenId1), 7);
			assert.equal(await ghostMarketERC1155Token.balanceOf(accounts[1], erc1155TokenId1), 3);
		})

		async function prepareETH_1155V2Orders(t2Amount = 10) {
			await ghostMarketERC1155Token.mintGhost(accounts[1], t2Amount, data, [{ recipient: accounts[2], value: 1000 }, { recipient: accounts[3], value: 500 }], "ext_uri", "", "")
			const erc1155TokenId1 = await getLastTokenID(ghostMarketERC1155Token)
			console.log("minted token id: ", erc1155TokenId1)
			await ghostMarketERC1155Token.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			const left = Order(accounts[0], Asset(ETH, "0x", 100), ZERO, Asset(ERC1155, enc(ghostMarketERC1155Token.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC1155, enc(ghostMarketERC1155Token.address, erc1155TokenId1), 7), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC20 to ERC721(RoyaltiesV1 With Error), protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare20_721V1ErOrders(105)
			
			// LibFeeSide.FeeSide.MAKE
			await expectRevert(testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 1], left, right),
			"getRoyalties failed"
			)
			
			assert.equal((await t1.balanceOf(accounts[1])).toString(), "105");
			assert.equal((await t1.balanceOf(accounts[0])).toString(), "0");
			assert.equal((await t1.balanceOf(accounts[2])).toString(), "0");
			assert.equal((await t1.balanceOf(accounts[3])).toString(), "0");
			assert.equal((await ghostMarketERC721Token_Error.balanceOf(accounts[0])).toString(), "1");
			assert.equal((await ghostMarketERC721Token_Error.balanceOf(accounts[1])).toString(), "0");
			assert.equal((await t1.balanceOf(protocol)).toString(), "0");
		})

		async function prepare20_721V1ErOrders(t1Amount = 105) {
			await t1.mint(accounts[1], t1Amount);
			await ghostMarketERC721Token_Error.mintGhost(accounts[0], [[accounts[2], 1000], [accounts[3], 500]], "ext_uri", "", "");
			const erc721TokenId1 = 1
			console.log("minted token id: ", parseInt(await ghostMarketERC721Token_Error.getCurrentCounter())-1)
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await ghostMarketERC721Token_Error.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC721, enc(ghostMarketERC721Token_Error.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[0], Asset(ERC721, enc(ghostMarketERC721Token_Error.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("Transfer from ERC1155(RoyaltiesV2 With Error) to ERC20, protocol fee 3% (buyer pays 3% fee)", async () => {
			const { left, right } = await prepare1155V2_20ErOrders(12, 105)
			await expectRevert(testing.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [5, 100], left, right),
			"getRoyalties failed"
			)

			const erc1155TokenId1 = await getLastTokenID(ghostMarketERC1155Token)
			assert.equal((await t1.balanceOf(accounts[0])).toString(), 0);
			assert.equal((await t1.balanceOf(accounts[1])).toString(), 105);
			assert.equal((await t1.balanceOf(accounts[2])).toString(), 0);
			assert.equal((await t1.balanceOf(accounts[3])).toString(), 0);
			assert.equal((await ghostMarketERC1155Token_Error.balanceOf(accounts[0], erc1155TokenId1)).toString(), 12);
			assert.equal((await ghostMarketERC1155Token_Error.balanceOf(accounts[1], erc1155TokenId1)).toString(), 0);
			assert.equal((await t1.balanceOf(protocol)).toString(), 0);
		})

		async function prepare1155V2_20ErOrders(t1Amount = 12, t2Amount = 105) {
			await ghostMarketERC1155Token_Error.mintGhost(accounts[0], t1Amount, data, [{ recipient: accounts[2], value: 1000 }, { recipient: accounts[3], value: 500 }], "ext_uri", "", "")
			const erc1155TokenId1 = await getLastTokenID(ghostMarketERC1155Token)
			console.log("minted token id: ", (erc1155TokenId1).toString())
			await t1.mint(accounts[1], t2Amount);
			await ghostMarketERC1155Token_Error.setApprovalForAll(transferProxy.address, true, { from: accounts[0] });
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[0], Asset(ERC1155, enc(ghostMarketERC1155Token_Error.address, erc1155TokenId1), 5), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(ghostMarketERC1155Token_Error.address, erc1155TokenId1), 5), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

	})
});
