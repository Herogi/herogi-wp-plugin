<?php

if (!defined('ABSPATH'))
    exit;

/*
 * Plugin Name: Herogi
 * Plugin URI: https://herogi.com
 * Description: Herogi Customer Engagement Platform plugin for WordPress
 * Author: Herogi Ltd.
 * Version: 1.1.0
 * Requires at least: 6.0
 * Tested up to: 6.3
 * Requires PHP: 8.2
 * License: GPLv2 or later
 * License URI: https://raw.githubusercontent.com/Herogi/herogi-wp-plugin/master/LICENSE
 */

function herogi_admin_menu()
{

    $icon_url = plugin_dir_url(__FILE__) . 'assets/favicon.png';

    // Add a new menu item to the admin sidebar
    add_menu_page(
        'Herogi Customer Engagement', // Page title
        'Herogi', // Menu title
        'manage_options', // Capability required to access the page
        'herogi-menu', // Menu slug
        'herogi_main_menu_content', // Callback function to render the page
        $icon_url, // Icon slug
        50
    );


    add_submenu_page(
        'herogi-menu', // Parent menu slug
        'Herogi Customer Engagement', // Page title
        'Home', // Menu title
        'manage_options', // Capability required to access the page
        'herogi-menu', // Menu slug
        'herogi_main_menu_content' // Callback function to render the page
    );

    add_submenu_page(
        'herogi-menu', // Parent menu slug
        'Settings', // Page title
        'Settings', // Menu title
        'manage_options', // Capability required to access the page
        'herogi-settings', // Menu slug
        'herogi_settings_menu_content' // Callback function to render the page
    );

}

add_action('admin_menu', 'herogi_admin_menu');

function herogi_main_menu_content()
{
    ?>
    <div class="wrap">
        <h2>Herogi Dashboard</h2>
        <!-- <iframe src="https://beta.herogi.com" style="width:100%; height:calc(100vh - 120px); border:none;"></iframe> -->
        <div>
            <p>To access your Herogi dashboard, please visit <a
                    href="https://beta.herogi.com?utm_source=wordpress&utm_medium=plugin&utm_campaign=dashboard"
                    target="_blank">https://beta.herogi.com</a> and login with your Herogi credentials.</p>
            <p>If you don't have a Herogi account, you can register for free by clicking the button below.</p>
            <button class="button button-primary"
                onclick="window.open('https://beta.herogi.com/register?utm_source=wordpress&utm_medium=plugin&utm_campaign=dashboard', '_blank')">Register</button>
        </div>
    </div>
    <?php
}

function herogi_settings_menu_content()
{
    ?>
    <style>
        .wrap {
            max-width: 800px;
        }

        .wrap h1 {
            margin-bottom: 20px;
        }

        .wrap table {
            width: 100%;
        }

        .wrap table th {
            width: 200px;
        }

        .wrap table td {
            padding: 10px;
        }

        .wrap table td input[type=text] {
            width: 100%;
            max-width: 400px;
        }
    </style>
    <div class="wrap">
        <h1>Herogi Settings</h1>
        <form method="post" action="options.php">
            <?php settings_fields('herogi_settings'); ?>
            <?php do_settings_sections('herogi_settings'); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">API Key:</th>
                    <td><input type="text" name="herogi_api_key"
                            value="<?php echo esc_attr(get_option('herogi_api_key')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">API Secret:</th>
                    <td><input type="text" name="herogi_api_secret"
                            value="<?php echo esc_attr(get_option('herogi_api_secret')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Push Notification Enabled:</th>
                    <td><input type="checkbox" name="herogi_push_notification_enabled" <?php checked(get_option('herogi_push_notification_enabled'), 'on'); ?> /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Location Tracking Enabled:</th>
                    <td><input type="checkbox" name="herogi_location_tracking_enabled" <?php checked(get_option('herogi_location_tracking_enabled'), 'on'); ?> /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Click Tracking:</th>
                    <td><input type="checkbox" name="herogi_click_tracking_enabled" <?php checked(get_option('herogi_click_tracking_enabled'), 'on'); ?> /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">PageLoad Tracking:</th>
                    <td><input type="checkbox" name="herogi_pageload_tracking_enabled" <?php checked(get_option('herogi_pageload_tracking_enabled'), 'on'); ?> /></td>
                </tr>
            </table>
            <div style="border-bottom:1px dashed gray; margin-bottom:5px; margin-top:5px;">
                <h2>Advanced Settings</h2>
            </div>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Tracking Domain:</th>
                    <td><input type="text" name="herogi_tracking_domain"
                            value="<?php echo esc_attr(get_option('herogi_tracking_domain')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">SDK URL:</th>
                    <?php if (get_option('herogi_sdk_url') == '') {
                        update_option('herogi_sdk_url', 'https://cdn.herogi.com/herogi.min.js');
                    } ?>
                    <?php if (get_option('herogi_api_url') == '') {
                        update_option('herogi_api_url', 'https://stream.herogi.com');
                    } ?>
                    <td><input type="text" name="herogi_sdk_url"
                            value="<?php echo esc_attr(get_option('herogi_sdk_url')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">API URL:</th>
                    <td><input type="text" name="herogi_api_url"
                            value="<?php echo esc_attr(get_option('herogi_api_url')); ?>" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// Enqueue CSS to adjust icon size
function herogi_menu_styles()
{
    ?>
    <style type="text/css">
        #toplevel_page_herogi-menu .wp-menu-image img {
            width: 20px;
            height: 20px;
            margin-top: -3px;
        }
    </style>
    <?php
}

add_action('admin_enqueue_scripts', 'herogi_menu_styles');


// Register plugin settings
function herogi_register_settings()
{

    // SDK URL
    register_setting('herogi_settings', 'herogi_tracking_domain');

    // SDK URL
    register_setting('herogi_settings', 'herogi_sdk_url');

    // API URL
    register_setting('herogi_settings', 'herogi_api_url');

    // API Key
    register_setting('herogi_settings', 'herogi_api_key');

    // API Secret
    register_setting('herogi_settings', 'herogi_api_secret');

    // Push Notification
    register_setting('herogi_settings', 'herogi_push_notification_enabled');

    // Location Tracking
    register_setting('herogi_settings', 'herogi_location_tracking_enabled');

    // Tracking for Click and Page Load
    register_setting('herogi_settings', 'herogi_click_tracking_enabled');

    // Tracking for Click and Page Load
    register_setting('herogi_settings', 'herogi_pageload_tracking_enabled');
}
add_action('admin_init', 'herogi_register_settings');


function herogi_activate()
{
    $source = plugin_dir_path(__FILE__) . 'assets/js/service-worker.js';
    $destination = ABSPATH . 'service-worker.js';
    copy($source, $destination);
}
register_activation_hook(__FILE__, 'herogi_activate');

// Deactivation hook
function herogi_deactivate()
{
    // Remove the plugin's options
    delete_option('herogi_sdk_url');
    delete_option('herogi_api_url');
    delete_option('herogi_tracking_domain');
    delete_option('herogi_api_key');
    delete_option('herogi_api_secret');
    delete_option('herogi_push_notification_enabled');
    delete_option('herogi_location_tracking_enabled');
    delete_option('herogi_click_tracking_enabled');
    delete_option('herogi_pageload_tracking_enabled');
}
register_deactivation_hook(__FILE__, 'herogi_deactivate');

require_once (plugin_dir_path(__FILE__) . 'fe-setup.php');
require_once (plugin_dir_path(__FILE__) . 'utility-api.php');
require_once (plugin_dir_path(__FILE__) . 'proxy.php');