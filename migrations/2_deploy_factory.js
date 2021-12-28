const editJsonFile = require("edit-json-file");
const stripHexPrefix = require('strip-hex-prefix');
const fs = require('fs');
const regReplace = require("../utils/replace")

var REGEX = /hex'(.{64,})/g;

// contracts
const Factory = artifacts.require("UniswapV2Factory");

// deploy swap factory
module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(Factory, accounts[0]);
    const factoryInstance = await Factory.deployed();
    const hash = await factoryInstance.pairCodeHash();

    file = editJsonFile(`${__dirname}/../config.json`, {
        autosave: true
    });

    file.set("factory", factoryInstance.address);
    console.log("Factory Address: " + factoryInstance.address);

    file.set("pairCodeHash", stripHexPrefix(hash));
    var replacedContent = "hex'" + stripHexPrefix(hash) + "'"
    regReplace(`${__dirname}/../contracts/swap/router/libraries/UniswapV2Library.sol`, REGEX, replacedContent);
    console.log("PairCodeHash: " + hash);
};
