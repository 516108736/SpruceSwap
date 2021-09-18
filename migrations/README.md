# Deployment 
## 1. Setup config in 2_deploy_factory.js
```config
const feeToSetter = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98"; // set fee setter of factory
```
## 2. Deploy swap factory contract.
```command
truffle migrate --network testnet -f 1 --to 2
```
## 3. Modify UniswapV2Pair code hash in UniswapV2Library.sol from step 2 output.

## 4. Setup config in 3_deploy_all.js
```config
const factoryAddress = ""; // config swap factory contract address
const woktAddress = "0x70c1c53E991F31981d592C2d865383AC0d212225";
const okbAddress = "0xDa9d14072Ef2262c64240Da3A93fea2279253611";
const spruceMakerTreasuryA = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98";
const spruceMakerTreasuryB = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98";
const spruceTokenDeployer = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98";
const spruceTreasuryA = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98";
const spruceTreasuryB = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98";
const miningRewardsDistribution = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98";
const farmOwner = "0x980D604b55F6089BfB6A83E1C8B2B1E79c4a7F98";
const farmSprucePerBlock = 40;
const farmStartBlock = 200;
```

## 5. Deploy all other contracts.
```command
truffle migrate --network testnet -f 3 --to 3
```