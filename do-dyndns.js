#!/usr/bin/node

// https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_list_records

const fs = require('node:fs');

const API_KEY_ARG = 2;
const DOMAIN_ARG = 3;
const RECORDS_ARG = 4;

const headers = new Headers({
    'Authorization': `Bearer ${process.argv[API_KEY_ARG]}`,
    'Content-Type': 'application/json',
})

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

async function getRecord(record) {
    const url = `https://api.digitalocean.com/v2/domains/${process.argv[DOMAIN_ARG]}/records?name=${record}&type=A`;
    const response = await fetch(url, {
        headers,
    });
    
    if (!response.ok) {
        throw new Error("Record lookup failed: ", record);
    }

    const json = await response.json();
    
    if (json.domain_records.length > 1) {
        throw new Error("Strange record count for: ", record);
    }

    return json.domain_records[0];
}

async function createOrUpdateRecord(record, ip) {    
    const existingRecord = await getRecord(record);
    if (existingRecord && existingRecord.data === ip) {
        console.log(`Record already set properly: ${record} ${ip}`);
        console.log(record);
        return;
    }

    const name = record.replace(`.${process.argv[DOMAIN_ARG]}`, '');

    if (!existingRecord) {
        console.log(`Creating record: ${record} ${ip}`);
        // create record
        const url = `https://api.digitalocean.com/v2/domains/${process.argv[DOMAIN_ARG]}/records`;
        const response = await fetch(url, {
            method: 'post',
            headers,
            body: JSON.stringify({
                type: 'A',
                data: ip,
                name,
            }),
        });
        console.log(response)
        const json = await response.json();
        console.log(json)
    } else {
        // TODO: record updates here

        // update record
        console.log(`Updating record: ${record} ${ip}`);
        const url = `https://api.digitalocean.com/v2/domains/${process.argv[DOMAIN_ARG]}/records/${existingRecord.id}`;

        const response = await fetch(url, {
            method: 'put',
            headers,
            body: JSON.stringify({
                type: 'A',
                data: ip,
                name,
            }),
        });
        console.log(response)
        const json = await response.json();
        console.log(json)
    }
            
}

async function main() {
    try {
        const ip = await getIP();
        const shouldUpdate = hasIPChanged(ip);

        if (!shouldUpdate) {
            process.exit();
        }

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

if (process.argv.length < 4) {
    console.log("Not enough parameters.");
    console.log("Usage:");
    console.log("do-dyndns <api-key> <domain> <record>");
    console.log("<record> may be a CSV list of A record FQDNs or single A record FQDN")
    process.exit();
}

main();
