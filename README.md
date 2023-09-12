## Air-search - A missing real time search for WordPress

<!--[![GitHub release](https://img.shields.io/github/tag/digitoimistodude/air-search.svg?style=flat-square)](https://github.com/digitoimistodude/air-search/releases)-->

Air-search is a developer-friendly real time search powered by WordPress (+ preferably [Relevanssi Premium](https://github.com/msaari/relevanssi)) + Vanilla JS.

### Registering search locations

In order to use air-search you need to register search locations.

If you are using Air-light starter theme you can register your locations in your theme_settings in functions.php like this:

```php
  'search_locations' => [
    'general' => [
      'search_on_empty' => true, // Enables searching on empty fields, disables start search state. Accepts true as a boolean or string.
      'query_args' => [
        'posts_per_page' => '7',
      ],
      'post_types' => [
        'container-for-post-type-1'          => 'post_type1',
        'multiple-post-types' => [ 'post_type2', 'post_type3' ],
      ],
      'field_mappings' => [
        'tax_relation' => 'OR', // This will be used as the relation argument when using multipe queries of same type. If not set defaults to 'AND'.
        'meta_relation' => 'OR', // This will be used as the relation argument when using multipe queries of same type. If not set defaults to 'AND'.
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

If you are not using Air-Light you need to register your search locations with `add_filters( 'air_search_location_data', $location )` filter, where `$location` is your search locations. Like this:

```php
  add_filters( 'air_search_location_data', [
    'general' => [
      'search_on_empty' => true, // Enables searching on empty fields, disables start search state. Accepts true as a boolean or string.
      'query_args' => [
        'posts_per_page' => '7',
      ],
      'post_types' => [
        'container-for-post-type-1'          => 'post_type1',
        'multiple-post-types' => [ 'post_type2', 'post_type3' ],
      ],
      'field_mappings' => [
        'tax_relation' => 'OR', // This will be used as the relation argument when using multipe queries of same type. If not set defaults to 'AND'.
        'meta_relation' => 'OR', // This will be used as the relation argument when using multipe queries of same type. If not set defaults to 'AND'.
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
  ] )
```


Here we register search location called `general`.
Each search location takes arrays of `query_args`, `post_types` and `field_mappings`.
Only `post_types` is required.

`query_args` allows modifying the search query with the same argumets as `WP_Query` does.

`post_types` is where you specify what post types go in what containers. In the example above, `post_type1` will be placed in a element with id of `container-for-post-type-1`. You can also set multiple post types to the same element.

`field_mappings` allows you to add taxonomy and meta queries to your search. **Fields need to be listed in the same order as they are in the search form. If the order of field mappings and fields in the form don't match, search will get stuck in loading state.**
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

#### Search text input
If air-search is used as a replacement for normal search.

* Search field should have its `name` as `s`
```html
  <input type="text" name="s">
```

If air-search is used as a separate search from normal WP search
* Search field should have its `name` as anything but `s` and `id` as `search-text` (can be changed with hooks).
```html
  <input type="text" name="not-s" id="search-text">
````
* Make sure your inputs/selects names are same as in `field_mappings`
  * Supported inputs are radio and checkbox

### Search content

All of the content should be wrapped in a div with id of `air-search-container`(can be changed with hooks), with aria-live set. Aria-live allows better experience for screen reader users. This element gets attribute `aria-busy="true"` when loading is happening and `aria-busy="false"` when content is ready. This allows us to display a loading screen during load for seeing users and screen readers can act according to `aria-live`. Data attribute `data-air-search-state` will allow you to hide and show correct content for each situation. Its values are:
* `start` - shown when nothing has been searched for.
* `no-results`- shown when no results are found.
* `results` - shown when results are found.

You will have to add `data-air-search-state="start"` to your template or set a specific styles for when it doesn't exist, becouse JS will only add it after its first action.

Showing of the bigger elements is controlled with this data attribute. Smaller elements get attribute `hidden="true"`, this should be used to controll their visibility in styles.

```html
  <div aria-live="polite" id="air-search-container">
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

Search result items by default use a template from the plugin.

Default template can be overridden by adding a file `youtheme/templates/air-search-item-default.php`

Each post type can have their own template by adding a file `yourtheme/templates/air-search-item-{your-post-type}.php`

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

Extra optional elements can be added inside of the content wrapper.

Search info text. Id needs to be set to `air-search-result-text`(id and the result text can be modified with hooks)
```html
  <h2 id="air-search-result-text"></h2>
```

Default state of the search. Shown at the start and when input field is empty
```html
  <div id="air-search-start">
    // Your content here
  </div>
```

Shown when no results are found.
```html
  <div class="air-search-no-results" id="air-search-no-results">
    // Your content here
  </div>
```

## Hooks

### Element id filters

* `add_filter( 'air_search_form_id', $id )`
* `add_filter( 'air_search_results_container_id', $id )`
* `add_filter( 'air_search_text_field_id', $id )`
* `add_filter( 'air_search_items_container_id', $id )`
* `add_filter( 'air_search_pagination_id', $id )`
* `add_filter( 'air_search_fallback_id', $id )`
* `add_filter( 'air_search_result_text_id', $id )`

### Other filters

* `add_filter( 'air_search_location_data', $location )` Used to set/edit search location data.
* `add_filter( 'air_search_type_time', $time_in_ms )` Filter for changing the time untill a search is triggered after user has stopped typing. Set in milliseconds. Default 250.
* `add_filter( 'air_search_item_template', $template_path, $item_post_type, $id )` Allows modifying of the item template.
* `add_filter( 'air_search_query_args', $args, $post_type, $search_location )` Allows modifying of the search query. Can be used to modify only a specific post types query.
* `add_filter( 'air_search_item_data', $item_data, $id )` Filter for modifying each singular item.
* `add_filter( 'air_search_query_items', $items )` Filters list of items.
* `add_filter( 'air_search_result_text', $default_result_text, $search_text, $total_items_per_post_type, $total_items )` Filters the search result text that gets placed in element with id of `air-search-result-text`.
* `add_filter( 'air_search_query_total_items', $total_items )` Filters the total number of items.
* `add_filter( 'air_search_query_result', $output )` Filters the output of the search query.
* `add_filter( 'air_search_min_length', $length )` Allows user to change needed length of the search input before automatic search can start.
* `add_filter( 'air_search_disable_checkbox_auto_search', false )` Setting this to true will stop form from automatically submitting after clicking an input with type of checkbox.
* `add_filter( 'air_search_disable_select_auto_search', false )` Setting this to true will stop form from automatically submitting after changing a select field.
* `add_filter( 'air_search_pre_items', null, $post_ids, $post_type, $search_location )` This can be used to completely change the way results are listed. Filter should return html as a string. Instead of items containing all the search results and their datas, this one "item" will replace all of them. Items will need to be handled and listed in the filters html, this allows you to for example group results in groups based on post taxonomy.
