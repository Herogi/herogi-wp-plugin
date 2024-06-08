<?php


// Hook into WordPress init
add_action('init', 'herogi_proxy_api');

function herogi_proxy_api()
{
    // Check if this is a request to the proxy endpoint
    if (in_array($_SERVER['REQUEST_URI'], array('/v1/identify'))) {
       
        $request_headers = getallheaders();

         // Initialize an array to store the copied headers
        $copied_headers = array();

        // Define the headers to copy
        $headers_to_copy = array(
            'User-Agent',
            'Authorization',
            'Content-Type',
        );

        // Get all headers from the original request
        $all_headers = getallheaders();

        // Copy the specified headers from the original request
        foreach ($headers_to_copy as $header_name) {
            if (isset($all_headers[$header_name])) {
                $copied_headers[$header_name] = $all_headers[$header_name];
            }
        }

        // Get the raw request body
        $request_body = file_get_contents("php://input");

        // Forward request to destination server
        $response = wp_remote_request('https://stream.herogi.com/v1/identify', array(
            'method'  => $_SERVER['REQUEST_METHOD'], // Use the same request method
            'headers' => $copied_headers,
            'body'    => $request_body // Use the same request body
        ));


        $status_code = wp_remote_retrieve_response_code($response);

        if(get_option('herogi_tracking_domain') == "") {
            $original_host = isset($_SERVER['HTTP_X_FORWARDED_HOST']) ? $_SERVER['HTTP_X_FORWARDED_HOST'] : $_SERVER['HTTP_HOST'];
            // Remove port from the host if present
            $host_parts = explode(':', $original_host);
            $host = $host_parts[0];

            $host_parts = explode('.', $host);
            $root_domain = '.' . implode('.', array_slice($host_parts, -2));
        } else {
            $root_domain = '.' . get_option('herogi_tracking_domain');
        }

        // Check if response is successful
        if (!is_wp_error($response)) {

            // Check if status code is 200
            if ($status_code === 200) {

                // Get the hgid from the JSON response
                $data = json_decode(wp_remote_retrieve_body($response), true);
                $hgid = isset($data['hgid']) ? $data['hgid'] : '';
                $hgdeviceId = isset($data['hgid']) ? $data['deviceId'] : '';

                // Set cookie for the root domain if hgid and hgdeviceid are available
                if(!empty($hgid)) {
                    setcookie('_hgid', $hgid, strtotime('+3 year'), '/', $root_domain);
                }
                if(!empty($hgdeviceId)) {
                    setcookie('_hgDeviceId', $hgdeviceId, strtotime('+3 year'), '/', $root_domain);
                }
            } else if ($status_code === 404) {
                // Remove cookies
                setcookie('_hgid', '', time() - 3600, '/', $root_domain);
                setcookie('_hgDeviceId', '', time() - 3600, '/',$root_domain);
            }
        }

         // Output the original response and headers as they are
         foreach (wp_remote_retrieve_headers($response) as $name => $value) {
            header("$name: $value");
        }

        http_response_code($status_code);
        echo wp_remote_retrieve_body($response);
        exit;

    } 
}
