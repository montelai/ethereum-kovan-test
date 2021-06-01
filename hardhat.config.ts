import "@nomiclabs/hardhat-waffle";
import '@openzeppelin/hardhat-upgrades';
import dotenv from "dotenv";
dotenv.config();
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.6.12",
  networks: {
    kovan: {
      url: `${process.env.INFURA_KOVAN_ENDPOINT}`,
      accounts: [`${process.env.DUMMYKEY}`]
    }
  }
};
