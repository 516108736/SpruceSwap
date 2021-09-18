// config
const feeToSetter = ""; // set fee setter of factory

// contracts
const Factory = artifacts.require("UniswapV2Factory");


module.exports = async function (deployer, network, accounts) {
  // 1. deploy swap factory
  await deployer.deploy(Factory, accounts[0]);
  const factoryInstance = await Factory.deployed();
  const hash = await factoryInstance.pairCodeHash();
  console.log("pairCodeHash: " + hash);
  console.log("factory address: " + factoryInstance.address);
};
