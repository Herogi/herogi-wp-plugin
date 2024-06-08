=== Herogi - Customer Engagement, Marketing Automation, Omni Channel Messaging ===
Contributors: herogi
Tags: marketing automation,customer engagement,email marketing,email,push,sms,woocommerce marketing
Stable tag: 1.1.0
Requires at least: 6.0
Tested up to: 6.3
Requires PHP: 8.2
License: GPLv2 or later
License URI: https://raw.githubusercontent.com/Herogi/herogi-wp-plugin/master/LICENSE

Easy to use official WordPress plugin from Herogi for WordPress users to increase their customer outreach. 

== Description ==

The Herogi WordPress Plugin is a powerful tool that seamlessly integrates the Herogi customer engagement and customer data platform into your WordPress website. With this plugin, you can effortlessly gather valuable insights about your website visitors' behavior, enabling you to understand their interactions, preferences, and actions on your site.

== Features ==

- **Client-Side Event Tracking:** Herogi tracks various client-side events, such as page views, clicks, logins, registrations, product views, add to cart, abandoned cart, and order completions. You can even set up custom event tracking to capture specific user interactions.

- **Customer Insights:** Gain deep insights into your website customers with the data collected by Herogi. Understand their interests, behaviors, and preferences to tailor your marketing strategies effectively.

- **Marketing Automation:** Leverage the rich marketing automation features of Herogi to create personalized and targeted campaigns based on customer segmentation and behavior. Engage your customers through email, SMS, web push notifications, or custom API calls to various integration points.

- **Multichannel Communication:** Reach your customers through their preferred communication channels. The plugin supports email, SMS, web push notifications, and custom API calls, ensuring you can connect with your audience wherever they are.

- **Customer Segmentation:** Organize your customers into various demographic segments for precise targeting and more effective marketing efforts.

- **WooCommerce Support:** The Herogi plugin fully integrates with WooCommerce, providing advanced customer insights and automation capabilities tailored for e-commerce businesses. Track product views, add to cart events, abandoned carts, and completed orders to optimize your WooCommerce store's performance.

== Installation ==

1. Download the Herogi WordPress Plugin from the [WordPress Plugin Repository](https://wordpress.org/plugins/herogi/).

2. Upload the plugin files to the `/wp-content/plugins/herogi` directory, or install the plugin directly through the WordPress dashboard.

3. Activate the Herogi WordPress Plugin through the 'Plugins' menu in WordPress.

4. Visit the Herogi settings page under the WordPress dashboard to configure your Herogi account and API key.

5. Set up the client-side event tracking mechanisms by choosing the events you want to track on your website.

6. If you are using WooCommerce, navigate to the WooCommerce integration settings in the Herogi plugin and enable WooCommerce support to start gathering valuable e-commerce data.

7. Start leveraging the power of Herogi's rich marketing automation features and WooCommerce support to engage with your customers effectively.

== Requirements ==

- An active Herogi account. Don't have one? Sign up at [https://herogi.com](https://herogi.com).

- WordPress 6.0 or higher.

- WooCommerce (for WooCommerce features).

== Service Information ==

Our plugin relies on [Herogi](https://herogi.com) for client-side event tracking. Herogi tracks various client-side events, including but not limited to page views, clicks, logins, registrations, product views, add to cart, abandoned cart, and order completions or customly configured events to capture specific user interactions.

== Data Usage ==

- **When:** Herogi is utilized to track client-side events whenever a relevant user action occurs within our plugin. For example, when a user logs in, registers, adds items to the cart, or completes an order, Herogi tracks and records these events.
- **Data Sent:** Herogi collects data related to these events, including event type, user ID, timestamp, and any additional information related to the event.
- **Data Handling:** The data collected by Herogi is subject to our [Privacy Policy](https://herogi.com/privacy-policy). Please review our Privacy Policy to understand how client-side event data is handled.

== Support ==

For any issues, questions, or feedback regarding the Herogi WordPress Plugin, please visit our support page at [https://learn.herogi.com/](https://learn.herogi.com/).

== Contributing ==

We welcome contributions from the community! If you have any feature requests, bug fixes, or improvements, please submit a pull request on our GitHub repository at [https://github.com/herogi/wordpress-plugin](https://github.com/herogi/wordpress-plugin).

== Changelog ==

= v1.1.0 =
Added support for proxying SDK requests. This will help to solve Safari Intelligent Tracking Prevention (ITP) concerns. Now user cookies are first party cookies which helps to track safari customers for 3 years. Originally it was limited to 7 days. 

= v1.0.0 =
Initial version upload
