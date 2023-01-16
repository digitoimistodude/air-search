<?php
/**
 * Plugin Name: Air search
 * Description: Provides realtime search functionality.
 * Plugin URI: https://dude.fi
 * Author: Digitoimisto Dude Oy
 * Author URI: https://dude.fi
 * License: GPL2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Version: 1.0.8
 *
 * @package air-search
 */

namespace Air_Search;

defined( 'ABSPATH' ) || exit;

const PLUGIN_VERSION = '1.0.8';

include plugin_dir_path( __FILE__ ) . '/query.php';
include plugin_dir_path( __FILE__ ) . '/helpers.php';

// Enqueue javascript
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\enqueue_scripts' );
function enqueue_scripts() {
  wp_enqueue_script( 'air-search-scripts', plugin_dir_url( __FILE__ ) . 'scripts.js', [], filemtime( plugin_dir_path( __FILE__ ) . 'scripts.js' ), true );
  wp_localize_script( 'air-search-scripts', 'air_search_settings', [
    'search_form_id' => apply_filters( 'air_search_form_id', 'air-search-form' ),
    'search_container_id' => apply_filters( 'air_search_search_container_id', 'air-search-container' ),
    'items_container_id' => apply_filters( 'air_search_items_container_id', 'items' ),
    'pagination_id' => apply_filters( 'air_search_pagination_id', 'air-search-pagination' ),
    'fallback_id' => apply_filters( 'air_search_fallback_id', 'air-search-fallback' ),
    'result_text_id' => apply_filters( 'air_search_result_text_id', 'air-search-result-text' ),
    'typing_time' => apply_filters( 'air_search_type_time', 250 ),
    'result_locations' => get_result_locations(),
    'min_search_length' => apply_filters( 'air_search_min_length', 3 ),
    'rest_api_base'     => rest_url(),
    'disable_checkbox_auto_search' => apply_filters( 'air_search_disable_checkbox_auto_search', false ),
    'disable_select_auto_search' => apply_filters( 'air_search_disable_select_auto_search', false ),
  ] );
} // end enqueue_scripts

// Init rest route for search
add_action( 'rest_api_init', __NAMESPACE__ . '\init_rest_route' );
function init_rest_route() {
  register_rest_route( 'air-search/v1', '/(?P<location>[a-zA-Z0-9-]+)/(?P<search>[a-zA-Z0-9-\p{L}\%]+)?', [
    'permission_callback' => '__return_true',
    'methods' => 'GET',
    'callback' => __NAMESPACE__ . '\search_query',
  ] );

  register_rest_route( 'air-search/v1', '/(?P<location>[a-zA-Z0-9-]+)', [
    'permission_callback' => '__return_true',
    'methods' => 'GET',
    'callback' => __NAMESPACE__ . '\search_query',
  ] );
} // end init_rest_route