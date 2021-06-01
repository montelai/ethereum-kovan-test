pragma solidity 0.6.12;

import "./interfaces/IAToken.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IPriceOracle.sol";
import "./utils/SafeMath.sol";
import "./Initializable.sol";
import "./ERC1967Proxy.sol";

/// DO NOT USE IN PRODUCTION!!
/// ASSUMPTION 1. Only depositing USDT. Can change to support all types of contracts using a mapping (address => bool)
/// ASSUMPTION 2. Only one user interacting with the contract, therefore not creating a new state mapping variable to store user balances. Use yearn's method to get shares. 
/// ASSUMPTION 3. This will only support one depositor at a time. vault can mint erc20 bearer tokens to track user's balances. again just use mappings to track user balances. 

contract Vault is Initializable {
    using SafeMath for uint256;

    // bad practice here, just hard coding for test
    // not for production 
    address public _usdt;
    address public _aaveUSDT;
    address public _aaveLendingPool;
    address public _aavePriceOracle;
    address public _depositor;

    event Initialized(address indexed _from);

    // For checking version of contract and testing fallback in test script. not the best implementation. 
    function checkVersion() virtual public pure returns (uint256 version) {
        return 99; 
    }

    // should protect this with a modifier to prevent this from being called by anyone.
    // this can only be called once because of the modifier. updating this proxy contract will not allow V2 to be able to call initializable again because the data is in the proxy contract. 
    function initializable() initializer external {
        _usdt = 0x13512979ADE267AB5100878E2e0f485B568328a4;
        _aaveUSDT = 0xFF3c8bc103682FA918c954E84F5056aB4DD5189d;
        _aaveLendingPool = 0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe;
        _aavePriceOracle = 0xB8bE51E6563BB312Cbb2aa26e352516c25c26ac1;
        _depositor = address(0);

        //do other constructor stuff here if needed..
        emit Initialized(msg.sender);
    }

    /// @dev Deposit ERC20 tokens on behalf of msg.sender to Aave Protocol
    /// @param _erc20Contract The address fo the underlying asset to deposit to Aave Protocol v2
    /// @param _amount The amount of the underlying asset to deposit
    /// @return success Whether the deposit operation was successful or not
    function deposit(address _erc20Contract, uint256 _amount) external returns (bool success){
        //supporting only 1 user and 1 deposit address
        require(_depositor == address(0), "NOT THE CURRENT DEPOSITOR");

        //would check against a mapping state variable here to check against valid erc20 tokens that are supported.
        //this mapping would be able to support updates and would be extended
        //mapping is out of scope. Only using usdt.


        //checking if the erc20 being deposited is the usdt
        require(_erc20Contract == _usdt, "NOT A SUPPORTED ERC20");
        IERC20 erc20 = IERC20(_erc20Contract);
        erc20.transferFrom(msg.sender, address(this), _amount);
        erc20.approve(_aaveLendingPool, _amount);
        ILendingPool(_aaveLendingPool).deposit(_usdt, _amount, address(this), 0);
        assert(IAToken(_aaveUSDT).balanceOf(address(this)) == _amount);
        
        //no need to keep local state of user since there is only one.
        //would need to update a mapping here if there are more than one user in production. 
        _depositor = msg.sender;

        //return true
        return true;
    }

    /// @dev Withdraw ERC20 tokens on behalf of msg.sender from Aave Protocol
    /// @param _erc20Contract The address of the underlyng asset being withdrawn
    /// @param _amount The amount to be withdrawn
    /// @return amountWithdrawn The actual amount withdrawn from Aave
    function withdraw(address _erc20Contract, uint256 _amount) external returns (uint256){
        require(msg.sender == _depositor, "NOT THE CURRENT DEPOSITOR");
        //only implementing for usdt, therefore _erc20Contract is not used in this function. 
        

        //use withdraw function
        //needs to be uint256 max for full balance with interest
        //DO NOT USE IN PRODUCTION - REENTERANCY HERE
        IAToken(_aaveUSDT).approve(_aaveLendingPool, _amount);
        uint256 amountWithdrawnFromAave = ILendingPool(_aaveLendingPool).withdraw(_usdt, _amount, msg.sender);

        //check if there ausdt balance, if not allow the _depositor to be changed
        if (IAToken(_aaveUSDT).balanceOf(address(this)) == 0){
            _depositor = address(0);
        }

        return amountWithdrawnFromAave;
    }

    /// @dev Read only function 
    /// @return amountInEth Returns the value locked as collateral posted by msg.sender
    function checkCollateralValueInEth() public view returns (uint256 amountInEth){
        require(msg.sender == _depositor, "NOT THE CURRENT DEPOSITOR");

        // just use aave's price oracle
        // this returns the price in eth wei
        // need to divide again by 1e18 to get the amount in eth.
        
        uint256 ausdtBalance = IAToken(_aaveUSDT).balanceOf(address(this)).div(1e6);

        //basis risk here because we are multiplying aust instead of usdt.
        return IPriceOracle(_aavePriceOracle).getAssetPrice(_usdt).mul(ausdtBalance);
    }
}