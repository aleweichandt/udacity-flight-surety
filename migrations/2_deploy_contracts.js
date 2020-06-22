const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async function (deployer, network, accounts) {
    const owner = accounts[0];
    const firstAirline = accounts[1];

    await deployer.deploy(FlightSuretyData, firstAirline);
    await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);

    // authorize FlightSuretyApp contract
    const instance = await FlightSuretyData.deployed();
    await instance.authorizeCaller(FlightSuretyApp.address, { from: owner });
    let config = {
        localhost: {
            url: 'http://localhost:7545',
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address,
            owner: owner,
            firstAirline: firstAirline,
        }
    }
    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
};