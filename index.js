// TODO: ár változtatás

import express from 'express';
import { readFile, readFileSync, writeFile } from 'fs';
import morgan from "morgan";
import { XMLHttpRequest } from "xmlhttprequest";
import { XMLParser, XMLValidator, XMLBuilder } from 'fast-xml-parser';
import { resolve as _resolve, resolve } from 'path';
import csvToJson from 'csvtojson';
import { throws } from 'assert';
import { createItemfromProduct } from "./createItemfromProduct.js";
import { stringEqualizer } from './stringEqualizer.js';
import { createAvalibilityfromProduct } from './createAvalibilityfromProduct.js';

// Create Express Server
const app = express();
const timeout = 10 * 60 * 1000; // timeout 10mins

// Configuration
const PORT = 80;
const HOST = "0.0.0.0";

// encode to base64
function encode(username, password) {
    // return base64 encoded login data
    data = username + ":" + password;
    buff = new Buffer(data);
    return buff.toString('base64');

}
// return an array from csv string
function csvToArr(stringVal, splitter) {
    const [keys, ...rest] = stringVal
        .trim()
        .split("\n")
        .map((item) => item.split(splitter));

    const formedArr = rest.map((item) => {
        const object = {};
        keys.forEach((key, index) => (object[key] = item.at(index)));
        return object;
    });
    return formedArr;
}



function getFromFile(filepath, jsonFile = false) {
    return new Promise((resolve, reject) => {

        readFile((_resolve(filepath)), 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            if (true) {
                const parser = new XMLParser();
                let jsonObj = parser.parse(data);
                // console.log(jsonObj);
                resolve(jsonObj);
            }

        });

    });
}
//formatting shoprenter xml file 
async function formatXml() {

    let Item = [];
    let BrandsXml = JSON.parse(readFileSync("brands.xml"));
    let categories = await csvToJson().fromFile("kategoriak.csv");
    let jsonObj = await getFromFile(resolve('response.xml'));
    let variablesFile = readFileSync("response.json");
    let variableJSON = JSON.parse(variablesFile);

    jsonObj["products"]["product"].forEach(element => {
        let found = false;
        for (let i = 0; i < variableJSON.length; i++) {
            let variable = variableJSON[i];

            if (element["sku"] == variable["sku"]) {
                found = true;
                break;
            }
        }
        if (!found) {
            let itemDummy = (createItemfromProduct(element, categories, BrandsXml["data"]));
            if (itemDummy.CATEGORY_ID !== undefined && itemDummy.CATEGORY_ID !== '-') {
                Item.push(itemDummy);
            }
        }

    });
    let Items = {
        "ITEMS": {
            "ITEM": Item
        }
    };
    const options = {
        processEntities: true,
        format: true,
        ignoreAttributes: false
    };
    var builder = new XMLBuilder(await options);
    var xml = await builder.build(Items);
    return await xml;
}
async function formatXmlAvailability() {

    let Availability = [];
    let jsonObj = await getFromFile('response.xml');
    jsonObj["products"]["product"].forEach(element => {
        Availability.push(createAvalibilityfromProduct(element));
    });
    let Availabilities = {
        "AVAILABILITIES": {
            "AVAILABILITY": Availability
        }
    };
    const options = {
        processEntities: true,
        format: true,
        ignoreAttributes: false
    };
    var builder = new XMLBuilder(await options);
    var xml = await builder.build(Availabilities);
    return await xml;
}


// Logging
app.use(morgan('dev'));
// sending xml formated data from from file
app.get('/xmlOutput', (req, res, next) => {

    const now = Date.now();
    console.log("started at", now);
    res.header('Content-Type', "application/xml");
    res.header('Keep-alive', "timeout=" + timeout);
    (async() => {
        console.log("async code running");
        let xml = await formatXml();
        console.log("took ", Date.now() - now, "ms");
        xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>' + await xml;
        res.send(xml);
    })();
});
//avalability feed for mall 
app.get('/avalability', (req, res, next) => {

    const now = Date.now();
    console.log("started at", now);
    res.header('Content-Type', "application/xml");
    res.header('Keep-alive', "timeout=" + timeout);
    (async() => {
        console.log("async code running");
        let xml = await formatXmlAvailability();
        console.log("took ", Date.now() - now, "ms");
        xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>' + await xml;
        res.send(xml);
    })();
});
app.get('/Update', (req, res, next) => {
    const api_url = "https://www.medyshop.hu/api/?route=export/feed&id=emag";
    console.log("update started!");
    var xhr = new XMLHttpRequest();

    xhr.open("GET", api_url);
    xhr.setRequestHeader("Authorization", "bWVkeXNob3AxOm1lZHlzaG9wMQ==");
    xhr.onprogress = event => {
        // event.loaded returns how many bytes are downloaded
        // event.total returns the total number of bytes
        // event.total is only available if server sends `Content-Length` header
        console.log(`Downloaded ${event.loaded} of ${event.total} bytes`)
    }
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            writeFile(_resolve('response.xml'), xhr.responseText, (err) => {
                // throws an error, you could also catch it here
                if (err) throws(err);

                // success case, the file was saved
                res.send(200)
                console.log('Response updated!');
            });
        }
    }
    xhr.send();
}); // Authorization

app.get('/getBrands', (req, res, next) => {
    console.log("getBrands started!");
    const api_url = "https://mpapi.mallgroup.com/v1/brands?client_id=78776eee50d86e8e05b00dca2ab29e0d8689c74fbd7a0769b50a8617e1e141a6";
    var xhr = new XMLHttpRequest();

    xhr.open("GET", api_url);
    xhr.onprogress = event => {
        // event.loaded returns how many bytes are downloaded
        // event.total returns the total number of bytes
        // event.total is only available if server sends `Content-Length` header
        console.log(`Downloaded ${event.loaded} of ${event.total} bytes`)
    }
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            writeFile(_resolve('brands.xml'), xhr.responseText, (err) => {
                // throws an error, you could also catch it here
                if (err) throws(err);

                // success case, the file was saved
                res.send(200)
                console.log('Response updated!');
            });
        }
    }
    xhr.send();
}); // Authorization

app.use('', (req, res, next) => {
    if (req.headers.authorization) {
        next();
    } else {
        res.sendStatus(403);
    }
});

// Start the Proxy
app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);

});
app.keepAliveTimeout = timeout;
app.headersTimeout = timeout + 5000;