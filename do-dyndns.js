#!/usr/bin/node

const API_KEY_ARG = 2;
const DOMAIN_ARG = 3;
const RECORDS_ARG = 4;

const fs = require('node:fs');

async function getIP() {
    const response = await fetch('https://api.ipify.org');
    if (!response.ok) {
        throw new Error("IP lookup failed");
    }
    return await response.text();
}

function hasIPChanged(ip) {
    let previousIP;
    try {
        previousIP = fs.readFileSync('ip.txt', 'utf8');
        console.log(`Previous IP: ${previousIP} Current IP: ${ip}`);
    } catch (error) {
        console.log('Did not find previous IP, assuming this is a first run.');
    }
    return previousIP !== ip;
}

function storeIP(ip) {
    fs.writeFileSync('ip.txt', ip);
}

async function createOrUpdateRecord(record, ip) {
    // TODO: record updates here
        // https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_list_records
    console.log(record, ip)
              // get record
            // does record exist?
                // create record
            
            // does record match
                //upate record
}

async function main() {
    try {
        const ip = await getIP();
        const shouldUpdate = hasIPChanged(ip);

        // if (!shouldUpdate) {
        //     process.exit();
        // }

        const records = process.argv[RECORDS_ARG].split(',');
        await Promise.all(records.map(async (record) => {
            await createOrUpdateRecord(record, ip);
        }));

        storeIP(ip);
    } catch (error) {
        console.error("Execution failed: ", error);
    }
}

console.log("Called with these parameters: ", process.argv);

// if (process.argv.length < 4) {
//     console.log("Not enough parameters.");
//     console.log("Usage:");
//     console.log("do-dyndns <api-key> <domain> <record>");
//     console.log("<record> may be a CSV list of A record FQDNs or single A record FQDN")
//     process.exit();
// }

main();
