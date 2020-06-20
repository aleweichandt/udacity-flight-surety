pragma solidity >=0.4.24 <0.7.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./utils/Ownable.sol";
import "./utils/Operational.sol";
import "./utils/Callable.sol";
import "./interface/IFlightSuretyData.sol";

contract FlightSuretyData is Ownable, Operational, Callable, IFlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint256 private airlinesCount = 0;
    mapping(address => bool) private airlines;
    mapping(address => uint256) private airlineFunds;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address firstAirline) Ownable() public
    {
        airlines[firstAirline] = true;
        airlinesCount = 1;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(
        address airline
    ) external requireIsOperational requireIsCallerAuthorized
    {
        airlines[airline] = true;
        airlineFunds[airline] = 0;
        airlinesCount = airlinesCount.add(1);
    }

    function isAirline(address airline) public view returns(bool)
    {
        return airlines[airline];
    }

    function isFundedAirline(address airline) public view returns(bool)
    {
        return airlineFunds[airline] > 10;
    }

    function getAirlinesCount() external view returns (uint256)
    {
        return airlinesCount;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy() external payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() public payable
    {
    }

    function getFlightKey(
        address airline, string memory flight, uint256 timestamp
    ) internal pure returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable
    {
        fund();
    }


}

