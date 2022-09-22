# air-search

## Registering search locations

In order to use air-search you need to register search locations in `functions.php`.

```php
  'search_locations' => [
    'general' => [
      'query_args' => [
        'posts_per_page' => '7',
      ],
      'post_types' => [
        'container-for-post-type-1'          => 'post_type1',
        'multiple-post-types' => [ 'post_type2', 'post_type3' ],
      ],
      'field_mappings' => [
        'tax_key' => [
          'type'  => 'tax',
          'taxonomy' => 'your_taxonomy',
          'field'  => 'slug',
        ],
        'meta_key' => [
          'type'  => 'meta',
          'key' => 'your_meta_field',
        ],
      ],
    ],
  ],
```

Here we register search location called `general`.
Each search location takes arrays of `query_args`, `post_types` and `field_mappings`.
Only `post_types` is required.

`query_args` allows modifying the search query with the same argumets as `WP_Query` does.

`post_types` is where you specify what post types go in what containers. In the example above, `post_type1` will be placed in a element with id of `container-for-post-type-1`. You can also set multiple post types to the same element.

`field_mappings` allows you to add taxonomy and meta queries to your search.
  * Key of the mapping array has to be used in your input/select field as the name.
  * `type` field takes either "meta" or "tax" depending on which query you want to use.
    * For meta queries you only need to add your meta field as `key`.
    * For taxonomy queries you need to add your taxonomy and optionally `field` to select taxonomies by the value set (default is term_id).


## Search template

### Search form

Add your search location to the form element as `data-location` and id as `air-search-form`(can be changed with hooks).
```html
  <form class="search-form" data-location="general" id="air-search-form">
```
* Search field should have its `name` as `s`
* Make sure your inputs/selects names are same as in `field_mappings`
  * Supported inputs are radio and checkbox

### Search results

All of the results should be wrapped in a div with id of `air-search-results`(can be changed with hooks). This is used to hide search result containers, clearing search result containers and result counts.

```html
  <div id="air-search-results" style="display:none">
```

For each post type you need to make the following html.
* wrapper with id set in `your_location['post_types']`
  * `<ul>` with id as `items`(can be changed with hooks)
  * element with id "count" can be added to get count of the results.
```html
  <div id="container-for-post-type-1" style="display:none">
    <span id="count"></span>
    <ul class="items" id="items"></ul>
  </div>
```

### Search fallback

To make links to search results work you need to create a backup query and container for its results. Fallback results container needs to have its id set to `air-search-fallback`(can be changed with hooks) so it can be hidden when user does a new search.

```php
if ( ! empty( $_GET['s'] ) && ! empty( $_GET['airloc'] ) ) {
  $search_query_results = \Air_Search\do_search_query( [
    'search'   => $_GET['s'],
    'location' => $_GET['airloc'],
  ] );
}
```
```php
  <?php if ( ! empty( $search_query_results['items'] ) ) : ?>
    <div id="air-search-fallback">
    
      <ul class="col col-results">
        <?php foreach ( $search_query_results['items'] as $result ) {
          // Printing of result here
        } ?>
      </ul>
      
    </div>
  <?php endif; ?>
```

### Pagination

Pagination will be replaced with every search so a div with id of `air-search-pagination`(can be changed with hooks) needs to be set. Also a pagination needs to be generated for the fallback search.

```php
 <div id="air-search-pagination">
    <?php if ( ! empty( $search_query_results ) ) {
      echo paginate_links( [
        'base' => '?air-page=%#%',
        'current' => max( 1, isset( $_GET['air-page'] ) ? $_GET['air-page'] : 1 ),
        'total' => $search_query_results['max_pages'],
      ] );
    } ?>
  </div>
```

### Misc elements

Extra optional elements can be added to the template.

Search info text. Id needs to be set to `air-search-result-text`(id and the result text can be modified with hooks)
```html
  <h2 id="air-search-result-text" style="display:none"></h2>
```

Default state of the search. Shown at the start and when input field is empty
```html
  <div id="air-search-start" <?php if ( isset( $search_query_results ) ) echo 'style="display:none"' ?>>
    // Your content here
  </div>
```

Shown when search in progress.
```html
  <div class="air-search-loading" id="air-search-loading" style="display:none">
    // Your loading screen here
  </div>
```

Shown when no results are found.
```html
  <div class="air-search-no-results" id="air-search-no-results" <?php if ( ! isset( $search_query_results ) || ! empty( $search_query_results['items'] ) ) echo 'style="display:none"' ?>>
    // Your content here
  </div>
```

Alot of the elements need to be hidden by default, so they dont flicker when loading the screen.

## Hooks

### Element id filters

* `add_filters( 'air_search_form_id', $id )`
* `add_filters( 'air_search_results_container_id', $id )`
* `add_filters( 'air_search_items_container_id', $id )`
* `add_filters( 'air_search_pagination_id', $id )`
* `add_filters( 'air_search_fallback_id', $id )`
* `add_filters( 'air_search_result_text_id', $id )`

### Other filters

* `add_filters( 'air_search_type_time', $time_in_ms )` Filter for changing the time untill a search is triggered after user has stopped typing. Set in milliseconds. Default 250.
* `add_filters( 'air_search_item_template', $template_path, $item_post_type, $id )` Allows modifying of the item template.
* `add_filters( 'air_search_query_args', $args, $post_type, $search_location )` Allows modifying of the search query. Can be used to modify only a specific post types query.
* `add_filters( 'air_search_item_data', $item_data, $id )` Filter for modifying each singular item.
* `add_filters( 'air_search_query_items', $items )` Filters list of items.
* `add_filters( 'air_search_result_text', $default_result_text, $params['search'], $search_query->found_posts )` Filters the search result text that gets placed in element with id of `air-search-result-text`.
* `add_filters( 'air_search_query_total_items', $total_items )` Filters the total number of items.
* `add_filters( 'air_search_query_result', $output )` Filters the output of the search query.
