const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
// require('dotenv').config();
require('dotenv').config({path: '../.env'})
const editJsonFile = require("edit-json-file");
file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const Contract = require('../build/contracts/FarmPool.json');

const MNEMONIC = process.env.MNEMONIC.split(',');
const URL = process.env.TESTNET_URL;

//Easy way (Web3 + @truffle/hdwallet-provider)
add = async (allocPoint, lpAddr) => {
    const provider = new Provider(MNEMONIC, URL, 0, 2);
    const web3 = new Web3(provider);
    const networkId = await web3.eth.net.getId();
    const instance = new web3.eth.Contract(
        Contract.abi,
        Contract.networks[networkId].address
    );

    await web3.eth.getAccounts().then(async accounts => {
        console.log(`Before add, farm pool length: ${await instance.methods.poolLength().call()}`);

        const receipt = await instance.methods.add(allocPoint, lpAddr, true).send({
            from: web3.eth.getAccounts()[0],
            gasPrice: web3.utils.toWei("1", "gwei")
        });
        console.log(`Transaction hash: ${receipt.transactionHash}`);

        var length = await instance.methods.poolLength().call()
        console.log(`After add, farm pool length: ${length}`);
        await instance.methods.poolInfo(length - 1).call().then(result => {
            console.log(`poolInfo {
    lpToken:           ${result[0]},
    allocPoint:        ${result[1]},
    lastRewardBlock:   ${result[2]},
    accSprucePerShare: ${result[3]}
}`);
        });
    });
}

add(500, "0x407FFE632e31A50DF848710d3Bae14F3ED139Fb4");