<?php

if ( ! defined( 'ABSPATH' ) ) exit;

// Enqueue frontend JavaScript
function herogi_enqueue_tracking_scripts() {
    // Enqueue your script file
    wp_enqueue_script('tracking-frontend', plugins_url('assets/js/tracking.js', __FILE__), array('jquery', 'herogi-js'), '1.0.0', true);
    
    // Pass plugin options to the frontend script
    $plugin_options = array(
        'herogi_api_key' => get_option('herogi_api_key'),
        'herogi_api_secret' => get_option('herogi_api_secret'),
        'herogi_tracking_domain' => get_option('herogi_tracking_domain'),
        'herogi_api_url' => get_option('herogi_api_url'),
        'herogi_push_notification_enabled' => get_option('herogi_push_notification_enabled'),
        'herogi_location_tracking_enabled' => get_option('herogi_location_tracking_enabled'),
        'herogi_click_tracking_enabled' => get_option('herogi_click_tracking_enabled'),
        'herogi_pageload_tracking_enabled' => get_option('herogi_pageload_tracking_enabled'),
        'herogi_ajax_nonce' => wp_create_nonce('herogi_retrieve_product_details')
    );

    wp_localize_script('tracking-frontend', 'herogi_options', $plugin_options);


}
add_action('wp_enqueue_scripts', 'herogi_enqueue_tracking_scripts');


function herogi_enqueue_remote_script() {
  
    $enable_scripts = get_option('herogi_push_notification_enabled');
    $cdn_url = get_option('herogi_sdk_url');

    // Check if the option value is true
    if ( $enable_scripts == 'on') {
        // Enqueue the service-worker.js file
        wp_enqueue_script( 'herogi-serviceworker-js', '/service-worker.js', array(), '1.0', true );
        // Enqueue the herogi.min.js file, with 'herogi-serviceworker-js' as a dependency
        wp_enqueue_script( 'herogi-js', $cdn_url, array( 'herogi-serviceworker-js' ), null, true );
    } else {
        wp_enqueue_script( 'herogi-js', $cdn_url, array(), null, true );
    }
  
}

add_action( 'wp_enqueue_scripts', 'herogi_enqueue_remote_script');