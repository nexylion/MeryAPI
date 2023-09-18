// Updating response.xml with data from Shoprenter with api

import { writeFileSync, appendFileSync } from 'fs';
import { resolve } from 'path';
import got from 'got';
export async function getUpdate() {
    let ProductOptions = await getParamPage("productOptions", "json/productOptions.json");
    let Options = [];

    for (let index = 0; index < ProductOptions.length; index++) {
        if ((index % 10) == 1) {



        }

        let sku;
        let desc;
        let Variables = [];
        const element = ProductOptions[index];
        // lekérni a sku-t kulcsnak

        let response = await got({
            'url': element.product.href,
            'headers': {
                'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                'accept': 'application/json'
            }
        }).json();
        sku = response.sku


        // lekérni a productOptionDescriptiont 
        response = await got({
            'url': element.productOptionDescriptions.href,
            'headers': {
                'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                'accept': 'application/json'
            }
        }).json();
        response = await got({
            'url': response.items[0].href,
            'headers': {
                'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                'accept': 'application/json'
            }
        }).json();
        desc = response.name

        // lekérni a productOptionValuest 

        response = await got({
            'url': element.productOptionValues.href,
            'headers': {
                'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                'accept': 'application/json'
            }
        }).json();


        // for ciklus lefuttatni az összes itemre ami bennevan a valueban 
        for (let index = 0; index < response.items.length; index++) {
            const element = response.items[index];
            let response2 = await got({
                'url': element.href,
                'headers': {
                    'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                    'accept': 'application/json'
                }
            }).json();

            let price = response2.price;
            let prefix = response2.prefix;
            // még két lekérés a névért 

            let response3 = await got({
                'url': response2.productOptionValueDescriptions.href,
                'headers': {
                    'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                    'accept': 'application/json'
                }
            }).json();

            // még egy lekérés a névért 

            let response4 = await got({
                'url': response3.items[0].href,
                'headers': {
                    'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                    'accept': 'application/json'
                }
            }).json();

            let name = response4.name;
            let Variable = { "price": price, "prefix": prefix, "name": name }
            Variables.push(Variable);
        }
        let Option = { "sku": sku, "name": desc, "Variables": Variables }
        Options.push(Option);
        if ((index % 10 == 0 && index != 0)) {
            console.log(index + " is done");

        }
    }
    writeFileSync(resolve("response.json"), JSON.stringify(Options), (err) => {
        // throws an error, you could also catch it here
        if (err) throws(err);
    });
}
async function getParamPage(param, path, toFile = false) {


    let pageCounter = 0;
    let pageMax = 0;
    let responseBody = [];
    let response = await got({
        'url': 'http://winnershophu.api.myshoprenter.hu/' + param + '?full=1&limit=100',
        'headers': {
            'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',

        }
    }).json();


    pageMax = await response.pageCount;
    for (pageCounter = 0; pageCounter < pageMax; pageCounter++) {

        let response = await got({
            'url': 'http://winnershophu.api.myshoprenter.hu/' + param + '?full=1&limit=100&page=' + pageCounter,
            'headers': {
                'Authorization': 'Basic bm9yYmk6OGRlZTZiNjIxNDU4YjBmNTljZmI2NzEzNGUzNTJmYmU=',
                'accept': 'application/json'
            }
        }).json();

        responseBody.push(response.items);
    }
    if (toFile) {
        writeFileSync(resolve(path), JSON.stringify(responseBody), (err) => {
            // throws an error, you could also catch it here
            if (err) throws(err);
        });
        console.log(pageCounter + " page writed to " + resolve(path));
    }

    return responseBody.flat();



}










getUpdate();