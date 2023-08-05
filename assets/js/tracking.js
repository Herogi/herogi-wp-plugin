
var trackOptions = [];
var locationTracking = false;

if(herogi_options.herogi_click_tracking_enabled == 'on') {
    trackOptions.push(["trackClick", {}]);
}

if(herogi_options.herogi_pageload_tracking_enabled == 'on') {
    trackOptions.push(["trackPageLoad", {}]);
}

if(herogi_options.herogi_location_tracking_enabled == 'on') {
    locationTracking = true;
}


herogi.setConf(trackOptions);

if(herogi_options.herogi_api_key != '' && herogi_options.herogi_api_secret != '') {
    herogi.init(herogi_options.herogi_api_key, herogi_options.herogi_api_secret, locationTracking);

    herogi.identify(null, null, null, function (res, d) {
        console.log(res);
        console.log(d);
    });

    if(herogi_options.herogi_push_notification_enabled == 'on') {
        
        if(herogi.isPushPermissionsGranted() == "granted") {
            herogi.requestPushPermissions();
        }
    
        setTimeout(() => {
            if(herogi.isPushPermissionsGranted() == "default") {
                alert("To have better experience we want to send you push notifications");
                var result = herogi.requestPushPermissions();
                console.log(result);
            } else if(herogi.isPushPermissionsGranted() == "denied") {
                alert("Browser push disabled first allow that");
                herogi.requestPushPermissions();
            }
            
        }, 10000);
    }
}


jQuery(document).ready(function($) {

    console.log('tracking.js loaded');
    console.log(herogi_options);
    console.log(herogi);

    jQuery(document.body).on("added_to_cart", function (event, fragment, cartHash, $button) {
            
        var $form = $button.closest('form.cart');

        var productId = null;
        var variationId = null;

        if($button.data("product_id") !== undefined) {
            productId = $button.data("product_id");
        } else {

            if($button.val() === undefined || $button.val() === null || $button.val() === "") {

                //Variation flow
                productId = $form.find('input[name=product_id]').val();
                variationId = $form.find('input[name=variation_id]').val();

            } else {
                productId = $button.val();
            }
        }

        if(productId === undefined || productId === null || productId === "") {
            console.log("Product ID is undefined, make sure you have ajax enabled for add to cart buttons");
            return;
        }

        var payloadData = {};
        payloadData["action"] = "retrieve_product_details";
        payloadData["product_id"] = productId;

        if(variationId !== undefined && variationId !== null && variationId !== "") {
            payloadData["variation_id"] = variationId;
        }

        // Make an AJAX request to retrieve the product details
        $.ajax({
            url: '/wp-admin/admin-ajax.php',
            method: 'POST',
            data: payloadData,
            success: function(response) {
            // Process the response containing the product details
            var product = response;
            var productName = product.name;
            var productPrice = product.price;
            var regularPrice = product.regularPrice;
            var quantity = product.quantity;
            var variationId = product.variationId;
            var permalink = product.productUrl;
            var imageUrl = product.imageUrl;
            var description = product.productDescription;
            var categories = product.categories;
            var currency = product.currency;
            
    
            //fix name, price, add currency
            herogi.trackCustom('AddToCart', {
                'product_id': productId.toString(),
                'name': productName,
                'price': productPrice.toString(),
                'regular_price': regularPrice.toString(),
                'currency' : currency.toString(),
                'quantity': quantity.toString(),
                'product_url': permalink,
                'image_url': imageUrl,
                'description': description,
                'categories': JSON.stringify(categories),
                'extra_data': JSON.stringify({
                    'variation_id': variationId,
                    'source' : 'woocommerce'
                })
                });

            },
            error: function(error) {
                console.log('Error retrieving product details:', error);
            }
        });
    });
});