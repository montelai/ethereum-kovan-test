Usage:

1. Set your kovan api to the environment variable INFURA_KOVAN_ENDPOINT
2. Set your private key to the environment variable DUMMY_KEY
3. Get kovan eth at the https://faucet.kovan.network/
4. Get kovan usdt at https://testnet.aave.com/faucet
5. Run ```npm install``` 
6. Run test using ```npx hardhat test```
7. Run deployment to kovan using ```npx hardhat --network kovan scripts/deployDepositAndWithdraw.ts```