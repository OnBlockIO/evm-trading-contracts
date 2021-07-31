//const OrderValidatorTest = artifacts.require("OrderValidatorTest");
const { BigNumber } = require('ethers');

const { Order, Asset, sign } = require("./order");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("./assets");
const { chai, expect } = require('chai')
const { generatedWallets } = require('./generatedWallets');
const ZERO = "0x0000000000000000000000000000000000000000";
//const { Blockchain } = require('./Blockchain');
const { JsonRpcProvider } = require('@ethersproject/providers');
const provider = new JsonRpcProvider("http://localhost:8545");
const accounts = generatedWallets(provider);
const {
	expectRevert
} = require('@openzeppelin/test-helpers');
const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID } = require('./include_in_tesfiles.js')





describe('Exchange', async function () {

	/* 	console.log('web3.utils.rightPad(0x, 132): ', web3.utils.rightPad('0x', 130));
		let resultsig = ethers.utils.keccak256("0x")
	
		console.log('sig result: ', resultsig); */



	let testing;
	let accounts0 = accounts[0].address
	let accounts1 = accounts[1].address
	let accounts2 = accounts[2].address
	let accounts3 = accounts[3].address
	let accounts4 = accounts[4].address
	let wallet0 = accounts[0]
	let wallet1 = accounts[1]
	let wallet2 = accounts[2]

	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let t1;
	let erc721V1;
	let libOrder;
	let protocol = accounts[5].address;
	let community = accounts[5].address;
	const eth = "0x0000000000000000000000000000000000000000";
	console.log("accounts0: ", accounts0)
	console.log("accounts1: ", accounts1)
	console.log("accounts2: ", accounts2)
	console.log("protocol: ", protocol)
	console.log("community: ", community)

	let do_not_deploy = false

	beforeEach(async function () {
		let LibOrderTest = await ethers.getContractFactory("LibOrderTest");
		let TransferProxyTest = await ethers.getContractFactory("TransferProxyTest");
		let ERC20TransferProxyTest = await ethers.getContractFactory("ERC20TransferProxyTest");
		let ExchangeV2 = await ethers.getContractFactory("ExchangeV2");
		let GhostMarketTransferManagerTest = await ethers.getContractFactory("GhostMarketTransferManagerTest");
		let TestERC20 = await ethers.getContractFactory("TestERC20");
		let TestERC721V1 = await ethers.getContractFactory("TestERC721WithRoyalties");
		let ERC1155_V2 = await ethers.getContractFactory("TestERC1155WithRoyalties");

		if (hre.network.name == 'rinkeby' && do_not_deploy) {
			libOrder = await LibOrderTest.attach("0xD1053A696914de7445b5892AB2707c42b0eD12Bd");
			transferProxy = await TransferProxyTest.attach("0x68dE8DeD73c6E3E352479E26e4Ba853148722028")
			erc20TransferProxy = await ERC20TransferProxyTest.attach("0x9D5e024486A21Be692B4b1A7f4e0d80F027D862f")
			testing = await ExchangeV2.attach("0xcE8306360Ef0064F8cCE5B3dDB53709FcfA690b7")
			transferManagerTest = await GhostMarketTransferManagerTest.attach("0xAbb343B3a6F0c217Cbfda1b77E50aeFCbFE7192c")
			t1 = await TestERC20.attach("0x181de4A4d4781448f5aC1A4436c2Ab2eA7501b2C")
			erc721V1 = await TestERC721V1.attach("0x2013a78C1916AC3e2E03EAC44cA24BEf4e45a232")
			erc1155_v2 = await ERC1155_V2.attach("");
		} else {
			libOrder = await LibOrderTest.deploy();
			transferProxy = await TransferProxyTest.deploy();
			erc20TransferProxy = await ERC20TransferProxyTest.deploy();
			testing = await upgrades.deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, protocol], { initializer: "__ExchangeV2_init" });
			transferManagerTest = await GhostMarketTransferManagerTest.deploy();
			t1 = await TestERC20.deploy();
			erc721V1 = await TestERC721V1.deploy();
			await erc721V1.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
			erc1155_v2 = await ERC1155_V2.deploy();
			await erc1155_v2.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);

			/*ETH*/
			//fee receiver for ETH transfer is the protocol address
			await testing.setFeeReceiver(eth, protocol);
			//fee receiver for Token t1 transfer is the protocol address
			await testing.setFeeReceiver(t1.address, protocol);
		}
		console.log('libOrder: ', libOrder.address);
		console.log('transferProxy: ', transferProxy.address);
		console.log('erc20TransferProxy: ', erc20TransferProxy.address);
		console.log('testing: ', testing.address);
		console.log('transferManagerTest: ', transferManagerTest.address);
		console.log('t1: ', t1.address);
		console.log('erc721V1: ', erc721V1.address);
		console.log('ERC1155_V2: ', erc1155_v2.address);
		/*
		transferProxy:  0xe5A26A415074Ac2C69f73D980662de5c0220B50C
		erc20TransferProxy:  0x576F1b0B9ea15a70B525b438155bB4bEfe7214e8
		testing:  0x250E37A9dBd30dAA5194C20489c4a74488599d52
		transferManagerTest:  0x294307161704b9B0F06401B6b014182BF8D06EDA
		t1:  0x880c1B8E116837C84992Cd94e29F20c258A607c4 
		 */
	});

	it("eth orders work, rest is returned to taker (other side) ", async () => {
		await t1.mint(accounts1, 100);
		let t1AsSigner = await t1.connect(wallet1);

		await t1AsSigner.approve(erc20TransferProxy.address, 10000000, { from: accounts1 });

		const left = Order(accounts2, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts1, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

		let signatureRight = await getSignature(right, accounts1);
		let signatureLeft = await getSignature(left, accounts2);

		let testingAsSigner = await testing.connect(wallet2);

		//await account2AsSigner.validateOrderTest(testOrder, signature, { from: another_account })

		let result
		if (hre.network.name == 'rinkeby') {
			console.log("matchOrders on rinkeby")

			let account1T1BalanceBefore = (await t1.balanceOf(accounts1)).toString()
			let account2T1BalanceBefore = (await t1.balanceOf(accounts2)).toString()
			let tx
			const { events } = await (
				tx = await testingAsSigner.matchOrders(left, signatureLeft, right, signatureRight, { from: accounts2, value: 300 })
			).wait()

			console.log("events: ", events)
			console.log("tx: ", tx)
			let account1T1BalanceAfter = (await t1.balanceOf(accounts1)).toString()
			let account2T1BalanceAfter = (await t1.balanceOf(accounts2)).toString()

			console.log("account1T1BalanceBefore:", account1T1BalanceBefore)
			console.log("account2T1BalanceBefore:", account2T1BalanceBefore)
			console.log("account1T1BalanceAfter:", account1T1BalanceAfter)
			console.log("account2T1BalanceAfter:", account2T1BalanceAfter)


		} else {
			console.log("matchOrders on local")
			await verifyBalanceChange(accounts2, 206, async () =>
				verifyBalanceChange(accounts1, -200, async () =>
					verifyBalanceChange(protocol, -6, () =>
						testingAsSigner.matchOrders(left, signatureLeft, right, signatureRight, { from: accounts2, value: 300, gasPrice: 0 })
					)
				)
			)
			expect((await t1.balanceOf(accounts1)).toString()).to.equal('0');
			expect((await t1.balanceOf(accounts2)).toString()).to.equal('100');

			/* 
			const [auctionBidEvent] = events;
			expect(auctionBidEvent.event).eq('AuctionBid');
			expect(auctionBidEvent.args.tokenId.toNumber()).eq(tokenId);
			expect(auctionBidEvent.args.nftContractAddress).eq(mediaAddress);
			expect(auctionBidEvent.args.sender).eq(firstBidderWallet.address);
			expect(auctionBidEvent.args.value.toString()).eq(oneETH().toString()); 
			*/
		}
		//console.log("matchOrders tx result:", result)
		console.log("accounts1 token balance: ", (await t1.balanceOf(accounts1)).toString())
		console.log("accounts2 token balance: ", (await t1.balanceOf(accounts2)).toString())


	})

	it("From ETH(DataV1) to ERC721(RoyalytiV1, DataV1) Protocol, Origin fees, Royalties", async () => {
		await erc721V1.mintGhost(accounts1, [[accounts3, 300], [accounts4, 400]], "ext_uri", "", "");
		const erc721TokenId1 = await erc721V1.getLastTokenID()

		let erc721V1AsSigner = await erc721V1.connect(wallet1);
		await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 });

		let matchOrdersSigner = await testing.connect(wallet2);


		const left = Order(accounts2, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		let signatureRight = await getSignature(right, accounts1);
		let signatureLeft = await getSignature(left, accounts2);

		console.log('order left: ', left);
		console.log('order right: ', right);
		console.log('signatureRight: ', signatureRight);
		console.log('signatureLeft: ', signatureLeft);

		console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
		console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

		console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
		console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())
		let tx
		if (hre.network.name == 'bsctestnet' || hre.network.name == 'rinkeby') {
			tx = await matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts2, value: 300 })
			console.log("matchOrders tx: ", tx)

		}
		else {
			await verifyBalanceChange(accounts2, 206, async () =>			//200+6buyerFee (72back)
				verifyBalanceChange(accounts1, -186, async () =>				//200 - (6+8royalties)
					verifyBalanceChange(accounts3, -6, async () =>
						verifyBalanceChange(accounts4, -8, async () =>
							verifyBalanceChange(protocol, -6, () =>
								matchOrdersSigner.matchOrders(left, signatureLeft, right, signatureRight, { from: accounts2, value: 300, gasPrice: 0 })
							)
						)
					)
				)
			)
		}

		console.log("protocol balance after: ", (await web3.eth.getBalance(protocol)).toString())
		console.log("community balance after: ", (await web3.eth.getBalance(community)).toString())

		console.log("accounts2 royalty balance after: ", (await web3.eth.getBalance(accounts2)).toString())
		console.log("accounts3 royalty balance after: ", (await web3.eth.getBalance(accounts3)).toString())

		console.log("seller token balance: ", (await erc721V1.balanceOf(accounts1)).toString())
		console.log("buyer token balance: ", (await erc721V1.balanceOf(accounts0)).toString())
		expect((await erc721V1.balanceOf(accounts1)).toString()).to.equal('0');
		expect((await erc721V1.balanceOf(accounts2)).toString()).to.equal('1');
	})


	it.only("Transfer from ETH to ERC1155, protocol fee 3% (buyer pays 3% fee)", async () => {

		const { left, right, erc1155TokenId1 } = await prepareETH_1155Orders(10)
		let checkDoTransfersSigner = await transferManagerTest.connect(accounts[0]);
		checkDoTransfersSigner.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right, { value: 103, from: accounts0 })
		
/* 		await verifyBalanceChange(accounts[0].address, 103, () =>
			verifyBalanceChange(accounts[2].address, -100, () =>
				verifyBalanceChange(protocol, -3, () =>
					checkDoTransfersSigner.checkDoTransfers(left.makeAsset.assetType, left.takeAsset.assetType, [100, 7], left, right,
						{ value: 103, from: accounts[0].address, gasPrice: 0 }
					)
				)
			)
		); */
		console.log(accounts0)
		console.log(erc1155TokenId1)
		console.log((await erc1155_v2.balanceOf(accounts0, BigNumber.from(1))).toString())
		//console.log(await erc1155_v2.balanceOf(accounts2, erc1155TokenId1))

/* 		expect((await erc1155_v2.balanceOf(accounts0, erc1155TokenId1)).toString()).to.eq("7");
		expect((await erc1155_v2.balanceOf(accounts2.address, BigNumber.from(erc1155TokenId1))).toString()).to.eq("3"); */
	})

	async function prepareETH_1155Orders(t2Amount = 10) {
		const data = '0x98765432'

		await erc1155_v2.mintGhost(accounts[2].address, 10, data, [[accounts[3].address, 1000]], "ext_uri", "", "")
		const erc1155TokenId1 = await getLastTokenID(erc1155_v2)

		let erc1155AsSigner = await erc1155_v2.connect(wallet2);
		await erc1155AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts2 });


		const left = Order(accounts1, Asset(ETH, "0x", 100), ZERO, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts2, Asset(ERC1155, enc(erc1155_v2.address, erc1155TokenId1), 7), ZERO, Asset(ETH, "0x", 100), 1, 0, 0, "0xffffffff", "0x");
		return { left, right, erc1155TokenId1 }
	}

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

	async function verifyBalanceChange(account, change, todo) {
		const BN = web3.utils.BN;
		let before = new BN(await web3.eth.getBalance(account));
		await todo();
		let after = new BN(await web3.eth.getBalance(account));
		let actual = before.sub(after);
		expect(actual).to.be.bignumber.equal(change.toString());
	}
});








