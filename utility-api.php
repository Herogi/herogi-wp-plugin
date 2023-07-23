<?php


function getCategories($product) {

    // Get the product category IDs
    $category_ids = $product->get_category_ids();
    $catFlatten = array();

    if (!empty($category_ids)) {
        foreach ($category_ids as $category_id) {
            // Get the category object
            $category = get_term($category_id, 'product_cat');

            // Output category information
            $c = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description
            );
            
            $catFlatten[] = $c;
        }
    }

    return $catFlatten;
}

// Register the AJAX action
add_action('wp_ajax_retrieve_product_details', 'retrieve_product_details');
add_action('wp_ajax_nopriv_retrieve_product_details', 'retrieve_product_details'); // For non-logged-in users

function retrieve_product_details() {
  // Get the product ID from the AJAX request
  $product_id = isset($_POST['product_id']) ? $_POST['product_id'] : '';
  $variation_id = isset($_POST['variation_id']) ? $_POST['variation_id'] : 0;

  if ($product_id) {
    // Retrieve the product details based on the product ID
    // Modify this part to match your specific implementation for retrieving product details

    // Example: Retrieve product details from WooCommerce
    $product = wc_get_product($product_id);
    $cart = WC()->cart;

    if ($product) {

        $requested_quantity = 0;
        

        // Iterate through cart items
        foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
            if ($cart_item['product_id'] == $product_id && $cart_item['variation_id'] == $variation_id) {
                $requested_quantity = $cart_item['quantity'];
                $variation_id = $cart_item['variation_id'];
                break;
            } else if ($cart_item['product_id'] == $product_id && $variation_id == 0) {
                $requested_quantity = $cart_item['quantity'];
                break;
            }
        }   

        $image_id = $product->get_image_id();
        $image_url = wp_get_attachment_image_url($image_id, 'full');
        
       
      $product_details = array(
        'id' => $product->get_id(),
        'name' => $product->get_name(),
        'price' => $product->get_price(),
        'regularPrice' => $product->get_regular_price() ? $product->get_regular_price() : $product->get_price(),
        'currency' => get_woocommerce_currency(),
        'quantity' => $requested_quantity, // Assuming a quantity of 1 for the added product
        'variationId' => $variation_id,
        'imageUrl' => $image_url,
        'productUrl' => $product->get_permalink(),
        'productDescription' => wp_strip_all_tags($product->get_description()),
        'categories' => getCategories($product)
      );

      // Return the product details as a JSON response
      wp_send_json($product_details);
    }
  }

  // If product details retrieval fails or product ID is not provided
  wp_send_json_error('Product details could not be retrieved.');
}

