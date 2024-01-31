import { convert } from 'html-to-text';
import { stringEqualizer } from './stringEqualizer.js';

export function createItemfromProduct(product, categories, brands, paramaters, paramCategories) {
    let product_category = "-";
    let Params=[];
    categories.forEach(category => {

        if (product["category"] != null && category["shoprenter"] != null || category["shoprenter"] != '-') {


            if (product["category"].toString().replace(/\s+/g, '') === category["shoprenter"].toString().replace(/\s+/g, '')) {
                product_category = category["mall"];
                if (category["param"]) {
                    Params.push( {
                        'NAME': category["param"],
                        'VALUE': category["value"]
                    })

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

        if (count >= 3 || i >= 298) {

            break;
        }

    }
    shortdesc2 = shortdesc2.trim();
    if (shortdesc2[shortdesc2.length - 1] != '.') {
        shortdesc2 += '.'
    }

    //parameter blacklist
    let paramBlacklist=[]
    for (let index = 0; index < paramCategories.length; index++) {
        const element = paramCategories[index];
        if(element["Category_ID;"]==product_category+";"){
            paramBlacklist.push(element.Param)
        }
        
    }
    //parameter check
    for (let i = 0; i < paramaters.length; i++) {
        let parameter=paramaters[i]
        let index=product["description"].indexOf(parameter["Prefix"])
        //if prefix found
        if(index==-1){
            index=product["description"].toLowerCase().indexOf(parameter["Prefix"].toLowerCase())
            if(index==-1){
            continue;}
            }
            //if there is a default Value
            if(parameter["ParamValue"] && !paramBlacklist.includes(parameter["ParamName"])){
                Params.push({
                    NAME:parameter["ParamName"],
                    VALUE:parameter["ParamValue"]
                })
                continue;
            }
        
        let indexEnd = index;
        while(!'<>.;'.includes(product["description"][indexEnd])){indexEnd+=1;}
        let line = product["description"].substring(index, indexEnd);

        if(parameter["Postfix"]){ 
            let indexPost=line.toLowerCase().indexOf(parameter["Postfix"].toLowerCase())
            if(indexPost==-1){continue;} 
            //if Postfix found
            line = line.substring(0,indexPost)
    }   
    line = line.substring(parameter["Prefix"].length)
        let values = []
        values.push(line)
        if(parameter["Separator"]){
           values = line.split(parameter["Separator"])
           if (values.length==1){continue;}
        }
        if(values[0] && !paramBlacklist.includes(parameter["ParamName"])){
        Params.push({
            NAME:parameter["ParamName"],
            VALUE:values[0].toString().trim()
        })}



        if(parameter["ParamName2"] && !paramBlacklist.includes(parameter["ParamName2"])){
            if(values[1]){
            Params.push({
                NAME:parameter["ParamName2"],
                VALUE:values[1].toString().trim()
            })
        }}
        if(parameter["ParamName3"]&& !paramBlacklist.includes(parameter["ParamName3"])){
            if(values[2]){
            Params.push({
                NAME:parameter["ParamName3"],
                VALUE:values[2].toString().trim()
            })
        }}
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
        "PARAM": Params,
        "MEDIA": media,
        "DELIVERY_DELAY": 4
    };

    return Item;
}