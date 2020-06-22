import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

const GAS_MAX_AMOUNT = 9999999;

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress, { gast: GAS_MAX_AMOUNT });
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;

            let date = new Date();
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            while(this.flights.length < 5) {
                date.setDate(date.getDate() + 1);
                this.flights.push({
                    airline: this.airlines[this.flights.length],
                    name: "flight" +  this.flights.length.toString(),
                    timestamp: Math.floor(date.getTime() / 1000),
                })
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fetchFlightStatus(flight.airline, flight.name, flight.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, flight);
            });
    }

    registerAirline(airline, newAirline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(newAirline)
            .send({ from: airline }, (error, response) => {
                callback(error, response);
            });
    }

    fundAirline(airline, amount, callback) {
        let self = this;
        const ether = this.web3.utils.toWei(amount, "ether");
        self.flightSuretyApp.methods
            .fund()
            .send({ from: airline, value: ether }, (error, response) => {
                callback(error, amount);
            });
    }

    registerFlight(flight, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerFlight(flight.name, flight.timestamp)
            .send({ from: flight.airline }, (error, response) => {
                callback(error, response);
            });
    }

    getFlightStatus(flight, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .fetchFlightStatus(flight.airline, flight.name, flight.timestamp)
            .call({ from: self.owner }, (error, response) => {
                callback(error, response);
            });
    }

    buyInsurance(passenger, flight, amount, callback) {
        let self = this;
        const ether = this.web3.utils.toWei(amount, "ether");
        self.flightSuretyApp.methods
            .buyInsurance(flight.airline, flight.name, flight.timestamp)
            .send({ from: passenger, value: ether }, (error, response) => {
                callback(error, amount);
            });
    }

    getFlightInsurance(passenger, flight, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .getInsurance(flight.airline, flight.name, flight.timestamp)
            .call({ from: passenger }, (error, response) => {
                callback(error, response);
            });
    }

    withdrawFunds(passenger, amount, callback) {
        let self = this;
        const ether = this.web3.utils.toWei(amount, "ether");
        self.flightSuretyApp.methods
            .withdrawFunds(ether)
            .send({ from: passenger }, (error, response) => {
                callback(error, response);
            });
    }
}