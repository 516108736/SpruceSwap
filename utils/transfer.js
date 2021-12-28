const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
// require('dotenv').config();
require('dotenv').config({path: '../.env'})
const editJsonFile = require("edit-json-file");
file = editJsonFile(`${__dirname}/../config.json`, {
    autosave: true
});

const MNEMONIC = "89c81c304704e9890025a5a91898802294658d6e4034a11c6116f4b129ea12d3";
const URL = "http://127.0.0.1:8545";


//Easy way (Web3 + @truffle/hdwallet-provider)
send = async () => {
    const provider = new Provider(MNEMONIC, URL, 0, 2);
    const web3 = new Web3(provider);
    const networkId = await web3.eth.net.getId();

    web3.eth.getAccounts().then(async accounts => {
        console.log(`Before add, farm pool length`);

        web3.eth.sendTransaction({
            from: accounts[0],
            chainId: networkId,
            nonce: 2,
            value: web3.utils.toWei("1", "ether"),
            to: "0x4138e55B5334862b6B660F9402a27bB9e3c7Bcd7",
            gasPrice: web3.utils.toWei("1", "gwei"),
            gas: 21000,
        });
        console.log(`Transaction hash`);
    });
}
/*
   -- Define Provider & Variables --
*/
// Provider
const providerRPC = {
    development: 'http://localhost:8545',
};
const web3 = new Web3(providerRPC.development); //Change to correct network

const account_from = {
    privateKey: '89c81c304704e9890025a5a91898802294658d6e4034a11c6116f4b129ea12d3',
    address: '0x04A987fa1Bd4b2B908e9A3Ca058cc8BD43035991',
};
const addressTo = '0x4138e55B5334862b6B660F9402a27bB9e3c7Bcd7'; // Change addressTo

/*
   -- Create and Deploy Transaction --
*/
const deploy = async () => {
    console.log(
        `Attempting to send transaction from ${account_from.address} to ${addressTo}`
    );

    // Sign Tx with PK
    const createTransaction = await web3.eth.accounts.signTransaction(
        {
            gas: 21000,
            to: addressTo,
            nonce: 2,
            chainId: 8,
            gasPrice: web3.utils.toWei("1", "gwei"),
            value: web3.utils.toWei('1', 'ether'),
        },
        account_from.privateKey
    );

    // Send Tx and Wait for Receipt
    await web3.eth.sendSignedTransaction(
        createTransaction.rawTransaction
    );
};

deploy();