add_action('wp_footer', 'order_received_js_script');
function order_received_js_script() {
    // Only on order received" (thankyou)
    if( ! is_wc_endpoint_url('order-received') )
        return; // Exit

    $order_id = absint( get_query_var('order-received') ); // Get the order ID

    if( get_post_type( $order_id ) !== 'shop_order' ) {
        return; // Exit
    }

    $order = wc_get_order( $order_id ); // Get the WC_Order Object

    // Only for processing orders
    if ( method_exists( $order, 'has_status') && ! $order->has_status( 'processing' ) ) {
        return; // Exit
    }

    $items = $order->get_items();

    $order_data["order_id"] = $order->get_id();
    $order_data["currency"] = $order->get_currency();
    $order_data["total"] = $order->get_total();
    $order_data["sub_total"] = $order->get_subtotal();
    $order_data["total_discount"] = $order->get_total_discount();
    $order_data["total_tax"] = $order->get_total_tax() ? $order->get_total_tax() : "0";
    $order_data["total_shipping"] = $order->get_total_shipping() ? $order->get_total_shipping() : "0";
    $order_data["total_fees"] = $order->get_total_fees() ? $order->get_total_fees() : "0";
    $order_data["payment_method"] = $order->get_payment_method_title();

    // Get customer details from the order
    $order_data["customer_id"] = $order->get_customer_id();
    $order_data["customer_email"] = $order->get_billing_email();
    $order_data["customer_first_name"] = $order->get_billing_first_name();
    $order_data["customer_last_name"] = $order->get_billing_last_name();
    $order_data["customer_company"] = $order->get_billing_company();
    $order_data["customer_address_1"] = $order->get_billing_address_1();
    $order_data["customer_address_2"] = $order->get_billing_address_2();
    $order_data["customer_city"] = $order->get_billing_city();
    $order_data["customer_state"] = $order->get_billing_state();
    $order_data["customer_postcode"] = $order->get_billing_postcode();
    $order_data["customer_country"] = $order->get_billing_country();
    $order_data["customer_phone"] = $order->get_billing_phone();
    
    $products = array();

    foreach ($items as $item) {
        
        $product_id = $item->get_product_id();
        $product = wc_get_product($product_id);


        $image_id = $product->get_image_id();
        $image_url = wp_get_attachment_image_url($image_id, 'full');   
        $catFlatten = getCategories($product);

        $product_data = array(
            'id' => $product->get_id(),
            'name' => $item->get_name(),
            'total' => $item->get_total(),
            'subtotal' => $item->get_subtotal(),
            'currency' => get_woocommerce_currency(),
            'quantity' => $item->get_quantity(), // Assuming a quantity of 1 for the added product
            'variationId' => $item->get_variation_id(),
            'imageUrl' => $image_url,
            'productUrl' => $product->get_permalink(),
            'productDescription' => wp_strip_all_tags($product->get_description()),
            'categories' => $catFlatten
        );
        
        // Add product data to the products array
        $products[] = $product_data;
    }

    // Add the products array to the order data
    $order_data['products'] = $products;
    
    $json_data = json_encode($order_data);

    ?>
    <script>
    // Once DOM is loaded
    jQuery( function($) { 
        // Trigger a function (example)
        var order =  <?php echo $json_data; ?>;

        console.log('Order Details:');
        console.log(order);

        var customerData = {
            'email': order.customer_email,
            'firstname': order.customer_first_name,
            'lastname': order.customer_last_name,
            'city': order.customer_city,
            'country': order.customer_country,
            'mobileNo': order.customer_phone
        };

        if(order.customer_id == 0) {
            herogi.identify(customerData, null, null, function(response) {
                console.log(response);
            });
        } else {
            herogi.identify(order.customer_id.toString(), null, null, function(response) {
                console.log(response);
            });
        }
       
        herogi.trackCustom('Order', {
            'order_id': order.order_id.toString(),
            'cart_data': JSON.stringify(order.products),
            'cart_total': order.total.toString(),
            'cart_subtotal': order.sub_total.toString(),
            'total_tax': order.total_tax.toString(),
            'total_shipping': order.total_shipping.toString(),
            'total_fees': order.total_fees.toString(),
            'total_discount': order.total_discount.toString(),
            'payment_method': order.payment_method.toString(),
            'currency': order.currency.toString()
        });
        
    });
    </script>
    <?php
}

function track_product_view() {

    if (is_product()) {

        global $product;
        $product_id = $product->get_id();
        $name = $product->get_name();
        $price = $product->get_price();
        $regularPrice = $product->get_regular_price() ? $product->get_regular_price() : $price;
        $currency = get_woocommerce_currency();
        $image_url = wp_get_attachment_image_url($product->get_image_id(), 'full');
        $imageUrl = $image_url;
        $productUrl = $product->get_permalink();
        $productDescription = wp_strip_all_tags($product->get_description());
        $categories = getCategories($product);
        
        ?>
        <script type="text/javascript">

            var productId = <?php echo $product_id; ?>;
            var productName = "<?php echo $name; ?>";
            var productPrice = <?php echo $price; ?>;
            var regularPrice = <?php echo $regularPrice; ?>;
            var currency = "<?php echo $currency; ?>";
            var imageUrl = "<?php echo $imageUrl; ?>";
            var permalink = "<?php echo $productUrl; ?>";
            var description = "<?php echo esc_js($productDescription); ?>";
            var categories = <?php echo json_encode($categories); ?>;

            jQuery(function($) {

                herogi.trackCustom('ProductView', {
                    'product_id': productId.toString(),
                    'name': productName,
                    'price': productPrice.toString(),
                    'regular_price': regularPrice.toString(),
                    'currency' : currency.toString(),
                    'product_url': permalink,
                    'image_url': imageUrl,
                    'description': description,
                    'categories': JSON.stringify(categories)
                });

            });
        </script>
        <?php
    }
}
add_action('wp_footer', 'track_product_view');