const editJsonFile = require("edit-json-file");
const Web3 = require('web3');
require('dotenv').config();

file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const INITIAL_LIQUIDITY_ADDRESS = process.env.INITIAL_LIQUIDITY_ADDRESS;
const INITIAL_LIQUIDITY_AMOUNT = process.env.INITIAL_LIQUIDITY_AMOUNT;
const AIR_DROP_ADDRESS = process.env.AIR_DROP_ADDRESS;
const AIR_DROP_AMOUNT = process.env.AIR_DROP_AMOUNT;

// contracts
const SpruceToken = artifacts.require("SpruceToken");

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(SpruceToken);
    const spruceInstance = await SpruceToken.deployed();
    file.set("spruce", spruceInstance.address);
    console.log("Spruce Address: " + spruceInstance.address);

    if (INITIAL_LIQUIDITY_ADDRESS !== "" && INITIAL_LIQUIDITY_AMOUNT !== "") {
        await spruceInstance.transfer(INITIAL_LIQUIDITY_ADDRESS, Web3.utils.toWei(INITIAL_LIQUIDITY_AMOUNT));
    }

    if (AIR_DROP_ADDRESS !== "" && AIR_DROP_AMOUNT !== "") {
        await spruceInstance.transfer(AIR_DROP_ADDRESS, Web3.utils.toWei(AIR_DROP_AMOUNT));
    }

};