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
    uint8 private constant MIN_AIRLINES_REGISTERED = 5;

    struct Airline {
        mapping(address => bool) votes; // who voted
        uint256 votesCount; // votes
        bool isRegistered; // registered after votes count
        uint256 funds; // has been funded
    }

    mapping(address => Airline) airlines;
    uint256 airlinesCount = 0;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() Ownable() public
    {
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier registeredAirline()
    {
        require(isAirline(msg.sender), "Forbidden Access");
        _;
    }

    modifier fundedAirline()
    {
        require(isFundedAirline(msg.sender), "Forbidden Access, please register and fund");
        _;
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
    ) external requireIsOperational returns(bool success, uint256 votes)
    {
        require(airlinesCount == 0 || isFundedAirline(msg.sender), "Forbidden Access, please register and fund");
        require(!isAirline(airline), "airline already registered");
        require(!airlines[airline].votes[msg.sender], "Already voted");

        airlines[airline].votes[msg.sender] = true;
        airlines[airline].votesCount = airlines[airline].votesCount.add(1);
        airlines[airline].isRegistered = airlinesCount <= MIN_AIRLINES_REGISTERED || airlinesCount.div(2) < airlines[airline].votesCount;
        if(airlines[airline].isRegistered) {
            airlinesCount = airlinesCount.add(1);
        }

        success = airlines[airline].isRegistered;
        votes = airlines[airline].votesCount;
        return (success, 0);
    }

    function isAirline(address airline) public view returns(bool)
    {
        return airlines[airline].isRegistered;
    }

    function isFundedAirline(address airline) public view returns(bool)
    {
        return airlines[airline].funds > 10;
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

