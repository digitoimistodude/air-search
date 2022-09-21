<?php

namespace Air_Search;

function search_query( $params ) {
  if ( ! defined( 'THEME_SETTINGS' ) ) {
    return [];
  }

  $data = [
    'location' => $params->get_param( 'location' ),
    'search'   => urldecode( $params->get_param( 'search' ) ),
  ];

  $search_results = do_search_query( $data );

  return wp_json_encode( $search_results );
} // end search_query

function get_search_item_html( $id ) {
  $item_post_type = get_post_type( $id );

  $template_path = locate_template( "templates/air-search-item-{$item_post_type}.php" );
  if ( empty( $template_path ) ) {
    $template_path = locate_template( 'templates/air-search-item-default.php' );
  }

  if ( empty( $template_path ) ) {
    $template_path = plugin_dir_path( __FILE__ ) . 'templates/air-search-item-default.php';
  }

  ob_start();
  include apply_filters( 'air_search_item_template', $template_path, $item_post_type, $id );
  return ob_get_clean();
} // end get_search_item_html

// Minimize the size of main query when using fallback on search page
add_filter( 'pre_get_posts', __NAMESPACE__ . '\maybe_modify_search_query' );
function maybe_modify_search_query( $query ) {
  if ( ! $query->is_main_query() ) {
    return;
  }

  if ( ! is_search() ) {
    return;
  }

  if ( ! isset( $_GET['airloc'] ) ) {
    return;
  }

  if ( ! isset( \THEME_SETTINGS['search_locations'][ $_GET['airloc'] ] ) ) {
    return;
  }

  $query->set( 'post_per_page', 1 );
  $query->set( 'update_post_meta_cache', false );
  $query->set( 'update_post_term_cache', false );
} // end maybe_modify_search_query

function do_search_query( $params ) {
  if ( ! defined( 'THEME_SETTINGS' ) ) {
    return [];
  }

  $search_location = $params['location'];

  $search_locations = THEME_SETTINGS['search_locations'];
  if ( ! array_key_exists( $search_location, $search_locations ) ) {
    return;
  }

  // Get custom query args based on search locaiton
  $args = wp_parse_args( $search_locations[ $search_location ]['query_args'], [
    's' => $params['search'],
    'paged' => isset( $_GET['air-page'] ) ? $_GET['air-page'] : 1,
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
          'key'   => $data['key'],
          'value' => $_GET[ $field_key ],
        ];
      } elseif ( 'tax' === $data['type'] ) {
        $tax_query[] = [
          'taxonomy' => $data['taxonomy'],
          'field'     => isset( $data['field'] ) ? $data['field'] : 'term_id',
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
  $max_pages = 0;
  foreach ( $search_locations[ $search_location ]['post_types'] as $target => $post_type ) {
    $args['post_type'] = $post_type;
    $args = apply_filters( 'air_search_query_args', $args, $post_type, $search_location );
    if ( function_exists( 'relevanssi_do_query' ) ) {
      // Use relevanssi_do_query so we get correct value for found_posts, since it doesnt work correctly if using normal query with "relevanssi => true"
      $search_query = new \WP_Query();
      $search_query->parse_query( $args );
      relevanssi_do_query( $search_query );
    } else {
      // Normal query if relevanssi is not active
      $search_query = new \WP_Query( $args );
    }

    if ( ! $search_query->have_posts() ) {
      continue;
    }

    // If post type is array of post types, join them so they can be used as a key
    if ( is_array( $post_type ) ) {
      $post_type = join( ', ', $post_type );
    }
    $total_items[] = [
      'post_type' => $post_type,
      'target'    => $target,
      'count'     => count( $search_query->posts ),
    ];

    if ( $max_pages < $search_query->max_num_pages ) {
      $max_pages = $search_query->max_num_pages;
    }

    foreach ( $search_query->posts as $id ) {
      $items[] = apply_filters( 'air_search_item_data', [
        'id'        => $id,
        'post_type' => get_post_type( $id ),
        'target'    => $target,
        'html'      => get_search_item_html( $id ),
      ], $id );
    }
  }

  $default_result_text = 'Hakusanalle "' . $params['search'] . '" löytyi ' . $search_query->found_posts . ' tulosta';

  $output = [
    'search_text'        => $params['search'],
    'search_result_text' => apply_filters( 'air_search_result_text', $default_result_text, $params['search'], $search_query->found_posts ),
    'current_page'       => isset( $_GET['air-page'] ) ? $_GET['air-page'] : 1,
    'found_posts'        => $search_query->found_posts,
    'max_pages'          => $max_pages,
    'total_items'        => apply_filters( 'air_search_query_total_items', $total_items ),
    'items'              => apply_filters( 'air_search_query_items', $items ),
    'pagination'         => paginate_links( [
      'base'    => '?air-page=%#%',
      'current' => max( 1, isset( $_GET['air-page'] ) ? $_GET['air-page'] : 1 ),
      'total'   => $max_pages,
    ] ),
  ];

  return apply_filters( 'air_search_query_result', $output );
} // end do_search_query