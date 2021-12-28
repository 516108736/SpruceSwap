const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
require('dotenv').config({path: '../.env'})
const editJsonFile = require("edit-json-file");
file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const Contract = require('../build/contracts/FarmPool.json');

const MNEMONIC = process.env.MNEMONIC.split(',');
const URL = process.env.TESTNET_URL;

//Easy way (Web3 + @truffle/hdwallet-provider)
start = async (blockHeight) => {
    const provider = new Provider(MNEMONIC, URL, 0, 2);
    const web3 = new Web3(provider);
    const networkId = await web3.eth.net.getId();
    const instance = new web3.eth.Contract(
        Contract.abi,
        Contract.networks[networkId].address
    );

    await web3.eth.getAccounts().then(async accounts => {
        const receipt = await instance.methods.setStartBlock(blockHeight).send({
            from: accounts[0],
            gasPrice: web3.utils.toWei("1", "gwei")
        });
        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log(`start block height is : ${await instance.methods.startBlock().call()}`);
    });
}

start(5941750)