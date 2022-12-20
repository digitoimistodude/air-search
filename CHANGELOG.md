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