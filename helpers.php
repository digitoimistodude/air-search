<?php

namespace Air_Search;

function get_location_data() {
  $location = [];
  if ( defined( 'THEME_SETTINGS' ) && isset( THEME_SETTINGS['search_locations'] ) ) {
    $location = THEME_SETTINGS['search_locations'];
  }

  return apply_filters( 'air_search_location_data', $location );
} // end get_location_data

function get_result_locations() {
  $locations = get_location_data();
  $result_locations = [];

  if ( empty( $locations ) ) {
    return $result_locations;
  }

  foreach ( $locations as $location ) {
    foreach ( $location['post_types'] as $key => $post_type ) {
      $result_locations[] = $key;
    }
  }

  return $result_locations;
} // end get_result_locations

function get_location_search_on_empty_setting() {
  $locations = get_location_data();
  if ( empty( $locations ) ) {
    return false;
  }

  $settings = [];
  foreach ( $locations as $location => $values ) {
    $settings[ $location ] = false;
    if ( isset( $values['search_on_empty'] ) ) {
      if ( true === $values['search_on_empty'] || 'true' === $values['search_on_empty'] ) {
        $settings[ $location ] = true;
      }
    }
  }

  return $settings;
}