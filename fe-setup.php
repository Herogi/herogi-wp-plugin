<?php


// Enqueue frontend JavaScript
function herogi_enqueue_tracking_scripts() {
    // Enqueue your script file
    wp_enqueue_script('tracking-frontend', plugins_url('assets/js/tracking.js', __FILE__), array('jquery', 'herogi-js'), '1.0', true);
    
    // Pass plugin options to the frontend script
    $plugin_options = array(
        'herogi_api_key' => get_option('herogi_api_key'),
        'herogi_api_secret' => get_option('herogi_api_secret'),
        'herogi_push_notification_enabled' => get_option('herogi_push_notification_enabled'),
        'herogi_location_tracking_enabled' => get_option('herogi_location_tracking_enabled'),
        'herogi_click_tracking_enabled' => get_option('herogi_click_tracking_enabled'),
        'herogi_pageload_tracking_enabled' => get_option('herogi_pageload_tracking_enabled'),
    );

    wp_localize_script('tracking-frontend', 'herogi_options', $plugin_options);
}
add_action('wp_enqueue_scripts', 'herogi_enqueue_tracking_scripts');


function enqueue_remote_script() {
  
    $enable_scripts = get_option('herogi_push_notification_enabled');

    // Check if the option value is true
    if ( $enable_scripts == 'on') {
        // Enqueue the service-worker.js file
        wp_enqueue_script( 'herogi-serviceworker-js', '/service-worker.js', array(), '1.0', true );
        // Enqueue the herogi.min.js file, with 'herogi-serviceworker-js' as a dependency
        wp_enqueue_script( 'herogi-js', 'https://cdn.herogi.com/herogi.min.js', array( 'herogi-serviceworker-js' ), '1.0', true );
    } else {
        wp_enqueue_script( 'herogi-js', 'https://cdn.herogi.com/herogi.min.js', array(), '1.0', true );
    }
  
}
add_action( 'wp_enqueue_scripts', 'enqueue_remote_script');


function custom_js_plugin_script() {
  ob_start();
  ?>
  <script type="text/javascript">
      jQuery(document).ready(function($) {
      });

  </script>
  <?php
  echo ob_get_clean();
}

add_action( 'wp_footer', 'custom_js_plugin_script' );