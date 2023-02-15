### 1.0.15: 2023-02-15
## Fixed
* Search text input field functionality when using air-search as replacement for WP default search.

### 1.0.14: 2023-02-15
## Changed
* Search text input field from using name="s", to using id.

## Added
* air_search_text_field_id filter to change id that is given to search text input field.

### 1.0.13: 2023-02-13
## Changed
* air_search_search_on_empty filter changed to a setting in search locations registration to allow different settings for each search location.

### 1.0.12: 2023-02-13
## Added
* air_search_search_on_empty filter that can be used to enable searching even when no input is given.

## Fixed
* Clear results text when no results are found.

### 1.0.11: 2023-02-10
## Added
* air_search_pre_items filter that can be used to completely change the way items are listed.

### 1.0.10: 2023-01-23
## Fixed
* Typo in if check.

### 1.0.9: 2023-01-23
## Fixed
* Trying to set attribute to a element that might not exist.

### 1.0.8: 2023-01-16
## Fixed
* Set first tab button to active when doing a new search.

### 1.0.7: 2023-01-16
## Fixed
* Handling of currently selected non text field inputs.

### 1.0.6: 2023-01-11
## Fixed
* Firefox reloading the page when submitting the form.

### 1.0.5: 2023-01-05
## Fixed
* Search getting stuck if using checkboxes and select fields at the same time.

## Added
* Automatic searching after changing the value of a select field.
* Hook for disabling automatic searching after changing a select field.

### 1.0.4: 2022-12-29
## Fixed
* Bugs related to pagination
* A query selector not using a variable that can be changed with hooks

### 1.0.3: 2022-12-29
## Added
* air_search_result_text filter now gets total number of posts as a variable.

### 1.0.2: 2022-12-20
## Added
* Automatically search after clicking an input with type checkbox. To make searches with no text input and no search button possible.
* Filter to disable checkbox auto search.
* Checks for various elements to allow search to work even without some elements (text search field, pagination, etc.).
* 'meta_relation' and 'tax_relation' for when search has more than one same type field type. Both default to 'AND' if not set.

## Fixed
* Handling of multiple field mappings of same type.

### 1.0.1: 2022-12-7
## Added
* Hook for setting the minium length of search text before search starts

### 1.0.0: 2022-09-22

* Initial release
