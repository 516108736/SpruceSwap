// contracts
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const UniswapV2Library = artifacts.require("UniswapV2Library");
const SafeMath = artifacts.require("SafeMath");

const factoryAddress = "";
const woktAddress = "";

module.exports = async function (deployer, network, accounts) {
    if (factoryAddress === "") {
        throw new Error('factory address is not set');
    }

    await deployer.deploy(UniswapV2Library);
    await deployer.link(UniswapV2Library, UniswapV2Router02);
    await deployer.deploy(SafeMath);
    await deployer.link(SafeMath, UniswapV2Router02);
    await deployer.deploy(UniswapV2Router02, factoryAddress, woktAddress);
    const routerInstance = await UniswapV2Router02.deployed();
    console.log("router address: " + routerInstance.address);
};