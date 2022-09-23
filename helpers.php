<?php

namespace Air_Search;

function get_location_data() {
  $location = [];
  if ( defined( 'THEME_SETTINGS' ) ) {
    $location = THEME_SETTINGS['search_locations'];
  }

  return apply_filters( 'air_search_location_data', $location );
} // end get_location_data

function get_result_locations() {
  $locations = get_location_data();

  $result_locations = [];
  foreach ( $locations as $location ) {
    foreach ( $location['post_types'] as $key => $post_type ) {
      $result_locations[] = $key;
    }
  }

  return $result_locations;
} // end get_result_locations