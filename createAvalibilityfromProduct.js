export function createAvalibilityfromProduct(product) {
    let active = false;
    if (product["stock"] != 0) {
        active = true;
    }
    let AVAILABILITY = {
        ID: "Mery" + product["product_id"],
        IN_STOCK: product["stock"],
        ACTIVE: active
    };
    return AVAILABILITY;

}