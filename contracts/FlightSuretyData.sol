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

    uint256 private contractFunds = 0;

    uint256 private airlinesCount = 0;
    mapping(address => bool) private airlines;
    mapping(address => uint256) private airlineFunds;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        address[] insurees;
    }
    mapping(bytes32 => Flight) private flights;

    struct Client {
        mapping(bytes32 => uint256) insurance;
        uint256 funds;
    }
    mapping(address => Client) private clients;

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier requireAirline(address airline)
    {
        require(isAirline(airline), "Not an airline");
        _;
    }

    modifier requireFlight(bytes32 flight)
    {
        require(flights[flight].isRegistered, "Flight does not exist");
        _;
    }

    modifier hasEnough(address client, uint256 amount)
    {
        require(clients[client].funds >= amount, "Insufficient client funds");
        _;
    }

    modifier isAffordable(uint256 amount)
    {
        require(contractFunds >= amount, "Insufficient contract funds");
        _;
    }

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

    /********************************************************************************************/
    /*                                     AIRLINES                                             */
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

    function getAirlinesCount() external view returns (uint256)
    {
        return airlinesCount;
    }

    /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function getAirlineFunds(address airline) external view requireAirline(airline) returns(uint256)
    {
        return airlineFunds[airline];
    }

    function fundAirline(address airline) external payable requireIsOperational requireIsCallerAuthorized requireAirline(airline)
    {
        airlineFunds[airline] = airlineFunds[airline].add(msg.value);
        contractFunds = contractFunds.add(msg.value);
    }

    /********************************************************************************************/
    /*                                     FLIGHTS                                             */
    /********************************************************************************************/

   /**
    * @dev Add a flight to the registry
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerFlight(
        address airline, bytes32 flight, uint8 statusCode
    ) external requireIsOperational requireIsCallerAuthorized requireAirline(airline)
    {
        require(!flights[flight].isRegistered, "Flight alredy exist");

        flights[flight] = Flight({
            isRegistered: true,
            statusCode: statusCode,
            updatedTimestamp: now,
            airline: airline,
            insurees: new address[](0)
        });
    }

    function isFlight(bytes32 flight) external view returns (bool)
    {
        return flights[flight].isRegistered;
    }

    function getFlightStatus(bytes32 flight) external view requireFlight(flight) returns(uint8)
    {
        return flights[flight].statusCode;
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees() external pure
    {
    }

    /********************************************************************************************/
    /*                                     PASSENGERS                                           */
    /********************************************************************************************/

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy(
        address client, bytes32 flight
    ) external payable requireIsOperational requireIsCallerAuthorized requireFlight(flight)
    {
        clients[client].insurance[flight] = clients[client].insurance[flight].add(msg.value);
        flights[flight].insurees.push(client);
        flights[flight].updatedTimestamp = now;
        contractFunds = contractFunds.add(msg.value);
    }

    function getInsurance(address client, bytes32 flight) external view requireFlight(flight) returns (uint256)
    {
        return clients[client].insurance[flight];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(
        address client, uint256 amount
    ) external requireIsOperational requireIsCallerAuthorized hasEnough(client, amount) isAffordable(amount)
    {
        clients[client].funds = clients[client].funds.sub(amount);
        contractFunds = contractFunds.sub(amount);
        client.transfer(amount);
    }

    function getFunds(address client) external view returns (uint256)
    {
        return clients[client].funds;
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() public payable
    {
        contractFunds = contractFunds.add(msg.value);
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

