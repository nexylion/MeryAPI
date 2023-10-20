import { convert } from 'html-to-text';
import { stringEqualizer } from './stringEqualizer.js';

export function createItemfromProduct(product, categories, brands) {
    let product_category = "";
    let Param;
    categories.forEach(category => {

        if (product["category"] != null && category["shoprenter"] != null || category["shoprenter"] != '-') {


            if (product["category"].toString().replace(/\s+/g, '') === category["shoprenter"].toString().replace(/\s+/g, '')) {
                product_category = category["mall"];
                if (category["param"]) {
                    Param = {
                        'NAME': category["param"],
                        'VALUE': category["value"]
                    }

                }
            }
        }

    });
    let product_brand = "MERYSTYLE";
    for (let i = 0; i < brands.length; i++) {
        if (stringEqualizer(product["manufacturer"].toString()) == "MERYSTYLE") { break; }
        if (stringEqualizer(product["manufacturer"].toString()) == "HOLMI") { break; }
        if (stringEqualizer(product["manufacturer"].toString()) == "MARASHOP") { break; }
        const brand = brands[i];
        if (product["manufacturer"] != null && brand["title"] != null) {
            if (stringEqualizer(product["manufacturer"].toString()) == stringEqualizer(brand["title"].toString())) {
                product_brand = brand["brand_id"];
                break;
            }
        }
    }

    let shortdesc = "";
    let salePrice = Math.round(product["price_special"] * 0.127 * 1.23) * 10;
    let rPrice = Math.round(product["price"] * 0.127 * 1.23) * 10;
    let media = [];

    function imageUrlEdit(url) {
        let reg = new RegExp('cache\/.+?\/');
        let reg2 = new RegExp(/\?v=.*./);
        let reg3 = new RegExp(/\/\/.+?\.hu/);

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
    let reg = new RegExp(/<img.+?>/gm);
    shortdesc = convert(product["description"].replace(reg, '')).replace(/\s+/g, ' ');

    let shortdesc2;
    let count = 0;
    for (let i = 0; i < shortdesc.length; i++) {

        let element = shortdesc[i];

        if (element == '\t' || element == '\n' || element == '*') {
            element = ' ';
        }
        if (element == '!' || element == '?' || element == ';') {
            element = '.';
        }
        if (element == '[') {

            break;
        }
        if (i == 0) {
            shortdesc2 = element;
        } else {
            shortdesc2 += element
        }
        if (element == '.') {
            count++;
        }

        if (count >= 3 || i >= 299) {

            break;
        }

    }
    shortdesc2 = shortdesc2.trim();
    if (shortdesc2[shortdesc2.length - 1] != '.') {
        shortdesc2 += '.'
    }


    let Item = {
        "ID": "Mery" + product["product_id"],
        "STAGE": "TESTING",
        "CATEGORY_ID": product_category,
        "BRAND_ID": product_brand,
        "TITLE": product["name"],
        "SHORTDESC": shortdesc2,
        "LONGDESC": product["description"],
        "PRIORITY": 1,
        "PACKAGE_SIZE": "smallbox",
        "BARCODE": product["ean"],
        "PRICE": salePrice,
        "VAT": 27,
        "RRP": rPrice,
        "PARAM": Param,
        "MEDIA": media,
        "DELIVERY_DELAY": 4
    };

    return Item;
}