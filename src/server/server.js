import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const ORACLES_COUNT = 20;
const GAS_MAX_AMOUNT = 9999999;

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress, { gas: GAS_MAX_AMOUNT });

const getOracleAccounts = async () => {
  try {
    const all = await web3.eth.getAccounts();
    console.log("available Accounts", all);

    const selected = all.reverse().slice(0, ORACLES_COUNT);
    console.log("selected Accounts", selected);

    return selected;
  } catch(e) {
    console.log("error fetchin accounts", e.message);
  }
}

const getRegistrationFee = async () => {
  let fee = web3.utils.toWei("1", "ether");
  try {
    fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
  } catch(e) {
    console.log("error fetching fee", e.message);
  }
  console.log("current registration fee is", fee);
  return fee;
}

const registerOracles = async () => {
  const fee = await getRegistrationFee();
  const selectedAccounts = await getOracleAccounts();

  selectedAccounts.forEach(async (account) => {
    console.log("registering oracle for account", account);
    // register oracle
    try {
      await flightSuretyApp.methods.registerOracle().send({ from: account, value: fee });
      console.log("oracle registered ", account);
    } catch(e) {
      console.log("registration error", e.message);
    }

    // get indexes
    let indexes = [];
    try {
      indexes = await flightSuretyApp.methods.getMyIndexes().call({ from: account });
      console.log("oracle assigned indexes ", indexes);
    } catch(e) {
      console.log("indexes fetch error", e.message);
    }

    // listen event
    flightSuretyApp.events.OracleRequest({
      fromBlock: 0
    }, async (error, event)  => {
      if(error) {
        console.log(error.message);
        return;
      }
      const { index, airline, flight, timestamp } = event.returnValues;
      console.log("incomming event with index", index);

      if(indexes.indexOf(index) !== -1) {
        console.log("accepted event for account", account);
        // status code based in event index so all oracles are in sync
        const statusCode = Math.floor(index % 6) * 10;
        try {
          console.log("oracle response", statusCode, " for flight", flight);
          await flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode).send({ from: account });
        } catch(e) {
          console.log("oracle response error", e.message)
        }
      }
    });

    return selectedAccounts;
  });
}

registerOracles();

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


