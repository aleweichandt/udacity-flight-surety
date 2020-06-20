pragma solidity >=0.4.24 <0.7.0;

import "./Ownable.sol";

contract Callable is Ownable {

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    mapping(address => bool) private authorizedContracts;

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier requireIsCallerAuthorized()
    {
        require(isAuthorised(), "Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isAuthorised() internal view returns (bool)
    {
        return isContractOwner() || authorizedContracts[msg.sender];
    }

    function authorizeCaller(address contractAddress) external requireContractOwner
    {
        authorizedContracts[contractAddress] = true;
    }

    function deauthorizeCaller(address contractAddress) external requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }
}