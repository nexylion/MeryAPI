const express = require('express');
const fs = require('fs');
const morgan = require("morgan");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { XMLParser, XMLValidator, XMLBuilder } = require('fast-xml-parser');
const path = require('path');
const csvToJson = require('csvtojson');
const { convert } = require('html-to-text');
const { throws } = require('assert');
const { Console } = require('console');

// Create Express Server
const app = express();
const timeout = 10 * 60 * 1000; // timeout 10mins

// Configuration
const PORT = 80;
const HOST = "0.0.0.0";
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
//simple string formatting
function stringEqualizer(manufacturer) {
    return manufacturer.toUpperCase().replace(/\s/g, '');;

}

function createItemfromProduct(product, categories, brands) {
    let product_category = "";

    categories.forEach(category => {

        if (product["category"] != null && category["shoprenter"] != null) {


            if (product["category"].toString().replace(/\s+/g, '') === category["shoprenter"].toString().replace(/\s+/g, '')) {
                product_category = category["mall"];
            }
        }

    });
    let product_brand = "MERYSTYLE";
    for (let i = 0; i < brands.length; i++) {
        if (stringEqualizer(product["manufacturer"].toString()) == "MERYSTYLE") { break }
        if (stringEqualizer(product["manufacturer"].toString()) == "HOLMI") { break }
        if (stringEqualizer(product["manufacturer"].toString()) == "MARASHOP") { break }
        const brand = brands[i];
        if (product["manufacturer"] != null && brand["title"] != null) {
            if (stringEqualizer(product["manufacturer"].toString()) == stringEqualizer(brand["title"].toString())) {
                product_brand = brand["brand_id"];
                break;
            }
        }
    }

    let shortdesc = "";
    let salePrice = Math.round(product["price_special"] * 0.127) * 10;
    let rPrice = Math.round(product["price"] * 0.127) * 10;
    let media = [];

    function imageUrlEdit(url) {
        reg = new RegExp('cache\/.+?\/');
        reg2 = new RegExp(/\?v=.*./);
        reg3 = new RegExp(/\/\/.+?\.hu/);

        return url.replace(reg, "data/").replace(reg2, "").replace(reg3, "//www.marapiac.hu");
    }

    if (product["image_url"]) {


        media.push({
            URL: imageUrlEdit(product["image_url"]),
            MAIN: true,

        });
    }
    if (product["image_url_2"] && (product["image_url_2"] != product["image_url"])) {
        media.push({
            URL: imageUrlEdit(product["image_url_2"]),
            MAIN: false,
            ENERGY_LABEL: false,
            INFORMATION_LIST: false
        });
    }
    if (product["image_url_3"] && (product["image_url_3"] != product["image_url"] && (product["image_url_2"] != product["image_url_3"]))) {
        media.push({
            URL: imageUrlEdit(product["image_url_3"]),
            MAIN: false,
            ENERGY_LABEL: false,
            INFORMATION_LIST: false
        });
    }
    shortdesc = convert(product["description"]).substring(0, 150) + "...";
    let Item = {
        "ID": "Mery" + product["product_id"],
        "STAGE": "TESTING",
        "CATEGORY_ID": product_category,
        "BRAND_ID": product_brand, //PRODUCT_BRAND default is MERYSTYLE
        "TITLE": product["name"],
        "SHORTDESC": shortdesc,
        "LONGDESC": product["description"],
        "PRIORITY": 1,
        "PACKAGE_SIZE": "smallbox",
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

function createAvalibilityfromProduct(product) {
    let active = false;
    if (product["stock"] != 0) {
        active = true
    }
    let AVAILABILITY = {
        ID: "Mery" + product["product_id"],
        IN_STOCK: product["stock"],
        ACTIVE: active
    }

}
//returns a jsonobject from an xml file
function getFromFile(filepath) {
    return new Promise((resolve, reject) => {

        fs.readFile((path.resolve(filepath)), 'utf8', (err, data) => {
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
    let BrandsXml = JSON.parse(fs.readFileSync("brands.xml"));
    let categories = await csvToJson().fromFile("kategoriak.csv");
    let jsonObj = await getFromFile('response.xml');
    jsonObj["products"]["product"].forEach(element => {
        Item.push(createItemfromProduct(element, categories, BrandsXml["data"]));
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
// Updating response.xml with data from Shoprenter

app.get('/Update', (req, res, next) => {
    const api_url = "https://www.marapiac.hu/api/?route=export/feed&id=emag";
    console.log("update started!");
    var xhr = new XMLHttpRequest();

    xhr.open("GET", api_url);
    xhr.setRequestHeader("Authorization", "bWFyYXNob3A6TWFyYTEyMzQ=");
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
            fs.writeFile(path.resolve('brands.xml'), xhr.responseText, (err) => {
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