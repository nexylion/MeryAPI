const express = require('express');
const fs = require('fs');
const morgan = require("morgan");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { XMLParser, XMLValidator, XMLBuilder } = require('fast-xml-parser');
const path = require('node:path');
const csvToJson = require('csvtojson');
const { convert } = require('html-to-text');
const { throws } = require('assert');

// Create Express Server
const app = express();
const timeout = 10 * 60 * 1000; // timeout 10mins

// Configuration
const PORT = 8080;
const HOST = "localhost";
const API_SERVICE_URL = "https://jsonplaceholder.typicode.com";



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

function createItemfromProduct(product, categories) {
    let product_category;
    categories.forEach(category => {
        if (product["categories"] === category["shoprenter"]) {
            product_category = category["mall"];
        }
    });
    let shortdesc;
    let salePrice = Math.round(product["price_special"] * 0.127) * 10;
    let rPrice = Math.round(product["price"] * 0.127) * 10;
    let media = [];
    media.push({
        URL: product["image_url"],
        MAIN: true,

    });
    media.push({
        URL: product["image_url_2"],
        MAIN: false,
        ENERGY_LABEL: false,
        INFORMATION_LIST: true
    });
    media.push({
        URL: product["image_url_3"],
        MAIN: false,
        ENERGY_LABEL: false,
        INFORMATION_LIST: true
    });

    shortdesc = convert(product["description"]).substring(0, 150) + "...";
    let Item = {
        "ID": product["product_id"],
        "STAGE": "TESTING",
        "CATEGORY_ID": product_category,
        "BRAND_ID": product["manufacturer"],
        "TITLE": product["name"],
        "SHORTDESC": shortdesc,
        "LONGDESC": product["description"],
        "PRIORITIES": 1,
        "PACKAGE_SIZE": "Smallbox", //todo
        "BARCODE": product["ean"],
        "PRICE": salePrice,
        "VAT": 27,
        "RRP": rPrice,
        "PARAM": undefined, //todo
        "MEDIA": media,
        "DELIVERY_DELAY": 4

    };

    return Item;
}

function getFromFile() {
    return new Promise((resolve, reject) => {

        fs.readFile((path.resolve('response.xml')), 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            if (true) {
                const parser = new XMLParser();
                let jsonObj = parser.parse(data);
                let Items = [];
                // console.log(jsonObj);
                resolve(jsonObj);
            }

        });

    });
}
//formatting shoprenter xml file 
async function formatXml() {

    let Item = [];
    let categories = await csvToJson().fromFile(path.resolve("kategoriak.csv"));
    let jsonObj = await getFromFile();
    jsonObj["products"]["product"].forEach(element => {
        Item.push(createItemfromProduct(element, categories));
    });
    let Items = {
        "Items": {
            "Item": Item
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
        res.send(await xml);
    })();
});
// Updating response.xml with data from Shoprenter
const api_url = "https://www.marapiac.hu/api/?route=export/feed&id=emag";
app.get('/Update', (req, res, next) => {
    console.log("update started!");
    var xhr = new XMLHttpRequest();

    xhr.open("GET", api_url);
    xhr.setRequestHeader("Authorization", encode("marashop", "Mara1234"));
    xhr.onprogress = event => {
        // event.loaded returns how many bytes are downloaded
        // event.total returns the total number of bytes
        // event.total is only available if server sends `Content-Length` header
        console.log(`Downloaded ${event.loaded} of ${event.total} bytes`)
    }
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            fs.writeFile(path.resolve('response.xml'), xhr.responseText, (err) => {
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