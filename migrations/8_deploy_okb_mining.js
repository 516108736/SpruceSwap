const Web3 = require('web3');
require('dotenv').config();
const regReplace = require("../utils/replace")

const editJsonFile = require("edit-json-file");
file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const spruceAddress = file.get("spruce")
const OKB_ADDRESS = process.env.OKB_ADDRESS
const OKB_MINING_DURATION = process.env.OKB_MINING_DURATION

// contracts
const StakingRewards = artifacts.require("StakingRewards");

module.exports = async function (deployer, network, accounts) {
    if (spruceAddress === "" || OKB_ADDRESS === "" || OKB_MINING_DURATION === "") {
        throw new Error('params of okb mining constructor are not all set');
    }

    // deploy okb mining
    await deployer.deploy(StakingRewards, accounts[0], spruceAddress, OKB_ADDRESS, OKB_MINING_DURATION);
    const okbMiningInstance = await StakingRewards.deployed();
    file.set("okbMining", okbMiningInstance.address);
    console.log("OKB Mining Address: " + okbMiningInstance.address);
    console.log(`mining duration: ${await okbMiningInstance.rewardsDuration()}`);
};