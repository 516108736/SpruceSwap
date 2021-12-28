const fs = require('fs');
const editJsonFile = require("edit-json-file");
require('dotenv').config();

file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

// contracts
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");
const UniswapV2Library = artifacts.require("UniswapV2Library");
const SafeMath = artifacts.require("SafeMath");

const factoryAddress = file.get("factory");
const WETHAddress = process.env.WETH;

module.exports = async function (deployer, network, accounts) {
    if (factoryAddress === "" || WETHAddress === "") {
        throw new Error('factory or WETH address is not set');
    }

    await deployer.deploy(UniswapV2Library);
    await deployer.link(UniswapV2Library, UniswapV2Router02);
    await deployer.deploy(SafeMath);
    await deployer.link(SafeMath, UniswapV2Router02);
    await deployer.deploy(UniswapV2Router02, factoryAddress, WETHAddress);
    const routerInstance = await UniswapV2Router02.deployed();
    file.set("router", routerInstance.address);
    console.log("Router Address: " + routerInstance.address);
};