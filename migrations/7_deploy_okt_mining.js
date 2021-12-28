const Web3 = require('web3');
require('dotenv').config();
const regReplace = require("../utils/replace")

const editJsonFile = require("edit-json-file");
file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const spruceAddress = file.get("spruce")
const EMPTY_ADDRESS = process.env.EMPTY_ADDRESS
const OKT_MINING_DURATION = process.env.OKT_MINING_DURATION

// contracts
const StakingRewards = artifacts.require("StakingRewards");

module.exports = async function (deployer, network, accounts) {
    if (spruceAddress === "" || EMPTY_ADDRESS === "" || OKT_MINING_DURATION === "") {
        throw new Error('params of okt mining constructor are not all set');
    }

    // deploy okt mining
    await deployer.deploy(StakingRewards, accounts[0], spruceAddress, EMPTY_ADDRESS, OKT_MINING_DURATION);
    const oktMiningInstance = await StakingRewards.deployed();
    file.set("oktMining", oktMiningInstance.address);
    console.log("OKT Mining Address: " + oktMiningInstance.address);
    console.log(`mining duration: ${await oktMiningInstance.rewardsDuration()}`);
};