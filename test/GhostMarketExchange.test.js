const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeV2 = artifacts.require("TestExchangeV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const ERC1155_V2 = artifacts.require("TestERC1155WithRoyalties.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyalties.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");
const GhostMarketTransferManagerTest = artifacts.require("GhostMarketTransferManagerTest.sol");
const TestERC721RoyaltyV1OwnUpgrd = artifacts.require("TestERC721WithRoyaltiesV1OwnableUpgradeable");
const { getAccountAddresses } = require('./generatedWallets');


const truffleAssert = require('truffle-assertions');
const { Order, Asset, sign } = require("./order");
const EIP712 = require("./EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("./assets");

const {
	BN,           // Big Number support
	constants,    // Common constants, like the zero address and largest integers
	expectEvent,  // Assertions for emitted events
	expectRevert, // Assertions for transactions that should fail
	ether
} = require('@openzeppelin/test-helpers');

const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID, advanceTimeAndBlock, advanceBlock } = require('./include_in_tesfiles.js')

//if true use provider addresses
let useProviderAccounts = false

contract("ExchangeV2", accounts => {
	if (useProviderAccounts) {
		accounts = getAccountAddresses()
	}
	console.log("accounts: ", accounts);
	let network = process.env.NETWORK;
	console.log("network: ", network);
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let t1;
	let t2;
	let libOrder;
	let protocol = accounts[8];
	let community = accounts[7];
	const eth = "0x0000000000000000000000000000000000000000";
	let erc721TokenId0 = 52;
	let erc721TokenId1 = 53;
	let erc1155TokenId1 = 54;
	let erc1155TokenId2 = 55;
	const data = '0x987654321'
	const protocolFeeBP = 300
	let protocolFeePercent

	let do_not_deploy = true

	beforeEach(async () => {
		if (network === 'rinkeby_nodeploy' && do_not_deploy) {
			transferProxy = await TransferProxy.at('0x823073A64706CEcC1C4531dD9CcAC352B948D1Ab');
			console.log("transferProxy: ", transferProxy.address)
			erc20TransferProxy = await ERC20TransferProxy.at('0x36B5e98FEB96245d9261112832147f511fF8Ea57');
			//testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, protocol], { initializer: "__ExchangeV2_init" });
			testing = await ExchangeV2.at('0x626F160cdC49928C3503066Fe6317550902c9Fff');
			console.log("ExchangeV2: ", testing.address);
			transferManagerTest = await GhostMarketTransferManagerTest.at('0xBd69414245d9f097a3731421566273De1Cd01aD4');
			console.log("transferManagerTest: ", transferManagerTest.address);
			t1 = await TestERC20.at('0x925405a516dCaE474ad21722A36Af8De3f918712');
			console.log("t1: ", t1.address)
			//set protocol fee and fee address

			//fee receiver for ETH transfer is the protocol address
			//await testing.setFeeReceiver(eth, protocol);

			//fee receiver for Token t1 transfer is the protocol address
			//await testing.setFeeReceiver(t1.address, protocol);

			erc721 = await TestERC721.at("0x65F7b6b9270b26f469690289A086222ec07C678F");
			console.log("erc721: ", erc721.address)

			// ERC1155V2
			erc1155_v2 = await ERC1155_V2.at('0xc2D2BdeC47dd8f7fd24A077819A682B049Fd5d41');
			console.log("GhostERC1155contract: ", erc1155_v2.address);
			// ERC721_V1
			erc721V1 = await ERC721_V1.at('0x02D68a52FA654B9e95A81dE867dE2f444c7f3f26');
			console.log("erc721V1: ", erc721V1.address);


			/* 	
			//ERC721
			erc721 = await TestERC721.new("Test ERC721", "TERC721", BASE_URI);
			console.log("erc721: ", erc721.address)

			//ERC1155V2
			erc1155_v2 = await ERC1155_V2.new();
			await erc1155_v2.initialize(TOKEN_NAME+" ERC1155", "ERC1155"+TOKEN_SYMBOL, BASE_URI);
			console.log("erc1155_v2: ", erc1155_v2.address)
			//ERC721_V1
			erc721V1 = await ERC721_V1.new();
			await erc721V1.initialize(TOKEN_NAME+" ERC721", "ERC721"+TOKEN_SYMBOL, BASE_URI);
			console.log("erc721V1: ", erc721V1.address) 
									*/
		} else if (network === 'ropsten_nodeploy' && do_not_deploy) {
			transferProxy = await TransferProxy.at('0x6f78C78a08a264F597AB6D64dbC271b00e0ea4c7');
			console.log("transferProxy: ", transferProxy.address)
			erc20TransferProxy = await ERC20TransferProxy.at('0x3d7C1397a73ff9A35BACF603Af7e33d5e786F38b');
			console.log("erc20TransferProxy: ", erc20TransferProxy.address);
			testing = await ExchangeV2.at('0x6F09aC108949Cf9eB508605B9Fc7c95e2F9c7551');
			console.log("ExchangeV2: ", testing.address);
			transferManagerTest = await GhostMarketTransferManagerTest.at('0xB5cCbc8c004a8aEE69f54501Bf04180BFEf885F3');
			console.log("transferManagerTest: ", transferManagerTest.address);
			t1 = await TestERC20.at('0xDd5A7F7F25D6Bb38CcFB45b8e29521f317cad3d5');
			console.log("t1: ", t1.address)
			//set protocol fee and fee address

			//fee receiver for ETH transfer is the protocol address
			//await testing.setFeeReceiver(eth, protocol);

			//fee receiver for Token t1 transfer is the protocol address
			//await testing.setFeeReceiver(t1.address, protocol);

			erc721 = await TestERC721.at("0xB5cCbc8c004a8aEE69f54501Bf04180BFEf885F3");
			console.log("erc721: ", erc721.address)

			// ERC1155V2
			erc1155_v2 = await ERC1155_V2.at('0x3Df90cb09d4Ae8AA4CFBD031c5fF071c48735478');
			console.log("GhostERC1155contract: ", erc1155_v2.address);
			// ERC721_V1
			erc721V1 = await ERC721_V1.at('0x594CFdB9968E71F521820B9869F4846Fd12cdcF4');
			console.log("erc721V1: ", erc721V1.address);
		}
		// deploy everything
		else {
			libOrder = await LibOrderTest.new();
			console.log("libOrder: ", libOrder.address)
			transferProxy = await TransferProxy.new();
			await transferProxy.__TransferProxy_init();

			console.log("transferProxy: ", transferProxy.address)

			erc20TransferProxy = await ERC20TransferProxy.new();
			await erc20TransferProxy.__ERC20TransferProxy_init();

			console.log("erc20TransferProxy: ", erc20TransferProxy.address)
			//set protocol fee and fee address
			testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, protocolFeeBP, community, protocol], { initializer: "__ExchangeV2_init" });
			console.log("testing: ", testing.address)
			transferManagerTest = await GhostMarketTransferManagerTest.new();
			console.log("transferManagerTest: ", transferManagerTest.address)
			t1 = await TestERC20.new();
			console.log("t1: ", t1.address)
			t2 = await TestERC20.new();
			console.log("t2: ", t2.address)
			/*ETH*/
			//fee receiver for ETH transfer is the protocol address
			await testing.setFeeReceiver(eth, protocol);
			//fee receiver for Token t1 transfer is the protocol address
			await testing.setFeeReceiver(t1.address, protocol);
			/*ERC721 */
			erc721 = await TestERC721.new("Test ERC721", "TERC721", BASE_URI);
			console.log("erc721: ", transferManagerTest.address)
			/*ERC1155V2*/
			erc1155_v2 = await ERC1155_V2.new();
			await erc1155_v2.initialize(TOKEN_NAME + " ERC1155", "ERC1155" + TOKEN_SYMBOL, BASE_URI);
			console.log("erc1155_v2: ", erc1155_v2.address)
			/*ERC721_V1 */
			erc721V1 = await ERC721_V1.new();
			await erc721V1.initialize(TOKEN_NAME + " ERC721", "ERC721" + TOKEN_SYMBOL, BASE_URI);
			console.log("erc721V1: ", erc721V1.address)
		}
		await transferProxy.addOperator(testing.address)
		await erc20TransferProxy.addOperator(testing.address)
		protocolFeePercent = protocolFeeBP / 10000
	});


	describe("matchOrders", () => {
		it("eth orders, ERC20 token transfer, expect revert, transfer failed ", async () => {
			await t1.mint(accounts[1], 100);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			//value is too low for transfer
			await expectRevert(
				testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 199, gasPrice: 0 }),
				"transfer failed"
			);
		})

		it("eth orders work, expect revert, unknown Data type of Order ", async () => {
			await t1.mint(accounts[1], 100);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xfffffffe", "0x");
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			await expectRevert(
				testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300 }),
				"Unknown Order data type"
			);
		})

		it("eth orders work, rest is returned to taker (other side) ", async () => {
			await t1.mint(accounts[1], 100);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 206, async () =>
				verifyBalanceChange(accounts[1], -200, async () =>
					verifyBalanceChange(protocol, -6, () =>
						testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
					)
				)
			)
			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[2]), 100);
		})
	})

	describe("Do matchOrders(), orders dataType == V1", () => {
		it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties ", async () => {
			const { left, right } = await prepare2Orders()
			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
			assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);
			assert.equal(await t1.balanceOf(accounts[1]), 0); //=104 - (100amount + 3byuerFee + 1 originleft)
			assert.equal(await t1.balanceOf(accounts[2]), 98);//=100 - 2 originRight
			assert.equal(await t1.balanceOf(accounts[3]), 1); // 1 originleft
			assert.equal(await t1.balanceOf(accounts[4]), 2); // 2 originRight
			assert.equal(await t2.balanceOf(accounts[1]), 200);
			assert.equal(await t2.balanceOf(accounts[2]), 0);
		})

		it("From ERC20(10) to ERC20(20) Protocol, no fees because of rounding", async () => {
			const { left, right } = await prepare2Orders(10, 20, 10, 20)
			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
			assert.equal(await testing.fills(await libOrder.hashKey(left)), 20);
			assert.equal(await t1.balanceOf(accounts[1]), 0);
			assert.equal(await t1.balanceOf(accounts[2]), 10);
			assert.equal(await t2.balanceOf(accounts[1]), 20);
			assert.equal(await t2.balanceOf(accounts[2]), 0);
		})

		async function prepare2Orders(t1Amount = 104, t2Amount = 200, makeAmount = 100, takeAmount = 200) {
			await t1.mint(accounts[1], t1Amount);
			await t2.mint(accounts[2], t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], makeAmount]];
			let addrOriginRight = [[accounts[4], takeAmount]];
			let encDataLeft = await encDataV1([[[accounts[1], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[2], 10000]], addrOriginRight]);
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), makeAmount), ZERO, Asset(ERC20, enc(t2.address), takeAmount), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), takeAmount), ZERO, Asset(ERC20, enc(t1.address), makeAmount), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

		// if left = Order has Asset ERC721 the fees will go to community address
		it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties ", async () => {
			const { left, right } = await prepare721DV1_20rders()
			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
			assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);
			assert.equal(await t2.balanceOf(accounts[1]), 97);	//=100 - 2originRight -1originleft
			assert.equal(await t2.balanceOf(accounts[2]), 2);		//=105 - (100amountFrom ERC20(DataV1) to ERC721(RoyalytiV2, DataV1) Protocol, Origin fees, Royalties )
			assert.equal(await t2.balanceOf(accounts[3]), 1);
			assert.equal(await t2.balanceOf(accounts[4]), 2);
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
			assert.equal(await t2.balanceOf(community), 3);
		})

		async function prepare721DV1_20rders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
			let encDataLeft = await encDataV1([[[accounts[1], 10000]], addrOriginLeft]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("From ERC20(DataV1) to ERC1155(RoyalytiV2, DataV1) Protocol, Origin fees, Royalties ", async () => {
			const { left, right, erc1155TokenId1 } = await prepare20DV1_1155V2Orders()
			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
			console.log("accounts[1] buyer token balance: ", (await t1.balanceOf(accounts[1])).toString())
			console.log("accounts[2] seller token balance: ", (await t1.balanceOf(accounts[2])).toString())
			console.log("accounts[3] originleft token balance: ", (await t1.balanceOf(accounts[3])).toString())
			console.log("accounts[4] originleft token balance: ", (await t1.balanceOf(accounts[4])).toString())
			console.log("accounts[5] originRight token balance: ", (await t1.balanceOf(accounts[5])).toString())
			console.log("accounts[6] Royalties token balance: ", (await t1.balanceOf(accounts[6])).toString())
			console.log("accounts[7] Royalties token balance: ", (await t1.balanceOf(accounts[7])).toString())
			console.log("accounts[0] ghostMarketERC1155Token balance: ", (await erc1155_v2.balanceOf(accounts[0], erc1155TokenId1)).toString())
			console.log("accounts[1] ghostMarketERC1155Token balance: ", (await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1)).toString())
			console.log("protocol token balance: ", (await t1.balanceOf(protocol)).toString())
			assert.equal(await testing.fills(await libOrder.hashKey(left)), 7);
			assert.equal(await t1.balanceOf(accounts[1]), 10);		//=120 - (100amount + 3byuerFee + 3originLeft + 4originleft)
			assert.equal(await t1.balanceOf(accounts[2]), 80);			//=100 - (10 +5)Royalties - 5originRight
			assert.equal(await t1.balanceOf(accounts[3]), 3);			//originleft
			assert.equal(await t1.balanceOf(accounts[4]), 4);			//originleft
			assert.equal(await t1.balanceOf(accounts[5]), 5);			//originRight
			assert.equal(await t1.balanceOf(accounts[6]), 10);		//Royalties
			assert.equal(await t1.balanceOf(accounts[7]), 5);			//Royalties
			assert.equal(await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1), 7);
			assert.equal(await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 3);
		})

		async function prepare20DV1_1155V2Orders(t1Amount = 120, t2Amount = 10) {
			await t1.mint(accounts[1], t1Amount);
			await erc1155_v2.mintGhost(accounts[2], t2Amount, data, [[accounts[6], 1000], [accounts[7], 500]], "ext_uri", "", "")
			const erc1155TokenId1 = await getLastTokenID(erc1155_v2)
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });

			let addrOriginLeft = [[accounts[3], 300], [accounts[4], 400]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([[[accounts[1], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[2], 10000]], addrOriginRight]);

			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right, erc1155TokenId1 }
		}

		it("From ERC1155(RoyalytiV2, DataV1) to ERC20(DataV1):Protocol, Origin fees, Royalties ", async () => {
			const { left, right, erc1155TokenId1 } = await prepare1155V1_20DV1Orders()

			await testing.matchOrders(left, await getSignature(left, accounts[2]), right, "0x", { from: accounts[1] });

			assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);

			assert.equal(await t1.balanceOf(accounts[1]), 12);		//=120 - (100amount + 3byuerFee +5originRight )
			assert.equal(await t1.balanceOf(accounts[2]), 78);			//=100 - (10 +5)Royalties - (3+4)originLeft

			assert.equal(await t1.balanceOf(accounts[3]), 3);			//originleft
			assert.equal(await t1.balanceOf(accounts[4]), 4);			//originleft
			assert.equal(await t1.balanceOf(accounts[5]), 5);			//originRight
			assert.equal(await t1.balanceOf(accounts[6]), 10);		//Royalties
			assert.equal(await t1.balanceOf(accounts[7]), 5);			//Royalties
			assert.equal(await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1), 7);
			assert.equal(await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1), 3);
			assert.equal(await t1.balanceOf(protocol), 3);
		})

		async function prepare1155V1_20DV1Orders(t1Amount = 120, t2Amount = 10) {
			await erc1155_v2.mintGhost(accounts[2], t2Amount, data, [[accounts[6], 1000], [accounts[7], 500]], "ext_uri", "", "")
			const erc1155TokenId1 = await getLastTokenID(erc1155_v2)

			await t1.mint(accounts[1], t1Amount);


			await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: accounts[2] });
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

			let addrOriginLeft = [[accounts[3], 300], [accounts[4], 400]];
			let addrOriginRight = [[accounts[5], 500]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right, erc1155TokenId1 }
		}

		it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin fees, Royalties", async () => {
			await erc721V1.mintGhost(accounts[1], [[accounts[3], 300], [accounts[4], 400]], "ext_uri", "", "");
			const erc721TokenId1 = await erc721V1.getLastTokenID()


			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10+12 origin left) (72back)
				verifyBalanceChange(accounts[1], -172, async () =>				//200 - (6+8royalties) - 14originright
					verifyBalanceChange(accounts[3], -6, async () =>
						verifyBalanceChange(accounts[4], -8, async () =>
							verifyBalanceChange(accounts[5], -10, async () =>
								verifyBalanceChange(accounts[6], -12, async () =>
									verifyBalanceChange(accounts[7], -14, async () =>
										verifyBalanceChange(protocol, -6, () =>
											testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
										)
									)
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721V1.balanceOf(accounts[1]), 0);
			assert.equal(await erc721V1.balanceOf(accounts[2]), 1);
		})

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
				verifyBalanceChange(accounts[1], -186, async () =>				//200 - 14 originright
					verifyBalanceChange(accounts[5], -10, async () =>
						verifyBalanceChange(accounts[6], -12, async () =>
							verifyBalanceChange(accounts[7], -14, async () =>
								verifyBalanceChange(protocol, -6, () =>
									testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
		})

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees comes from OrderNFT,  no Royalties", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [];
			let addrOriginRight = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);
			// maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 206, async () =>			//200+6buyerFee+  (94back)
				verifyBalanceChange(accounts[1], -164, async () =>				//200 - (10+ 12+ 14) originright
					verifyBalanceChange(accounts[5], -10, async () =>
						verifyBalanceChange(accounts[6], -12, async () =>
							verifyBalanceChange(accounts[7], -14, async () =>
								verifyBalanceChange(protocol, -6, () =>
									testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
		})

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees comes from OrderETH,  no Royalties", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];
			let addrOriginRight = [];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 242, async () =>			//200+6buyerFee+ (10 +12 +14 origin left) (72back)
				verifyBalanceChange(accounts[1], -200, async () =>				//200
					verifyBalanceChange(accounts[5], -10, async () =>
						verifyBalanceChange(accounts[6], -12, async () =>
							verifyBalanceChange(accounts[7], -14, async () =>
								verifyBalanceChange(protocol, -6, () =>
									testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
		})

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, no Royalties, Origin fees comes from OrderETH NB!!! not enough ETH", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700], [accounts[3], 3000]];
			let addrOriginRight = [];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);

			await expectRevert(
				testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300, gasPrice: 0 }),
				"transfer failed"
			);

			//    	await verifyBalanceChange(accounts[2], 302, async () =>			//200+6buyerFee+ (10 +12 +14 +60 origin left) (not enough tokens, need 302)
			//    		verifyBalanceChange(accounts[1], -194, async () =>				//200 -6seller -
			//    			verifyBalanceChange(accounts[5], -10, async () =>
			//    				verifyBalanceChange(accounts[6], -12, async () =>
			//    					verifyBalanceChange(accounts[7], -14, async () =>
			//    						verifyBalanceChange(protocol, -12, () =>
			//    							testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
			//    						)
			//    					)
			//    				)
			//    			)
			//  			)
			// 			)
			//    	assert.equal(await erc721.balanceOf(accounts[1]), 0);
			//    	assert.equal(await erc721.balanceOf(accounts[2]), 1);
		})

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, no Royalties, Origin fees comes from OrderNFT NB!!! not enough ETH for lastOrigin and seller!", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [];
			let addrOriginRight = [[accounts[3], 9000], [accounts[5], 500], [accounts[6], 600], [accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);

			await verifyBalanceChange(accounts[2], 206, async () =>			//200+6buyerFee
				verifyBalanceChange(accounts[1], 0, async () =>				//200 -(180 + 10 + 12(really 10) + 14(really 0) origin left)
					verifyBalanceChange(accounts[3], -180, async () =>
						verifyBalanceChange(accounts[5], -10, async () =>
							verifyBalanceChange(accounts[6], -10, async () =>
								verifyBalanceChange(accounts[7], 0, async () =>
									verifyBalanceChange(protocol, -6, () =>
										testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
									)
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
		})

	})	//("Do matchOrders(), orders dataType == V1"

	describe("Do matchOrders(), orders dataType == V1, MultipleBeneficiary", () => {
		it("From ERC20(100) to ERC20(200) Protocol, Origin fees, no Royalties, payouts: 1)20/80%, 2)50/50%", async () => {
			const { left, right } = await prepare2Orders()
			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
			assert.equal(await testing.fills(await libOrder.hashKey(left)), 200);
			assert.equal(await t1.balanceOf(accounts[1]), 1); //= 104 - (100amount + 3byuerFee +1originleft)
			assert.equal(await t1.balanceOf(accounts[2]), 19);//= 100*20% - 2 originRight
			assert.equal(await t1.balanceOf(accounts[6]), 78);//= 100*80% - 2 originRight
			assert.equal(await t1.balanceOf(accounts[3]), 1);
			assert.equal(await t1.balanceOf(accounts[4]), 2);
			assert.equal(await t2.balanceOf(accounts[1]), 100); //50%
			assert.equal(await t2.balanceOf(accounts[5]), 100); //50%
			assert.equal(await t2.balanceOf(accounts[2]), 0);
		})

		async function prepare2Orders(t1Amount = 104, t2Amount = 200) {
			await t1.mint(accounts[1], t1Amount);
			await t2.mint(accounts[2], t2Amount);
			await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100]];
			let addrOriginRight = [[accounts[4], 200]];
			let encDataLeft = await encDataV1([[[accounts[1], 5000], [accounts[5], 5000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[2], 2000], [accounts[6], 8000]], addrOriginRight]);
			const left = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			return { left, right }
		}

		// if left = Order has Asset ERC721 the fees will go to community address
		it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties, payouts: 50/50%", async () => {
			const { left, right } = await prepare721DV1_20rders()
			await testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] });
			assert.equal(await testing.fills(await libOrder.hashKey(left)), 100);
			assert.equal(await t2.balanceOf(accounts[1]), 48);	// gets ((100 * 50%) - pays 2 originRight fee) from the sell price
			assert.equal(await t2.balanceOf(accounts[5]), 48);	// gets ((100 * 50%) - pays 2 originRight fee) from the sell price
			assert.equal(await t2.balanceOf(accounts[2]), 3);		// had 105; buys for (100 + pays 2 originRight fee) => 105 - (100 + 2)
			assert.equal(await t2.balanceOf(accounts[3]), 1);		// gets 1% from the sell price 
			assert.equal(await t2.balanceOf(accounts[4]), 2);		// gets 2% from the sell price
			assert.equal(await erc721.balanceOf(accounts[1]), 0); // NFT is transfered from this account
			assert.equal(await erc721.balanceOf(accounts[2]), 1); // NFT is transfered to this account
			assert.equal(await t2.balanceOf(community), 3);
		})

		async function prepare721DV1_20rders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
			let encDataLeft = await encDataV1([[[accounts[1], 5000], [accounts[5], 5000]], addrOriginLeft]);
			//maker address, makeAsset, taker, takeAsset, salt, start, end, dataType, data
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties, payouts: 110%, throw", async () => {
			const { left, right } = await prepare721DV1_20_110CentsOrders()
			await expectRevert(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] }),
				"ERC20: transfer amount exceeds balance"
			);

		})

		async function prepare721DV1_20_110CentsOrders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
			let encDataLeft = await encDataV1([[[accounts[1], 5000], [accounts[5], 6000]], addrOriginLeft]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			return { left, right }
		}

		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: 50/50%", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 5000], [accounts[3], 5000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			console.log("accounts[1] buyer token balance: ", (await t2.balanceOf(accounts[1])).toString())
			console.log("accounts[2] seller token balance: ", (await t2.balanceOf(accounts[2])).toString())
			console.log("accounts[3] originleft token balance: ", (await t2.balanceOf(accounts[3])).toString())
			console.log("accounts[4] originleft token balance: ", (await t2.balanceOf(accounts[5])).toString())
			console.log("accounts[5] originRight token balance: ", (await t2.balanceOf(accounts[6])).toString())
			console.log("accounts[5] originRight token balance: ", (await t2.balanceOf(accounts[7])).toString())
			console.log("accounts[7] Royalties token balance: ", (await t2.balanceOf(protocol)).toString())
			console.log("accounts[0] ghostMarketERC721Token balance: ", (await erc721.balanceOf(accounts[1])).toString())
			console.log("accounts[1] ghostMarketERC721Token balance: ", (await erc721.balanceOf(accounts[2])).toString())
			await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
				verifyBalanceChange(accounts[3], -93, async () =>				//200 - 14 originright *50%
					verifyBalanceChange(accounts[1], -93, async () =>				//200 - 14 originright *50%
						verifyBalanceChange(accounts[5], -10, async () =>
							verifyBalanceChange(accounts[6], -12, async () =>
								verifyBalanceChange(accounts[7], -14, async () =>
									verifyBalanceChange(protocol, -6, () =>
										testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
									)
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
		})
		//payout goes to the order 
		it.only("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: empty 100% to order.maker", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
			await erc721.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[], addrOriginRight]); //empty payout

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
				verifyBalanceChange(accounts[1], -186, async () =>				//200 seller - 14 originright *100%
					verifyBalanceChange(accounts[5], -10, async () =>
						verifyBalanceChange(accounts[6], -12, async () =>
							verifyBalanceChange(accounts[7], -14, async () =>
								verifyBalanceChange(protocol, -6, () =>
									testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721.balanceOf(accounts[1]), 0);
			assert.equal(await erc721.balanceOf(accounts[2]), 1);
		})

		async function prepare_ERC_1155V1_Orders(erc1155amount = 10) {
			await erc1155_v2.mintGhost(accounts[1], erc1155amount, data, [[accounts[3], 1000], [accounts[4], 500]], "ext_uri", "", "")
			const erc1155TokenId1 = await getLastTokenID(erc1155_v2)

			await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 4), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 4), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			return { left, right, erc1155TokenId1 }
		}

		// can be used on testnets
		it("should buy ERC1155 with ETH; protocol fee and royalties", async () => {
			const { left, right, erc1155TokenId1 } = await prepare_ERC_1155V1_Orders()

			//let signatureRight = await getSignature(right, accounts[1]);
			if (network === 'rinkeby_nodeploy' || network === 'ropsten_nodeploy') {
				console.log(accounts[1], "accounts1 balance before: ", (await web3.eth.getBalance(accounts[1])).toString())
				console.log(accounts[2], "accounts2  balance before: ", (await web3.eth.getBalance(accounts[2])).toString())
				console.log(accounts[3], "accounts3  balance before: ", (await web3.eth.getBalance(accounts[3])).toString())
				console.log(accounts[1], "accounts4  balance before: ", (await web3.eth.getBalance(accounts[4])).toString())
				console.log(protocol, "protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
				console.log(accounts[1], "accounts1 erc1155 balance before: ", (await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1)).toString())
				console.log(accounts[2], "accounts2 erc1155 balance before: ", (await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1)).toString())

				await testing.matchAndTransferExternal(left, right, { from: accounts[2], value: 300 })
				//await testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })

				console.log(accounts[1], " accounts1  balance after: ", (await web3.eth.getBalance(accounts[1])).toString())
				console.log(accounts[2], " accounts2  balance after: ", (await web3.eth.getBalance(accounts[2])).toString())
				console.log(accounts[3], " accounts3  balance after: ", (await web3.eth.getBalance(accounts[3])).toString())
				console.log(accounts[4], " accounts4  balance after: ", (await web3.eth.getBalance(accounts[4])).toString())
				console.log(protocol, " protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
				console.log(accounts[1], " accounts1 erc1155 balance after: ", (await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1)).toString())
				console.log(accounts[1], " accounts2 erc1155 balance after: ", (await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1)).toString())
			} else {
				await verifyBalanceChange(accounts[2], 206, async () =>			//200 + 6 buyerFee (72back)
					verifyBalanceChange(accounts[1], -170, async () =>				//200 seller - 14 
						verifyBalanceChange(accounts[3], -20, async () =>
							verifyBalanceChange(accounts[4], -10, async () =>
								verifyBalanceChange(protocol, -6, () =>
									//testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
									testing.matchAndTransferExternal(left, right, { from: accounts[2], value: 300, gasPrice: 0 })
								)
							)
						)
					)
				)
				assert.equal(await erc1155_v2.balanceOf(accounts[1], erc1155TokenId1), 6);
				assert.equal(await erc1155_v2.balanceOf(accounts[2], erc1155TokenId1), 4);
			}
		})
		// can be used on testnets
		it.only("should buy ERC721 with ETH; protocol fee and royalties", async () => {
			await erc721V1.mintGhost(accounts[1], [[accounts[3], 300], [accounts[4], 400]], "ext_uri", "", "");
			const erc721TokenId1 = await erc721V1.getLastTokenID()

			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			let sellingValue = 1000000000000
			let protocolFeeCalc = sellingValue * protocolFeePercent
			let royality1Calc = sellingValue * 0.03
			let royality2Calc = sellingValue * 0.04
			console.log("sellingValue", sellingValue)
			console.log("protocolFeeCalc", protocolFeeCalc)
			console.log("royality1Calc", royality1Calc)
			console.log("royality2Calc", royality2Calc)
			console.log("seller gets", sellingValue - royality1Calc - royality2Calc)
			console.log("BUYER PAYS", sellingValue + protocolFeeCalc)


			//"0xffffffff", "0x"
			const left = Order(accounts[2], Asset(ETH, "0x", sellingValue), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[1], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", sellingValue), 1, 0, 0, "0xffffffff", "0x");
			/* console.log("order left: ", left)
			console.log("order right: ", right) */

			//let signatureRight = await getSignature(right, accounts[1]);
			if (network === 'rinkeby_nodeploy' || network === 'ropsten_nodeploy') {
				/* 				console.log("accounts1 balance before: ", (await web3.eth.getBalance(accounts[1])).toString())
								console.log("accounts2  balance before: ", (await web3.eth.getBalance(accounts[2])).toString())
								console.log("accounts3  balance before: ", (await web3.eth.getBalance(accounts[3])).toString())
								console.log("accounts4  balance before: ", (await web3.eth.getBalance(accounts[4])).toString())
								console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
								console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())
								console.log("accounts1 erc721V1 balance before: ", (await erc721V1.balanceOf(accounts[1])).toString())
								console.log("accounts2 erc721V1 balance before: ", (await erc721V1.balanceOf(accounts[2])).toString()) */

				await testing.matchAndTransferExternal(left, right, { from: accounts[2], value: sellingValue + protocolFeeCalc })
				//await testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })

				/* 				console.log("accounts1  balance after: ", (await web3.eth.getBalance(accounts[1])).toString())
								console.log("accounts2  balance after: ", (await web3.eth.getBalance(accounts[2])).toString())
								console.log("accounts3  balance after: ", (await web3.eth.getBalance(accounts[3])).toString())
								console.log("accounts4  balance after: ", (await web3.eth.getBalance(accounts[4])).toString())
								console.log("protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
								console.log("accounts1 erc721V1 balance after: ", (await erc721V1.balanceOf(accounts[1])).toString())
								console.log("accounts2 erc721V1 balance after: ", (await erc721V1.balanceOf(accounts[2])).toString()) */
			} else {

				await verifyBalanceChange(accounts[2], sellingValue + protocolFeeCalc, async () =>			//200 + 6 buyerFee (72back)
					verifyBalanceChange(accounts[1], -sellingValue - royality1Calc - royality2Calc, async () =>				//200 seller - 14 
						verifyBalanceChange(accounts[3], -royality1Calc, async () =>
							verifyBalanceChange(accounts[4], -royality2Calc, async () =>
								verifyBalanceChange(protocol, -protocolFeeCalc, () =>
									//testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
									testing.matchAndTransferExternal(left, right, { from: accounts[2], value: sellingValue + protocolFeeCalc, gasPrice: 0 })
								)
							)
						)
					)
				)
				assert.equal(await erc721V1.balanceOf(accounts[1]), 0);
				assert.equal(await erc721V1.balanceOf(accounts[2]), 1);
			}
		})
		// can be used on testnets
		it("From ETH(DataV1) to ERC721(DataV1) Protocol, Origin fees,  no Royalties, payouts: empty 100% to order.maker", async () => {
			await erc721V1.mintGhost(accounts[1], [], "ext_uri", "", "");
			const erc721TokenId1 = await erc721V1.getLastTokenID()


			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });

			let addrOriginLeft = [[accounts[3], 500], [accounts[4], 600]];
			let addrOriginRight = [[accounts[5], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[], addrOriginRight]); //empty payout

			//"0xffffffff", "0x"
			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			//let signatureRight = await getSignature(right, accounts[1]);
			if (network === 'rinkeby_nodeploy' || network === 'ropsten_nodeploy') {

				console.log("accounts1 balance before: ", (await web3.eth.getBalance(accounts[1])).toString())
				console.log("accounts2  balance before: ", (await web3.eth.getBalance(accounts[2])).toString())
				console.log("accounts3  balance before: ", (await web3.eth.getBalance(accounts[3])).toString())
				console.log("accounts4  balance before: ", (await web3.eth.getBalance(accounts[4])).toString())
				console.log("accounts5  balance before: ", (await web3.eth.getBalance(accounts[5])).toString())
				console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
				console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())
				console.log("accounts1 erc721V1 balance before: ", (await erc721V1.balanceOf(accounts[1])).toString())
				console.log("accounts2 erc721V1 balance before: ", (await erc721V1.balanceOf(accounts[2])).toString())

				await testing.matchAndTransferExternal(left, right, { from: accounts[2], value: 300 })
				//await testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })

				console.log("accounts1  balance after: ", (await web3.eth.getBalance(accounts[1])).toString())
				console.log("accounts2  balance after: ", (await web3.eth.getBalance(accounts[2])).toString())
				console.log("accounts3  balance after: ", (await web3.eth.getBalance(accounts[3])).toString())
				console.log("accounts4  balance after: ", (await web3.eth.getBalance(accounts[4])).toString())
				console.log("accounts5  balance after: ", (await web3.eth.getBalance(accounts[5])).toString())
				console.log("protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
				console.log("accounts1 erc721V1 balance after: ", (await erc721V1.balanceOf(accounts[1])).toString())
				console.log("accounts2 erc721V1 balance after: ", (await erc721V1.balanceOf(accounts[2])).toString())
			} else {
				await verifyBalanceChange(accounts[2], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
					verifyBalanceChange(accounts[1], -186, async () =>				//200 seller - 14 originright *100%
						verifyBalanceChange(accounts[5], 10, async () =>
							verifyBalanceChange(accounts[6], -12, async () =>
								verifyBalanceChange(accounts[7], -14, async () =>
									verifyBalanceChange(protocol, -6, () =>
										//testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
										testing.matchAndTransferExternal(left, right, { from: accounts[2], value: 300, gasPrice: 0 })
									)
								)
							)
						)
					)
				)
				assert.equal(await erc721V1.balanceOf(accounts[1]), 0);
				assert.equal(await erc721V1.balanceOf(accounts[2]), 1);
			}
		})
	})

	//Do matchOrders(), orders dataType == V1, MultipleBeneficiary

	describe("Catch emit event Transfer", () => {
		it("From ETH(DataV1) to ERC721(DataV1) Protocol, check emit ", async () => {
			const seller = accounts[1];
			const sellerRoyaltiy = accounts[4];
			const seller2 = accounts[3];
			const buyer = accounts[2];
			const originLeft1 = accounts[5];
			const originLeft2 = accounts[6];
			const originRight = accounts[7];

			await erc721V1.mintGhost(seller, [[sellerRoyaltiy, 1000]], "ext_uri", "", "");
			const erc721TokenId1 = await erc721V1.getLastTokenID()
			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: seller });

			let addrOriginLeft = [[originLeft1, 500], [originLeft2, 600]];
			let addrOriginRight = [[originRight, 700]];
			let encDataLeft = await encDataV1([[[buyer, 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[seller, 5000], [seller2, 5000]], addrOriginRight]);

			const left = Order(buyer, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(seller, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, seller);
			let tx = await testing.matchOrders(left, "0x", right, signatureRight, { from: buyer, value: 300, gasPrice: 0 });
			let errorCounter = 0
			truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
				let result = false;
				switch (ev.to) {
					case protocol:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PROTOCOL)) {
							console.log("Error in protocol check:");
							errorCounter++;
						}
						break
					case seller:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PAYOUT)) {
							console.log("Error in seller check:");
							errorCounter++;
						}
						break
					case sellerRoyaltiy:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ROYALTY)) {
							console.log("Error in seller check:");
							errorCounter++;
						}
						break
					case seller2:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PAYOUT)) {
							console.log("Error in seller2 check:");
							errorCounter++;
						}
						break
					case originLeft1:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ORIGIN)) {
							console.log("Error in originLeft1 check:");
							errorCounter++;
						}
						break
					case originLeft2:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ORIGIN)) {
							console.log("Error in originLeft2 check:");
							errorCounter++;
						}
						break
					case originRight:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != ORIGIN)) {
							console.log("Error in originRight check:");
							errorCounter++;
						}
						break
					case buyer:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PAYOUT)) {
							console.log("Error in buyer check:");
							errorCounter++;
						}
						break
				}
				if (errorCounter > 0) {
					result = false;
				} else {
					result = true;
				}
				return result;
			}, "Transfer should be emitted with correct parameters ");
			assert.equal(errorCounter, 0);
		})

		it("From ERC1155(DataV2) to ETH(DataV1) Protocol, check emit ", async () => {
			const seller = accounts[1];
			const sellerRoyaltiy = accounts[4];
			const seller2 = accounts[3];
			const buyer = accounts[2];
			const originLeft1 = accounts[5];
			const originLeft2 = accounts[6];
			const originRight = accounts[7];

			await erc1155_v2.mintGhost(seller, 10, data, [[sellerRoyaltiy, 1000]], "ext_uri", "", "")
			const erc1155TokenId1 = await getLastTokenID(erc1155_v2)
			await erc1155_v2.setApprovalForAll(transferProxy.address, true, { from: seller });

			let addrOriginLeft = [[originLeft1, 500], [originLeft2, 600]];
			let addrOriginRight = [[originRight, 700]];
			let encDataLeft = await encDataV1([[[seller, 5000], [seller2, 5000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[buyer, 10000]], addrOriginRight]);

			const left = Order(seller, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 5), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(buyer, Asset(ETH, "0x", 200), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 5), 1, 0, 0, ORDER_DATA_V1, encDataRight);

			let signatureRight = await getSignature(right, buyer);



			/* 			let signatureRight = await getSignature(right, buyer);
						await verifyBalanceChange(accounts[1], 228, async () =>			//200+6buyerFee+ (10 +12 origin left) (72back)
							verifyBalanceChange(accounts[2], -93, async () =>				//200 - 14 originright *50%
								verifyBalanceChange(accounts[3], -93, async () =>				//200 - 14 originright *50%
									verifyBalanceChange(accounts[4], -93, async () =>
										verifyBalanceChange(accounts[5], -10, async () =>
											verifyBalanceChange(accounts[6], -12, async () =>
												verifyBalanceChange(accounts[7], -14, async () =>
													verifyBalanceChange(protocol, -6, () =>
														testing.matchOrders(left, "0x", right, signatureRight, { from: seller, value: 300, gasPrice: 0 })
													)
												)
											)
										)
									)
								)
							)
						) */

			let tx = await testing.matchOrders(left, "0x", right, signatureRight, { from: seller, value: 300, gasPrice: 0 });
			let errorCounter = 0

			assert.equal(await erc1155_v2.balanceOf(seller, erc1155TokenId1), 5);
			assert.equal(await erc1155_v2.balanceOf(buyer, erc1155TokenId1), 5);

			truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
				let result = false;
				switch (ev.to) {
					case protocol:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PROTOCOL)) {
							console.log("Error in protocol check:");
							errorCounter++;
						}
						break
					case seller:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PAYOUT)) {
							console.log("Error in seller check:");
							errorCounter++;
						}
						break
					case sellerRoyaltiy:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ROYALTY)) {
							console.log("Error in seller check:");
							errorCounter++;
						}
						break
					case seller2:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != PAYOUT)) {
							console.log("Error in seller2 check:");
							errorCounter++;
						}
						break
					case originLeft1:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ORIGIN)) {
							console.log("Error in originLeft1 check:");
							errorCounter++;
						}
						break
					case originLeft2:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ORIGIN)) {
							console.log("Error in originLeft2 check:");
							errorCounter++;
						}
						break
					case originRight:
						if ((ev.transferDirection != TO_MAKER) && (ev.transferType != ORIGIN)) {
							console.log("Error in originRight check:");
							errorCounter++;
						}
						break
					case buyer:
						if ((ev.transferDirection != TO_TAKER) && (ev.transferType != PAYOUT)) {
							console.log("Error in buyer check:");
							errorCounter++;
						}
						break
				}
				if (errorCounter > 0) {
					result = false;
				} else {
					result = true;
				}
				return result;
			}, "Transfer shoild be emitted with correct parameters ");
			assert.equal(errorCounter, 0);
		})

	}) //Catch emit event Transfer

	describe("Exchange with Royalties", () => {
		it("Royalties by owner, token 721 to ETH", async () => {
			await erc721V1.mintGhost(accounts[1], [[accounts[3], 500], [accounts[4], 1000]], "ext_uri", "", "");
			const erc721TokenId1 = await erc721V1.getLastTokenID()
			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 228, async () =>			//200 + 6 buyerFee + (10 +12 origin left) (72back)
				verifyBalanceChange(accounts[1], -156, async () =>				//200  - 14 originright - 10 -20 royalties
					verifyBalanceChange(accounts[3], -10, async () =>
						verifyBalanceChange(accounts[4], -20, async () =>
							verifyBalanceChange(accounts[5], -10, async () =>
								verifyBalanceChange(accounts[6], -12, async () =>
									verifyBalanceChange(accounts[7], -14, async () =>
										verifyBalanceChange(protocol, -6, () =>
											testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
										)
									)
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721V1.balanceOf(accounts[1]), 0);
			assert.equal(await erc721V1.balanceOf(accounts[2]), 1);

		})
		it("Royalties by owner, token and tokenId 721 to ETH", async () => {
			//await erc721.mint(accounts[1], erc721V1TokenId1);
			await erc721V1.mintGhost(accounts[1], [[accounts[3], 500], [accounts[4], 1000]], "ext_uri", "", "");
			const erc721TokenId1 = await erc721V1.getLastTokenID()
			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);


			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			console.log("test1")
			let signatureRight = await getSignature(right, accounts[1]);
			console.log("test2")
			await verifyBalanceChange(accounts[2], 228, async () =>			//200 + 6 buyerFee + (10 + 12 origin left) (72 back)
				verifyBalanceChange(accounts[1], -156, async () =>				//200 - 14 origin right - 10 -20 royalties
					verifyBalanceChange(accounts[3], -10, async () =>
						verifyBalanceChange(accounts[4], -20, async () =>
							verifyBalanceChange(accounts[5], -10, async () =>
								verifyBalanceChange(accounts[6], -12, async () =>
									verifyBalanceChange(accounts[7], -14, async () =>
										verifyBalanceChange(protocol, -6, () =>						// 3% buyerFee of 200 sell price
											testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
										)
									)
								)
							)
						)
					)
				)
			)
			assert.equal(await erc721V1.balanceOf(accounts[1]), 0);
			assert.equal(await erc721V1.balanceOf(accounts[2]), 1);

		})

		it("Royalties by token and tokenId 721v1_OwnableUpgradaeble to ETH", async () => {
			let ownerErc721 = accounts[6];
			ERC721_V1OwnUpgrd = await TestERC721RoyaltyV1OwnUpgrd.new();
			await ERC721_V1OwnUpgrd.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, { from: ownerErc721 })
			await ERC721_V1OwnUpgrd.mintGhost(accounts[1], [[accounts[3], 500], [accounts[4], 1000]], "ext_uri", "", "");
			const erc721TokenId1 = await ERC721_V1OwnUpgrd.getLastTokenID()

			//await ERC721_V1OwnUpgrd.mint(accounts[1], erc721TokenId1, []);
			await ERC721_V1OwnUpgrd.setApprovalForAll(transferProxy.address, true, { from: accounts[1] });
			let addrOriginLeft = [[accounts[5], 500]];
			let addrOriginRight = [[accounts[7], 700]];

			let encDataLeft = await encDataV1([[[accounts[2], 10000]], addrOriginLeft]);
			let encDataRight = await encDataV1([[[accounts[1], 10000]], addrOriginRight]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[1], Asset(ERC721, enc(ERC721_V1OwnUpgrd.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
			let signatureRight = await getSignature(right, accounts[1]);
			await verifyBalanceChange(accounts[2], 216, async () =>			//200+6buyerFee+ (10  origin left) (72back)
				verifyBalanceChange(accounts[1], -156, async () =>				//200 - 14 originright - 10 -20 royalties
					verifyBalanceChange(accounts[3], -10, async () =>
						verifyBalanceChange(accounts[4], -20, async () =>
							verifyBalanceChange(accounts[5], -10, async () =>
								verifyBalanceChange(accounts[7], -14, async () =>
									verifyBalanceChange(protocol, -6, () =>
										testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
									)
								)
							)
						)
					)
				)
			)
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[1]), 0);
			assert.equal(await ERC721_V1OwnUpgrd.balanceOf(accounts[2]), 1);

		})

	})

	function encDataV1(tuple) {
		return transferManagerTest.encode(tuple);
	}

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

});
