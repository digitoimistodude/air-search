<?php
/**
 * Plugin Name: Air search
 * Description: Provides realtime search functionality.
 * Plugin URI: https://dude.fi
 * Author: Digitoimisto Dude Oy
 * Author URI: https://dude.fi
 * License: GPL2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Version: 0.1.0
 *
 * @package air-search
 */

namespace Air_Search;

defined( 'ABSPATH' ) || exit;

const PLUGIN_VERSION = '0.1.0';

add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\enqueue_scripts' );
function enqueue_scripts() {
  wp_enqueue_script( 'air-search-scripts', plugin_dir_url( __FILE__ ) . 'scripts.js', [], filemtime( plugin_dir_path( __FILE__ ) . 'scripts.js' ), true );
} // end enqueue_scripts

add_action( 'rest_api_init', function () {
  register_rest_route( 'air-search/v1', '/(?P<location>[a-zA-Z0-9-]+)/(?P<search>[a-zA-Z0-9-]+)?', array(
    'permission_callback' => '__return_true',
    'methods' => 'GET',
    'callback' => __NAMESPACE__ . '\search_query',
  ) );
} );

function search_query( $params ) {
  if ( ! defined( 'THEME_SETTINGS' ) ) {
    return [];
  }

  $search_location = $params->get_param( 'location' );

  $search_locations = THEME_SETTINGS['search_locations'];
  if ( ! array_key_exists( $search_location, $search_locations ) ) {
    wp_send_json_error( 'Search location does not exist.' );
    return;
  }

  $args = wp_parse_args( $search_locations[ $search_location ]['query_args'], [
    's' => $params->get_param( 'search' ),
    'relevanssi' => true,
    'fields' => 'ids',
  ] );

  // Handle all possible meta and taxonomy queries
  $meta_query = [];
  $tax_query = [];
  if ( isset( $search_locations[ $search_location ]['field_mappings'] ) && ! empty( $search_locations[ $search_location ]['field_mappings'] ) ) {
    foreach ( $search_locations[ $search_location ]['field_mappings'] as $field_key => $data ) {
      if ( ! isset( $_GET[ $field_key ] ) || '' === $_GET[ $field_key ] ) {
        continue;
      }

      if ( 'meta' === $data['type'] ) {
        $meta_query[] = [
          'key'   => $data['value'],
          'value' => $_GET[ $field_key ],
        ];
      } elseif ( 'tax' === $data['type'] ) {
        $tax_query[] = [
          'taxonomy' => $data['value'],
          'field'     => 'term_id',
          'terms'    => $_GET[ $field_key ],
        ];
      }
    }
  }

  if ( ! empty( $meta_query ) ) {
    $args['meta_query'] = $meta_query;
  }

  if ( ! empty( $tax_query ) ) {
    $args['tax_query'][] = $tax_query;
  }

  $items = [];
  $total_items = [];
  foreach ( $search_locations[ $search_location ]['post_types'] as $post_type => $v ) {
    $args['post_type'] = $post_type;
    $args = apply_filters( 'air_search_query_args', $args, $post_type );
    $search_query = new \WP_Query( $args );

    if ( ! $search_query->have_posts() ) {
      continue;
    }

    $total_items[ $post_type ] = count( $search_query->posts );

    foreach ( $search_query->posts as $id ) {
      $items[] = apply_filters( 'air_search_item_data', [
        'id'        => $id,
        'post_type' => $post_type,
        'target'    => $v,
        'html'      => get_search_item_html( $id ),
      ], $id );
    }
  }

  if ( empty( $items ) ) {
    wp_send_json_error( 'No search results found.' );
  }

  $output = [
    'current_page' => 0,
    'max_pages'    => $search_query->max_num_pages,
    'total_items'  => $total_items,
    'items'        => $items,
  ];

  return wp_json_encode( $output );
} // end search_query

function get_search_item_html( $id ) {
  $item_post_type = get_post_type( $id );

  $template_path = locate_template( "air-search-item-{$item_post_type}.php" );
  if ( empty( $template_path ) ) {
    $template_path = locate_template( 'air-search-item-default.php' );
  }

  if ( empty( $template_path ) ) {
    $template_path = plugin_dir_path( __FILE__ ) . 'air-search-item-default.php';
  }

  ob_start();
  include $template_path;
  return ob_get_clean();
} // end get_search_item_html