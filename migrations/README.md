# Deployment 
## 1. Setup config in 2_deploy_factory.js
```config
const feeToSetter = ""; // set fee setter of factory
```
## 2. Deploy swap factory contract.
```command
truffle migrate --network testnet -f 1 --to 2
```
## 3. Modify UniswapV2Pair code hash in UniswapV2Library.sol from step 2 output.

## 4. Deploy all other contracts.
```command
truffle migrate --network testnet -f 3 --to 3
```
