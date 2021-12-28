const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
require('dotenv').config({path: '../.env'})
const editJsonFile = require("edit-json-file");
file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const Contract = require('../build/contracts/StakingRewards.json');

const MNEMONIC = process.env.MNEMONIC.split(',');
const URL = process.env.TESTNET_URL;

//Easy way (Web3 + @truffle/hdwallet-provider)
deploy = async () => {
    const provider = new Provider(MNEMONIC, URL, 0, 2);
    const web3 = new Web3(provider);
    const networkId = await web3.eth.net.getId();

    var contractProxy = new web3.eth.Contract(Contract.abi)
    await web3.eth.getAccounts().then(async accounts => {
        var instance = await contractProxy.deploy({
                data: Contract.bytecode,
                arguments: [accounts[0], file.get("spruce"), file.get("spruce"), 24 * 3600]
            }
        ).send({
            from: accounts[0], gasPrice: 10000000000
        });

        console.log(instance.options.address);
    });
}

deploy()