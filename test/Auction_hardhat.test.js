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
	expectRevert,
	ether
} = require('@openzeppelin/test-helpers');
const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID } = require('./include_in_tesfiles.js')





describe('Auction', async function () {

	let testing;
	let accounts0 = accounts[0].address
	let accounts1 = accounts[3].address
	let accounts2 = accounts[4].address
	let accounts3 = accounts[5].address
	let wallet0 = accounts[0]
	let wallet1 = accounts[3]
	let wallet2 = accounts[4]

	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let t1;
	let erc721V1;
	let libOrder;
	let protocol = accounts[1].address;
	let community = accounts[2].address;
	const eth = "0x0000000000000000000000000000000000000000";
	console.log("accounts0: ", accounts0)
	console.log("accounts1: ", accounts1)
	console.log("accounts2: ", accounts2)
	console.log("protocol: ", protocol)
	console.log("community: ", community)

	let do_not_deploy = true

	beforeEach(async function () {
		let LibOrderTest = await ethers.getContractFactory("LibOrderTest");
		let TransferProxyTest = await ethers.getContractFactory("TransferProxy");
		let ERC20TransferProxyTest = await ethers.getContractFactory("TransferProxy");
		let ExchangeV2 = await ethers.getContractFactory("TestExchangeV2");
		let GhostMarketTransferManagerTest = await ethers.getContractFactory("GhostMarketTransferManagerTest");
		let TestERC20 = await ethers.getContractFactory("TestERC20");
		let TestERC721V1 = await ethers.getContractFactory("TestERC721WithRoyalties");
		if (hre.network.name == 'rinkeby_nodeploy' && do_not_deploy) {
			libOrder = await LibOrderTest.attach("0xe6d8b6b092FC329f7DdE363ee1958f2bb2D861c3");
			transferProxy = await TransferProxyTest.attach("0x3A6D2FEdd3E5E6D5aC20DE61460122079319dCae")
			erc20TransferProxy = await ERC20TransferProxyTest.attach("0x75b3cddB124bC74d72870fe7d12bB0b057491E89")
			testing = await ExchangeV2.attach("0xD135B5E64662021EeC6734762DCDd9D19279D32F")
			transferManagerTest = await GhostMarketTransferManagerTest.attach("0xfA16a2D02886de0F245A903700E8D8a7aE7FAa21")
			t1 = await TestERC20.attach("0x9E31d46103809f659dF3d1D3343d68F3671555cf")
			erc721V1 = await TestERC721V1.attach("0xD9098Ec812C9a930f170D28F6D2C1E56AE6c2899")
		} else if (hre.network.name == 'bsctestnet_nodeploy' && do_not_deploy) {
			libOrder = await LibOrderTest.attach("0xe6d8b6b092FC329f7DdE363ee1958f2bb2D861c3");
			transferProxy = await TransferProxyTest.attach("0x3A6D2FEdd3E5E6D5aC20DE61460122079319dCae")
			erc20TransferProxy = await ERC20TransferProxyTest.attach("0x75b3cddB124bC74d72870fe7d12bB0b057491E89")
			testing = await ExchangeV2.attach("0xD135B5E64662021EeC6734762DCDd9D19279D32F")
			transferManagerTest = await GhostMarketTransferManagerTest.attach("0xfA16a2D02886de0F245A903700E8D8a7aE7FAa21")
			t1 = await TestERC20.attach("0x9E31d46103809f659dF3d1D3343d68F3671555cf")
			erc721V1 = await TestERC721V1.attach("0xD9098Ec812C9a930f170D28F6D2C1E56AE6c2899")
		} else {
			libOrder = await LibOrderTest.deploy();
			transferProxy = await TransferProxyTest.deploy();
			erc20TransferProxy = await ERC20TransferProxyTest.deploy();
			testing = await upgrades.deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, protocol], { initializer: "__ExchangeV2_init" });
			transferManagerTest = await GhostMarketTransferManagerTest.deploy();
			t1 = await TestERC20.deploy();
			erc721V1 = await TestERC721V1.deploy();
			await erc721V1.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);

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

	});
	describe('createBid', () => {
		it("when the auction doesn't exist", async () => {
			const amount = ether('1')
			await expectRevert(
				testing.createBid(2, amount, { value: ether('1') }),
				ERROR_MESSAGES.AUCTION_DOESNT_EXIST
			)
		});
		it.only("when the auction doesn't exist", async () => {
			const amount = BigNumber.from("1000000000000000000")
			await testing.createBid(2, amount, { value: amount })

		});
	});

	describe("ending an auction", () => {
		it('should send ERC721 asset to buyer with royalties', async () => {
			let seller = accounts[1]
			let buyer = accounts[2]

			let {
				tokenId,
				duration,
				reservePrice,
			} = await setupAuctionDataERC721()

			const fundsRecipientWallet = accounts[3]
			const nftContractAddress = erc721V1.address

			let result = await setupAuctionERC721(
				tokenId,
				duration,
				reservePrice = BigNumber.from('1'),
				fundsRecipientWallet,
				nftContractAddress
			)

			const auctionId = result.auctionId

			let bidAmount1 = 200
			let orderAmount = bidAmount1 + (bidAmount1 * 0.1 + bidAmount1 * 0.05)
			console.log("orderAmount: ", orderAmount)

			let tx = await testing.createBid(auctionId, orderAmount, { value: orderAmount, from: buyer });
			await mineTx(tx);
			console.log("getCurrentBlockTime: ", await getCurrentBlockTime())

			await advanceTimeAndBlock(duration);
			console.log("getCurrentBlockTime: ", await getCurrentBlockTime())

			let erc721TokenId1 = tokenId
			console.log("erc721TokenId1: ", erc721TokenId1)
			console.log("erc721TokenId1 owner address: ", await erc721V1.ownerOf(erc721TokenId1))


			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: seller });

			// maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data
			const left = Order(buyer, Asset(ETH, "0x", bidAmount1), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(seller, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", bidAmount1), 1, 0, 0, "0xffffffff", "0x");
			if (hre.network.name == 'rinkeby' || hre.network.name == 'bsctestnet') {
				await testing.matchAndTransfer(left, right, auctionId)
			} else {

			}
			await verifyBalanceChange(buyer, 0, async () =>			//payed already while bidding
				verifyBalanceChange(seller, -194, async () =>				//200 - (10+20royalties) or matchAndTransferAuction(200 -6)
					verifyBalanceChange(accounts[3], -10, async () =>
						verifyBalanceChange(accounts[4], -20, async () =>
							verifyBalanceChange(protocol, -6, () =>
								verifyBalanceChange(testing.address, 230, () =>
									//testing.matchAndTransferTest(left, right, { from: buyer, value: 300, gasPrice: 0 })
									testing.matchAndTransfer(left, right, auctionId, { gasPrice: 0 })
								)
							)
						)
					)
				)
			)

			console.log("testing balance: ", await web3.eth.getBalance(testing.address))
			console.log("testing erc721 balance: ", await erc721V1.balanceOf(testing.address))
			console.log("seller balance: ", await web3.eth.getBalance(seller))
			console.log("buyer balance: ", await web3.eth.getBalance(buyer))
			assert.equal(await erc721V1.balanceOf(seller), 0);
			assert.equal(await erc721V1.balanceOf(buyer), 1);
		});
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
		await erc721V1.mintGhost(accounts1, [[accounts2, 300], [accounts3, 400]], "ext_uri", "", "");
		const erc721TokenId1 = await erc721V1.getLastTokenID()

		let erc721V1AsSigner = await erc721V1.connect(wallet1);
		await erc721V1AsSigner.setApprovalForAll(transferProxy.address, true, { from: accounts1 });
		//await erc721V1.setApprovalForAll(transferProxy.address, true);

		console.log('erc721V1 isApprovedForAll: ', await erc721V1.isApprovedForAll(accounts1, transferProxy.address));
		let matchOrdersSigner = await testing.connect(wallet0);


		const left = Order(accounts0, Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts1, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
		let signatureRight = await getSignature(right, accounts1);
		let signatureLeft = await getSignature(left, accounts0);
		console.log('left: ', left);
		console.log('right: ', right);
		console.log('signatureRight: ', signatureRight);
		console.log('signatureLeft: ', signatureLeft);

		console.log("accounts2 royalty balance before: ", (await web3.eth.getBalance(accounts2)).toString())
		console.log("accounts3 royalty balance before: ", (await web3.eth.getBalance(accounts3)).toString())

		console.log("protocol balance before: ", (await web3.eth.getBalance(protocol)).toString())
		console.log("community balance before: ", (await web3.eth.getBalance(community)).toString())
		let tx
		if (hre.network.name == 'rinkeby') {
			tx = await matchOrdersSigner.matchAndTransferExternal(left, right, { from: accounts0, value: 300 })
			tx.wait()
			console.log("tx: ", tx)
		}
		else {
			await verifyBalanceChange(accounts0, 206, async () =>			//200+6buyerFee (72back)
				verifyBalanceChange(accounts1, -186, async () =>				//200 - (6+8royalties)
					verifyBalanceChange(accounts2, -6, async () =>
						verifyBalanceChange(accounts3, -8, async () =>
							verifyBalanceChange(protocol, -6, () =>
								//matchOrdersSigner.matchOrders(left, "0x", right, signatureRight, { from: accounts0, value: 300, gasPrice: 0 })
								matchOrdersSigner.matchAndTransferExternal(left, right, { from: accounts0, value: 300, gasPrice: 0 })
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
		expect((await erc721V1.balanceOf(accounts0)).toString()).to.equal('1');
	})

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








