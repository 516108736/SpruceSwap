const editJsonFile = require("edit-json-file");
const Web3 = require('web3');
require('dotenv').config();

file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const factoryAddress = file.get("factory")
const spruceAddress = file.get("spruce")
const WETHAddress = process.env.WETH
const SPRUCE_MAKER_TREASURE_A = process.env.SPRUCE_MAKER_TREASURE_A
const SPRUCE_MAKER_TREASURE_B = process.env.SPRUCE_MAKER_TREASURE_B

// contracts
const Factory = artifacts.require("UniswapV2Factory");
const SPRUCEMaker = artifacts.require("SPRUCEMaker");
const BoringMath = artifacts.require("BoringMath");
const BoringERC20 = artifacts.require("BoringERC20");

module.exports = async function (deployer, network, accounts) {
    if (factoryAddress === "" || spruceAddress === "" || WETHAddress === ""
        || SPRUCE_MAKER_TREASURE_A === "" || SPRUCE_MAKER_TREASURE_B === "") {
        throw new Error('params of spruce maker constructor are not all set');
    }

    await deployer.deploy(BoringMath);
    await deployer.link(BoringMath, SPRUCEMaker);
    await deployer.deploy(BoringERC20);
    await deployer.link(BoringERC20, SPRUCEMaker);
    await deployer.deploy(SPRUCEMaker, factoryAddress, spruceAddress, WETHAddress, SPRUCE_MAKER_TREASURE_A, SPRUCE_MAKER_TREASURE_B);
    const spruceMakerInstance = await SPRUCEMaker.deployed();

    const factoryInstance = await Factory.at(factoryAddress);
    await factoryInstance.setFeeTo(spruceMakerInstance.address);

    file.set("spruceMaker", spruceMakerInstance.address);
    console.log("SpruceMaker Address: " + spruceMakerInstance.address);

    // TODO: update feeToSetter of Factory with FEE_TO_SETTER in .env
};