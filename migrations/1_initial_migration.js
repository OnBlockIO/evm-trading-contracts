const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  process.env.NETWORK = deployer.network
  //to test faster on testnets, do not deploy;
  if (deployer.network === 'rinkeby_nodeploy' || deployer.network === 'ropsten_nodeploy') {
		console.log('skip migrations deploy');
		return
	}
  deployer.deploy(Migrations, { gas: 200000 });
};
