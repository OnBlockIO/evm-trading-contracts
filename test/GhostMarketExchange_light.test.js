const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");
const GhostMarketTransferManagerTest = artifacts.require("GhostMarketTransferManagerTest.sol");
const truffleAssert = require('truffle-assertions');

const sigUtil = require('eth-sig-util');

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

const { TOKEN_NAME, TOKEN_SYMBOL, BASE_URI, METADATA_JSON, getLastTokenID } = require('./include_in_tesfiles.js')


contract("ExchangeV2, sellerFee 3%", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let t1;
	let protocol = accounts[8];
	let community = accounts[7];
	const eth = "0x0000000000000000000000000000000000000000";


	beforeEach(async () => {
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxy.new();
		//set protocol fee and fee address

		testing = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, protocol], { initializer: "__ExchangeV2_init" });
		transferManagerTest = await GhostMarketTransferManagerTest.new();
		t1 = await TestERC20.new();
		/*ETH*/
		//fee receiver for ETH transfer is the protocol address
		await testing.setFeeReceiver(eth, protocol);
		//fee receiver for Token t1 transfer is the protocol address
		await testing.setFeeReceiver(t1.address, protocol);

	});

	it("eth orders work, rest is returned to taker (other side) ", async () => {
		await t1.mint(accounts[1], 100);
		await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

		const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
		const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");

		let signatureRight = await getSignature(right, accounts[1]);

		//await testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })

		/*     	await verifyBalanceChange(accounts[2], 206, async () =>
						verifyBalanceChange(accounts[1], -200, async () =>
							verifyBalanceChange(protocol, -6, () =>
								testing.matchOrders(left, "0x", right, signatureRight, { from: accounts[2], value: 300, gasPrice: 0 })
							)
						)
					) */
		assert.equal(await t1.balanceOf(accounts[1]), 0);
		assert.equal(await t1.balanceOf(accounts[2]), 100);
		/* 			console.log("left: ",left)
					console.log("right: ",right)
					console.log("signatureRight: ", signatureRight) */
	})

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}
});
