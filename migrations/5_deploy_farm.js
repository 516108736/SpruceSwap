const editJsonFile = require("edit-json-file");
const Web3 = require('web3');
require('dotenv').config();

file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const spruceAddress = file.get("spruce")
const SPRUCE_PER_BLOCK = process.env.SPRUCE_PER_BLOCK
const DEV_ADDR = process.env.DEV_ADDR

// contracts
const Farm = artifacts.require("FarmPool");
const Spruce = artifacts.require("SpruceToken");

module.exports = async function (deployer, network, accounts) {
    if (spruceAddress === "" || SPRUCE_PER_BLOCK === "" || DEV_ADDR === "") {
        throw new Error('params of farm constructor are not all set');
    }

    await deployer.deploy(Farm, SpruceAddress, DEV_ADDR, Web3.utils.toWei(SPRUCE_PER_BLOCK));
    const farmInstance = await Farm.deployed();
    file.set("farm", farmInstance.address);
    console.log("Farm Address: " + farmInstance.address);

    // set farm to the minter of spruce token
    const spruceInstance = await Spruce.at(spruceAddress);
    await spruceInstance.addMinter(farmInstance.address);
    console.log(`first minter: ${await spruceInstance.getMinter(0)}`);
};