const { MockProvider } = require('ethereum-waffle')
const { expect } = require('chai')
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeV2 = artifacts.require("TestExchangeV2.sol");
//const GhostAuction = artifacts.require("GhostAuction.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const GhostERC1155 = artifacts.require("TestERC1155WithRoyalties.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyalties.sol");
const TransferProxyTest = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const LibOrderTest = artifacts.require("LibOrder.sol");
const GhostMarketTransferManagerTest = artifacts.require("GhostMarketTransferManagerTest.sol");

const { BigNumber, Bytes, ContractTransaction, ethers } = require('ethers')

const { Order, Asset } = require("./order");
const ZERO = "0x0000000000000000000000000000000000000000";
const { verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC721, ERC1155, enc, } = require("./assets");

const {
	BN,           // Big Number support
	constants,    // Common constants, like the zero address and largest integers
	expectEvent,  // Assertions for emitted events
	expectRevert, // Assertions for transactions that should fail
	ether,
} = require('@openzeppelin/test-helpers');

const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, getLastTokenID, mineTx, getCurrentBlockTime, advanceTimeAndBlock } = require('./include_in_tesfiles.js')


contract("GhostAuction", accounts => {
	let network = process.env.NETWORK;
	console.log("network: ", network);
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let t1;
	let libOrder;
	let protocol = accounts[6];
	let community = accounts[7];
	const eth = "0x0000000000000000000000000000000000000000";
	const data = '0x987654321'

	const ERROR_MESSAGES = {
		NOT_OWNER: 'Ownable: caller is not the owner',
		AUCTION_ALREADY_EXISTS: 'Auction already exists',
		AUCTION_DOESNT_EXIST: "Auction doesn't exist",
		INVALID_AMOUNT: "Amount doesn't equal msg.value",
		AUCTION_EXPIRED: 'Auction expired',
		NOT_MIN_BID:
			'Must bid more than last bid by MIN_BID_INCREMENT_PERCENT amount',
		BID_NOT_ZERO: 'Amount must be greater than 0',
		ONLY_AUCTION_CREATOR: 'Can only be called by auction curator',
		AUCTION_ALREADY_STARTED: 'Auction already started',
		AUCTION_HASNT_COMPLETED: "Auction hasn't completed",
		CALLER_NOT_ADMIN: 'Caller does not have admin privileges',
		CURATOR_FEE_TOO_HIGH: 'Curator fee should be < 100',
	};

	const bidCasesToTest = [
		'2000000000000000000',
		'1234567891234567891',
		'2222222222222222222',
		'3333333333333333333',
		'5555555555555555555',
		'9999999999999999999',
		// Some random bid numbers:
		'158134551011714294',
		'634204952770520617',
		'59188223259592080',
		'17570476732738631',
		'83671249304232044',
		'514248157864491240',
		'63714481580729030',
		'139296974387483490',
		'12715907252298855',
		'977541585289014023',
	];
	let do_not_deploy = false

	beforeEach(async () => {
		if (network === 'rinkeby_nodeploy' && do_not_deploy) {
			transferProxy = await TransferProxyTest.at('0xad8507A1824FbB36965D3A5b9dab9e1367D3659C');
			erc20TransferProxy = await ERC20TransferProxy.at('0xFBC9Bd2cC410Da2B559066EbCb116C4D8dD4Ff72');
			//testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, protocol], { initializer: "__ExchangeV2_init" });
			testing = await ExchangeV2.at('0x156b5e1aE4161D9C0d479f19aF959b4C213980a3');
			console.log("testing: ", testing.address);
			//transferManagerTest = await GhostMarketTransferManagerTest.at('0x13A6F40dbAe48B6Fc9a801E945749D60044b49dB');
			//console.log("transferManagerTest: ", transferManagerTest.address);
			t1 = await TestERC20.at('0x52A46Aa1fCb8A252e97265a78E6C3021D64F52b1');
			//set protocol fee and fee address
			//fee receiver for ETH transfer is the protocol address
			//await testing.setFeeReceiver(eth, protocol);
			//fee receiver for Token t1 transfer is the protocol address
			//await testing.setFeeReceiver(t1.address, protocol);
			// ERC1155V2
			GhostERC1155contract = await GhostERC1155.at('0x2B57BfDd4Dd7ff120c812A46d2a7B46E3A2852AD');
			console.log("GhostERC1155contract: ", GhostERC1155contract.address);
			// ERC721_V1
			erc721V1 = await ERC721_V1.at('0xB5cCbc8c004a8aEE69f54501Bf04180BFEf885F3');
			console.log("erc721V1: ", erc721V1.address);
		} else if (network === 'ropsten_nodeploy' && do_not_deploy) {
			transferProxy = await TransferProxyTest.at('0x6C84942370808A18CDD8b602F80Ebd69bc81C76a');
			console.log("transferProxy: ", transferProxy.address);

			erc20TransferProxy = await ERC20TransferProxy.at('0x0949EE00c6d8A830159A9E293ba7d59d226C1C32');
			console.log("ERC20TransferProxy: ", ERC20TransferProxy.address);

			//testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, protocol], { initializer: "__ExchangeV2_init" });
			testing = await ExchangeV2.at('0xe7dF1E6aED990669B219971c9cF8740EB34676DE');
			console.log("testing: ", testing.address);
			//transferManagerTest = await GhostMarketTransferManagerTest.at('0x13A6F40dbAe48B6Fc9a801E945749D60044b49dB');
			//console.log("transferManagerTest: ", transferManagerTest.address);
			t1 = await TestERC20.at('0xDd5A7F7F25D6Bb38CcFB45b8e29521f317cad3d5');
			console.log("t1: ", t1.address);
			//set protocol fee and fee address
			//fee receiver for ETH transfer is the protocol address
			//await testing.setFeeReceiver(eth, protocol);
			//fee receiver for Token t1 transfer is the protocol address
			//await testing.setFeeReceiver(t1.address, protocol);
			// ERC1155V2
			GhostERC1155contract = await GhostERC1155.at('0x3Df90cb09d4Ae8AA4CFBD031c5fF071c48735478');
			console.log("GhostERC1155contract: ", GhostERC1155contract.address);
			// ERC721_V1
			erc721V1 = await ERC721_V1.at('0x594CFdB9968E71F521820B9869F4846Fd12cdcF4');
			console.log("erc721V1: ", erc721V1.address);

		} else {
			/* 		libOrder = await LibOrderTest.new();*/
			transferProxy = await TransferProxyTest.new();
			await transferProxy.__TransferProxy_init();
			console.log("transferProxy: ", transferProxy.address);
			erc20TransferProxy = await ERC20TransferProxy.new();
			await erc20TransferProxy.__ERC20TransferProxy_init();
			console.log("erc20TransferProxy: ", erc20TransferProxy.address);
			//set protocol fee and fee address
			testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, protocol], { initializer: "__ExchangeV2_init" });
			console.log("testing: ", testing.address);
			//transferManagerTest = await GhostMarketTransferManagerTest.new();
			//console.log("transferManagerTest: ", transferManagerTest.address);
			t1 = await TestERC20.new();
			console.log("t1: ", t1.address);
			// ETH
			//fee receiver for ETH transfer is the protocol address
			await testing.setFeeReceiver(eth, protocol);
			//fee receiver for Token t1 transfer is the protocol address
			await testing.setFeeReceiver(t1.address, protocol);
			/* 
			// ERC721
			erc721 = await TestERC721.new(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
			*/
			// ERC1155V2
			GhostERC1155contract = await GhostERC1155.new();
			await GhostERC1155contract.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
			console.log("GhostERC1155contract: ", GhostERC1155contract.address);
			// ERC721_V1
			erc721V1 = await ERC721_V1.new();
			await erc721V1.initialize(TOKEN_NAME, TOKEN_SYMBOL, BASE_URI);
			console.log("erc721V1: ", erc721V1.address);
		}
		await transferProxy.addOperator(testing.address)
		await erc20TransferProxy.addOperator(testing.address)
	});

	describe('createAuction', () => {
		describe('when the auction already exists', () => {
			it('should increment auctionId', async () => {
				let result1 = await setupAndCreateAuctionERC721()
				expect(result1.auctionId.toString()).eq('1')

				let result2 = await setupAndCreateAuctionERC721()
				expect(result2.auctionId.toString()).eq('2')
			});
		});
	});
	describe('createBid', () => {
		describe("should revert", () => {
			it("when the bid amount does not match the transaction message amount", async () => {
				let result1 = await setupAndCreateAuctionERC721()
				const amount = ether('1')
				await expectRevert(
					testing.createBid(result1.auctionId, amount, { value: ether('2') }),
					ERROR_MESSAGES.INVALID_AMOUNT
				)
			});
			it("when the auction doesn't exist", async () => {
				const amount = ether('1')
				await expectRevert(
					testing.createBid(2, amount, { value: ether('1') }),
					ERROR_MESSAGES.AUCTION_DOESNT_EXIST
				)
			});
		});
		describe('when the amount passed in is less than the previous bid amount', () => {
			it('should revert', async () => {
				const { auctionId } = await setupAndCreateAuctionERC721()

				const oneETH = ether('1')

				await testing.createBid(auctionId, oneETH, { value: oneETH, from: accounts[5] })

				await expectRevert(
					testing.createBid(auctionId, oneETH, { value: oneETH, from: accounts[4] }),
					ERROR_MESSAGES.NOT_MIN_BID
				)

			});
		});

		describe('when there is an existing bid', () => {
			it('should refund the previous bidder', async () => {
				const {
					auctionId,
					tokenId,
					duration,
					reservePrice,
					nftContractAddress } = await setupAndCreateAuctionERC721()

				const oneETH = ether('1')
				const twoETH = ether('2')

				const firstBidderWallet = accounts[5]
				const originalBalance = await web3.eth.getBalance(firstBidderWallet)

				await testing.createBid(auctionId, oneETH, { value: oneETH, from: firstBidderWallet, gasPrice: 0 })

				const postBidBalance = await web3.eth.getBalance(firstBidderWallet)
				console.log("postBidBalance: " + postBidBalance);
				console.log("originalBalance: " + originalBalance);

				expect(postBidBalance.toString()).eq(
					(new BN(originalBalance).sub(oneETH)).toString()
				);

				const secondBidderWallet = accounts[6]
				const originalBalance2 = await web3.eth.getBalance(secondBidderWallet)
				await testing.createBid(auctionId, twoETH, { value: twoETH, from: secondBidderWallet, gasPrice: 0 })

				const postBidBalance2 = await web3.eth.getBalance(secondBidderWallet)
				console.log("postBidBalance2: " + postBidBalance2);
				console.log("originalBalance2: " + originalBalance2);

				expect(postBidBalance2.toString()).eq(
					(new BN(originalBalance2).sub(twoETH)).toString()
				);

				const currentBalanceFirstBidderWallet = await web3.eth.getBalance(firstBidderWallet)

				console.log("currentBalanceFirstBidderWallet: " + currentBalanceFirstBidderWallet);

				expect(originalBalance.toString()).eq(
					currentBalanceFirstBidderWallet.toString()
				);

			});
		});
	});
	describe("when ending an auction that doesn't exist", () => {
		it('should revert', async () => {
			await expectRevert(
				testing.getEndAuctionData(100),
				ERROR_MESSAGES.AUCTION_HASNT_COMPLETED
			);
		});
	});

	describe("when ending an auction that hasn't begun", () => {
		it('should revert', async () => {
			const {
				auctionId,
				tokenId,
				duration,
				reservePrice,
				nftContractAddress } = await setupAndCreateAuctionERC721()

			await expectRevert(testing.getEndAuctionData(auctionId),
				ERROR_MESSAGES.AUCTION_HASNT_COMPLETED
			);
		});
	});

	describe("when ending an auction that hasn't completed", () => {
		it('should revert', async () => {
			const {
				auctionId,
				tokenId,
				duration,
				reservePrice,
				nftContractAddress } = await setupAndCreateAuctionERC721()

			const oneETH = ether('1')
			const firstBidderWallet = accounts[5]
			let tx = await testing.createBid(auctionId, oneETH, { value: oneETH, from: firstBidderWallet, gasPrice: 0 })
			await mineTx(tx);
			await expectRevert(testing.getEndAuctionData(auctionId),
				ERROR_MESSAGES.AUCTION_HASNT_COMPLETED
			);
		});
	});

	describe('after a valid auction', () => {
		let nftOwnerBeforeEndAuction,
			auctionBeforeEndAuction,
			auctionAfterEndAuction,
			beforeCreatorBalance,
			afterCreatorBalance,
			creatorAmount,
			receipt,
			endAuctionResult,
			erc721TokenId1,
			bidAmount1,
			firstBidderWallet,
			orderAmount,
			auctionId,
			tokenId,
			duration,
			reservePrice,
			nftContractAddress,
			fundsRecipientWallet

		beforeEach(async () => {
			let result = await setupAuctionDataERC721()

			tokenId = result.tokenId
			duration = result.duration
			reservePrice = result.reservePrice
			fundsRecipientWallet = result.fundsRecipientWallet

			nftContractAddress = erc721V1.address

			console.log("auctionId: ", auctionId)
			console.log("tokenId: ", tokenId)
			console.log("duration: ", duration)
			console.log("fundsRecipientWallet: ", fundsRecipientWallet)
			console.log("nftContractAddress: ", nftContractAddress)

			let setupAuctionERC721result = await setupAuctionERC721(
				tokenId,
				duration,
				reservePrice = new BN(1),
				fundsRecipientWallet,
				nftContractAddress

			)
			auctionId = setupAuctionERC721result.auctionId
			console.log("reservePrice: ", reservePrice)

			firstBidderWallet = accounts[5]
			bidAmount1 = 200
			orderAmount = bidAmount1 + (bidAmount1 * 0.1 + bidAmount1 * 0.05)
			console.log("orderAmount: ", orderAmount)

			console.log("auctionId: ", auctionId)
			console.log("firstBidderWallet: ", firstBidderWallet)

			let tx = await testing.createBid(auctionId, orderAmount, { value: orderAmount, from: firstBidderWallet });
			await mineTx(tx);
			console.log("getCurrentBlockTime: ", await getCurrentBlockTime())

			await advanceTimeAndBlock(duration);
			console.log("getCurrentBlockTime: ", await getCurrentBlockTime())

			nftOwnerBeforeEndAuction = await erc721V1.ownerOf(
				tokenId
			);
			console.log("erc721V1.ownerOf(tokenId) address: ", await erc721V1.ownerOf(tokenId))

			const originalBalance = await web3.eth.getBalance(firstBidderWallet)
			auctionBeforeEndAuction = await testing.auctions(auctionId);
			console.log("auctionBeforeEndAuction: ", auctionBeforeEndAuction)
			//beforeCreatorBalance = await creatorWallet.getBalance();
			testing.deleteAuctionOnlyAdmin(auctionId, { from: protocol })

			auctionAfterEndAuction = await testing.auctions(auctionId);
			console.log("auctionAfterEndAuction: ", auctionAfterEndAuction)
			//afterCreatorBalance = await web3.eth.getBalance(creatorWallet) 
			//console.log("testing balance: ", await web3.eth.getBalance(testing.address))

		});

		it('should delete the auction', () => {
			expect(auctionBeforeEndAuction.nftContract).eq(nftContractAddress);
			expect(auctionAfterEndAuction.nftContract).eq(ZERO);
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
				fundsRecipientWallet
			} = await setupAuctionDataERC721()

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

			await verifyBalanceChange(buyer, 0, async () =>			//payed already while bidding
				verifyBalanceChange(seller, -194, async () =>				//200 - (10+20royalties) or matchAndTransferAuction(200 -6)
					verifyBalanceChange(accounts[3], -10, async () =>
						verifyBalanceChange(accounts[4], -20, async () =>
							verifyBalanceChange(protocol, -6, () =>
								verifyBalanceChange(testing.address, 230, () =>
									//testing.matchAndTransferTest(left, right, { from: buyer, value: 300, gasPrice: 0 })
									//testing.endAuctionDoTransfer(left, right, auctionId, { gasPrice: 0 })
									testing.endAuctionDoTransfer(left, right, auctionId)
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

		it.only(' should revert with caller is not the owner', async () => {
			let seller = accounts[1]
			let buyer = accounts[2]

			let {
				tokenId,
				duration,
				reservePrice,
				fundsRecipientWallet
			} = await setupAuctionDataERC721()

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


			await expectRevert(
				testing.endAuctionDoTransfer(left, right, auctionId, { from: accounts[1] }),
				"Ownable: caller is not the owner"
			);

		});

		it('should revert if NFT owner burns the NFT before the aution is finished', async () => {
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

			await erc721V1.burn(tokenId, { from: accounts[1] })

			await expectRevert(
				erc721V1.ownerOf(tokenId),
				"revert ERC721: owner query for nonexistent token"
			);

			await advanceTimeAndBlock(duration);
			console.log("getCurrentBlockTime: ", await getCurrentBlockTime())

			let erc721TokenId1 = tokenId

			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: seller });

			// maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data
			const left = Order(buyer, Asset(ETH, "0x", bidAmount1), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(seller, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", bidAmount1), 1, 0, 0, "0xffffffff", "0x");

			await expectRevert(
				testing.endAuctionDoTransfer(left, right, auctionId),
				"ERC721: operator query for nonexistent token"
			);

			console.log("testing balance: ", await web3.eth.getBalance(testing.address))
			console.log("testing erc721 balance: ", await erc721V1.balanceOf(testing.address))
			console.log("seller balance: ", await web3.eth.getBalance(seller))
			console.log("buyer balance: ", await web3.eth.getBalance(buyer))
			assert.equal(await erc721V1.balanceOf(seller), 0);
			assert.equal(await erc721V1.balanceOf(buyer), 0);
		});

		it('should revert, if NFT owner moves the NFT to another account before the aution is finished', async () => {
			let seller = accounts[1]
			let buyer = accounts[2]
			let anotherAccount = accounts[4]

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


			erc721V1.safeTransferFrom(seller, anotherAccount, tokenId, { from: seller })

			await advanceTimeAndBlock(duration);
			console.log("getCurrentBlockTime: ", await getCurrentBlockTime())

			let erc721TokenId1 = tokenId

			await erc721V1.setApprovalForAll(transferProxy.address, true, { from: seller });

			// maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data
			const left = Order(buyer, Asset(ETH, "0x", bidAmount1), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(seller, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", bidAmount1), 1, 0, 0, "0xffffffff", "0x");

			await expectRevert(
				testing.endAuctionDoTransfer(left, right, auctionId),
				"ERC721: transfer caller is not owner nor approved"
			);

			console.log("testing balance: ", await web3.eth.getBalance(testing.address))
			console.log("testing erc721 balance: ", await erc721V1.balanceOf(testing.address))
			console.log("seller balance: ", await web3.eth.getBalance(seller))
			console.log("buyer balance: ", await web3.eth.getBalance(buyer))
			assert.equal(await erc721V1.balanceOf(seller), 0);
			assert.equal(await erc721V1.balanceOf(buyer), 0);
		});
	});
	if (network === 'rinkeby_nodeploy') {

		describe("TESTNET ending an auction TESTNET", () => {
			it('should send ERC721 asset to buyer with royalties', async () => {
				let seller = accounts[1]
				let buyer = accounts[2]

				let {
					tokenId,
					duration,
					reservePrice,
				} = await setupAuctionDataERC721()

				const nftContractAddress = erc721V1.address
				const fundsRecipientWallet = accounts[3]


				let result = await setupAuctionERC721(
					tokenId,
					duration = 20,
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
				/* 				await sleep(21000);
								console.log("getCurrentBlockTime: ", await getCurrentBlockTime()) */

				//await advanceTimeAndBlock(duration);

				let erc721TokenId1 = tokenId
				console.log("erc721TokenId1: ", erc721TokenId1)
				console.log("erc721TokenId1 owner address: ", await erc721V1.ownerOf(erc721TokenId1))


				await erc721V1.setApprovalForAll(transferProxy.address, true, { from: seller });

				// maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data
				const left = Order(buyer, Asset(ETH, "0x", bidAmount1), ZERO, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
				const right = Order(seller, Asset(ERC721, enc(erc721V1.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", bidAmount1), 1, 0, 0, "0xffffffff", "0x");

				await verifyBalanceChange(buyer, 0, async () =>			//payed already while bidding
					verifyBalanceChange(seller, -194, async () =>				//200 - (10+20royalties) or matchAndTransferAuction(200 -6)
						verifyBalanceChange(accounts[3], -10, async () =>
							verifyBalanceChange(accounts[4], -20, async () =>
								verifyBalanceChange(protocol, -6, () =>
									verifyBalanceChange(testing.address, 230, () =>
										//testing.matchAndTransferTest(left, right, { from: buyer, value: 300, gasPrice: 0 })
										//testing.endAuctionDoTransfer(left, right, auctionId, { gasPrice: 0 })
										testing.endAuctionDoTransfer(left, right, auctionId)
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

	}
	function sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	it('should emit event OrderCreated', async () => {

		let {
			tokenId,
			duration,
			reservePrice,
		} = await setupAuctionDataERC721()

		const fundsRecipientWallet = accounts[3]
		const nftContractAddress = erc721V1.address


		const setupAuctionResult = await setupAuctionERC721(
			tokenId,
			duration = 2000,
			reservePrice,
			fundsRecipientWallet,
			nftContractAddress,
			true
		)
		console.log(setupAuctionResult.tx)

		expectEvent(setupAuctionResult.tx, 'OrderCreated', {
			auctionId: setupAuctionResult.auctionId,
			tokenId: new BN(tokenId),
			nftContractAddress: nftContractAddress,
			duration: new BN(duration),
			reservePrice: setupAuctionResult.reservePrice,
			auctionType: "2"
		})
	});

	it('should send ERC1155 asset to buyer with royalties', async () => {
		let erc1155TokenId1,
			bidAmount1,
			orderAmount

		let seller = accounts[1]
		let buyer = accounts[2]

		const {
			tokenId,
			duration,
			reservePrice,
			erc1155tokenAmount
		} = await setupAuctionDataERC1155()
		erc1155TokenId1 = tokenId
		const nftContractAddress = erc721V1.address

		let result = await setupAuctionERC1155(
			tokenId,
			duration,
			//low reserve price, since that's not what we're testing
			BigNumber.from('1'),
			nftContractAddress
		)
		const auctionId = result.auctionId

		const royalties = await GhostERC1155contract.getRoyalties(erc1155TokenId1)
		console.log("ERC1155 royalties: ", royalties)

		bidAmount1 = 200
		//calculate final bid amount with royalties => (BP / 10000)
		orderAmount = bidAmount1 + bidAmount1 * (parseInt(royalties[0]['value']) / 10000)
		console.log("orderAmount: ", orderAmount)

		let tx = await testing.createBid(auctionId, orderAmount, { value: orderAmount, from: buyer });
		await mineTx(tx);
		console.log("getCurrentBlockTime: ", await getCurrentBlockTime())

		await advanceTimeAndBlock(duration);
		console.log("getCurrentBlockTime: ", await getCurrentBlockTime())
		console.log("erc1155TokenId1: ", erc1155TokenId1)
		console.log("erc1155TokenId1 owner address: ", await GhostERC1155contract._ownerOf(erc1155TokenId1))


		await GhostERC1155contract.setApprovalForAll(transferProxy.address, true, { from: seller });

		// Order: maker, makeAsset, taker, takeAsset, salt, start, end, dataType, data
		// Asset: assetClass, assetData, value
		const left = Order(buyer, Asset(ETH, "0x", 200), ZERO, Asset(ERC1155, enc(GhostERC1155contract.address, erc1155TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(seller, Asset(ERC1155, enc(GhostERC1155contract.address, erc1155TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

		await verifyBalanceChange(buyer, 0, async () =>			//payed already while bidding to the auction contract
			verifyBalanceChange(seller, -194, async () =>				//matchAndTransferAuction(200 - 6)
				verifyBalanceChange(accounts[3], -20, async () =>
					verifyBalanceChange(protocol, -6, () =>
						verifyBalanceChange(testing.address, 220, () =>
							//testing.matchAndTransferTest(left, right, { from: buyer, value: 300, gasPrice: 0 })
							//testing.endAuctionDoTransfer(left, right, auctionId, { gasPrice: 0 })
							testing.endAuctionDoTransfer(left, right, auctionId)
						)
					)
				)
			)
		)

		console.log("testing balance: ", await web3.eth.getBalance(testing.address))
		console.log("testing erc721 balance: ", await GhostERC1155contract.balanceOf(testing.address, erc1155TokenId1))
		console.log("seller balance: ", await web3.eth.getBalance(seller))
		console.log("buyer balance: ", await web3.eth.getBalance(buyer))
		assert.equal((await GhostERC1155contract.balanceOf(seller, erc1155TokenId1)).toString(), (erc1155tokenAmount - 1).toString());
		assert.equal((await GhostERC1155contract.balanceOf(buyer, erc1155TokenId1)).toString(), '1');
	});


	async function setupAndCreateAuctionERC721() {
		const {
			tokenId,
			duration,
			reservePrice,
			fundsRecipient
		} = await setupAuctionDataERC721()

		const nftContractAddress = erc721V1.address

		return await setupAuctionERC721(
			tokenId,
			duration,
			reservePrice,
			fundsRecipient,
			nftContractAddress
		)
	}

	async function setupAuctionERC721(
		tokenId,
		duration,
		reservePrice,
		fundsRecipientWallet,
		nftContractAddress,
		returnTransaction = false
	) {
		console.log("tokenId: ", tokenId)
		console.log("duration: ", duration)
		console.log("reservePrice: ", reservePrice)
		console.log("nftContractAddress: ", nftContractAddress)

		let tx = await testing.createAuction(
			tokenId,
			duration,
			reservePrice,
			nftContractAddress
		);

		const auctionId = await testing.getCurrentAuctionId()
		console.log("auctionId: ", auctionId)
		if (returnTransaction) {
			return {
				auctionId,
				tokenId,
				duration,
				reservePrice,
				fundsRecipientWallet,
				nftContractAddress,
				tx
			}
		} else {
			return {
				auctionId,
				tokenId,
				duration,
				reservePrice,
				nftContractAddress
			}
		}

	}

	async function setupAuctionERC1155(
		tokenId,
		duration,
		reservePrice,
		nftContractAddress
	) {
		console.log("testing address: ", testing.address)
		console.log("tokenId: ", tokenId)
		console.log("duration: ", duration)
		console.log("reservePrice: ", reservePrice)
		console.log("nftContractAddress: ", nftContractAddress)

		await testing.createAuction(
			tokenId,
			duration,
			reservePrice,
			nftContractAddress
		);

		const auctionId = await testing.getCurrentAuctionId()
		console.log("auctionId: ", auctionId)

		return {
			auctionId,
			tokenId,
			duration,
			reservePrice,
			nftContractAddress
		}
	}

	async function setupAuctionDataERC1155() {
		const erc1155tokenAmount = 10
		await GhostERC1155contract.mintGhost(accounts[1], erc1155tokenAmount, data, [[accounts[3], 1000]], "ext_uri", "", "")
		const erc1155TokenId1 = await getLastTokenID(GhostERC1155contract)

		const tokenId = erc1155TokenId1.toNumber();
		const duration = 60 * 60 * 24; // 24 hours
		const reservePrice = ether('1');

		return {
			tokenId,
			duration,
			reservePrice,
			erc1155tokenAmount
		};
	}

	async function setupAuctionDataERC721() {
		await erc721V1.mintGhost(accounts[1], [[accounts[3], 500], [accounts[4], 1000]], "ext_uri", "", "");
		const erc721TokenId1 = await erc721V1.getLastTokenID()

		const tokenId = erc721TokenId1.toNumber();
		const duration = 60 * 60 * 24; // 24 hours
		const reservePrice = ether('1');
		const fundsRecipientWallet = accounts[3]

		return {
			tokenId,
			duration,
			reservePrice,
			fundsRecipientWallet
		};
	}
});