const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const ExchangeV2 = artifacts.require('ExchangeV2');
const TransferProxy = artifacts.require('TransferProxy');
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');

module.exports = async function (deployer, network, accounts) {
	//to test faster on testnets, do not deploy; use deployed contracts
	if (deployer.network === 'rinkeby_nodeploy' || deployer.network === 'ropsten_nodeploy') {
		console.log('skip proxy deploy');
		return
	}
	//deploy and initialize TransferProxy
	transferProxyDeployed = await TransferProxy.new();
	await transferProxyDeployed.__TransferProxy_init();
	
	//deploy and initialize ERC20TransferProxy
	erc20TransferProxyDeployed = await ERC20TransferProxy.new();
	await erc20TransferProxyDeployed.__ERC20TransferProxy_init();

	const transferProxy = transferProxyDeployed.address
	const erc20TransferProxy = erc20TransferProxyDeployed.address

	const exchangeFeeWallet = accounts[0]
	const adminRecoveryAddress = accounts[3]
	const feesBP = 200

	const instance = await deployProxy(
		ExchangeV2,
		[transferProxy, erc20TransferProxy, feesBP, exchangeFeeWallet, adminRecoveryAddress],
		{ deployer, initializer: '__ExchangeV2_init' }
	);
	//add ExchangeV2 address to the the allowed operators of transferProxy & erc20TransferProxy
	transferProxyDeployed.addOperator(instance.address)
	erc20TransferProxyDeployed.addOperator(instance.address)

	console.log('ExchangeV2 deployed: ', instance.address);
	console.log('transferProxy address: ', transferProxy)
	console.log('erc20TransferProxy address: ', erc20TransferProxy)
	console.log('exchangeFeeWallet address: ', exchangeFeeWallet)
	console.log('adminRecoveryAddress address: ', adminRecoveryAddress)
	console.log('fees value: ', feesBP / 100 + '%')
};