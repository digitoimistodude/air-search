/* eslint-disable max-len */
/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */

let latestSearchText;
let latestArgs;
const searchForm = document.querySelector(`#${air_search_settings.search_form_id}`);
if (searchForm) {
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    let searchText = '';
    if (event.target.querySelector('input[name="s"]')) {
      searchText = event.target.querySelector('input[name="s"]').value;
    }
    latestSearchText = searchText;
    const { location } = event.target.dataset;
    let args = '?';
    const argsArray = {};
    event.target.querySelectorAll('select, input[type="checkbox"]:checked, input[type="radio"]:checked').forEach((select) => {
      if (select.value) {
        if (select.type === 'checkbox') {
          if (!argsArray[select.name]) {
            argsArray[select.name] = [select.value];
          } else {
            argsArray[select.name].push(select.value);
          }
        } else {
          argsArray[select.name] = [select.value];
        }
      }
    });

    if (argsArray) {
      Object.keys(argsArray).forEach((argItem) => {
        args += `${argItem}=${argsArray[argItem].join(',')}&`;
      });

      latestArgs = args;
    }

    const fallbackResults = document.querySelector(`#${air_search_settings.fallback_id}`);
    if (fallbackResults) {
      fallbackResults.setAttribute('hidden', true);
    }

    clearPagination();
    showDiv('loading');
    if (location && ((searchText || args !== '?') || `${air_search_settings.search_on_empty}`)) {
      callApi(searchText, location, args);
    } else {
      showDiv('start');
      clearItems();
      clearItemCounts();
      updateResultsText('');
    }
  });

  // Clear the textfield when pressing the escape key
  if (searchForm.querySelector('input[name="s"]')) {
    searchForm.querySelector('input[name="s"]').addEventListener('keydown', (event) => {
      if (event.keyCode === 27) {
        event.target.value = '';
        showDiv('start');
        clearItems();
        clearItemCounts();
        clearPagination();
      }
    });
  }

  // Automatic form submitting when user stops typing for a specified time, clicks a checkbox or changes a select field
  const doneTypingInterval = parseInt(air_search_settings.typing_time, 10);
  if (Number.isInteger(doneTypingInterval)) {
    let typingTimer;
    const searchField = searchForm.querySelector('input[name="s"]');
    if (searchField) {
      let minSearchLength = Math.abs(air_search_settings.min_search_length);
      if (!minSearchLength) {
        minSearchLength = 3;
      }
      searchField.addEventListener('input', () => {
        if (searchField.value.length >= minSearchLength || searchField.value.length === 0) {
          clearTimeout(typingTimer);
          typingTimer = setTimeout(formSubmitEvent, doneTypingInterval);
        }
      });
    }

    if (!air_search_settings.disable_checkbox_auto_search) {
      const filters = searchForm.querySelectorAll('input[type="checkbox"]');
      filters.forEach((element) => {
        element.addEventListener('change', () => {
          clearTimeout(typingTimer);
          typingTimer = setTimeout(formSubmitEvent, doneTypingInterval);
        });
      });
    }

    if (!air_search_settings.disable_select_auto_search) {
      const filters = searchForm.querySelectorAll('select');
      filters.forEach((element) => {
        element.addEventListener('change', () => {
          clearTimeout(typingTimer);
          typingTimer = setTimeout(formSubmitEvent, doneTypingInterval);
        });
      });
    }
  }
}

function formSubmitEvent() {
  // form.submit() function doesn't trigger 'submit' event so we have to make one.
  searchForm.dispatchEvent(new CustomEvent('submit', { cancelable: true }));
}

async function callApi(searchText, location, args) {
  const apiBase = 'air-search/v1/';
  const res = await fetch(`${air_search_settings.rest_api_base}${apiBase + location}/${searchText}${args}`, { method: 'GET' });

  let urlArgs = `${args}airloc=${location}`;
  if (searchText) {
    urlArgs += `&s=${searchText}`;
  }
  window.history.pushState(null, '', urlArgs);
  clearItemCounts();
  if (!res.ok) {
    showDiv('no-results');
    clearItems();
    return;
  }

  const outputRaw = await res.json();
  const output = JSON.parse(outputRaw);
  if ((latestSearchText !== output.search_text) || (latestArgs !== output.args)) {
    return;
  }

  updateResultsText(output.search_result_text);

  if (output.found_posts === 0) {
    showDiv('no-results');
    clearItems();
    return;
  }

  showDiv('results');
  printItems(output, searchText, location, args);
}

function printItems(data, searchText, location, args) {
  clearItems();
  hideResultContainers();

  updateItemCounts(data.total_items);
  updatePagination(data.pagination, searchText, location, args);
  data.items.forEach((item, index) => {
    const targetParent = document.querySelector(`#${item.target}`);
    const targetButton = document.querySelector(`button[aria-controls="${item.target}"]`);
    if (targetButton) {
      targetButton.removeAttribute('hidden');
    }

    if (index === 0) {
      targetParent.removeAttribute('hidden');
      if (targetButton) {
        targetButton.setAttribute('aria-selected', true);
      }
    }

    const targetElement = targetParent.querySelector(`#${air_search_settings.items_container_id}`);
    if (targetElement) {
      targetElement.innerHTML += item.html;
    }
  });
}

function clearItems() {
  const itemsElement = document.querySelector(`#${air_search_settings.search_container_id}`);

  itemsElement.querySelectorAll(`#${air_search_settings.items_container_id}`).forEach((itemElement) => {
    if (itemElement.hasChildNodes()) {
      itemElement.innerHTML = '';
    }
  });
}

function clearItemCounts() {
  const countElements = document.querySelectorAll(`#${air_search_settings.search_container_id} #count`);
  countElements.forEach((element) => {
    element.innerHTML = '';
  });
}

function updateItemCounts(counts) {
  clearItemCounts();
  if (!counts) {
    return;
  }

  counts.forEach((count) => {
    let countElement = document.querySelector(`button[aria-controls="${count.target}"] #count`);
    if (!countElement) {
      countElement = document.querySelector(`#${count.target} #count`);
    }

    if (countElement) {
      countElement.innerHTML = count.count;
    }
  });
}

function showDiv(divToShow) {
  const results = document.querySelector(`#${air_search_settings.search_container_id}`);

  if (divToShow === 'loading') {
    results.setAttribute('aria-busy', true);
  } else {
    results.setAttribute('aria-busy', false);
    results.dataset.airSearchState = divToShow;
    if (results.getAttribute('pagination')) {
      results.removeAttribute('pagination');
    }
  }
}

function hideResultContainers() {
  const resultsWrapper = document.querySelector(`#${air_search_settings.search_container_id}`);

  if (air_search_settings.result_locations) {
    air_search_settings.result_locations.forEach((location) => {
      const resultLocation = resultsWrapper.querySelector(`#${location}`);
      const resultTabButton = resultsWrapper.querySelector(`[aria-controls="${location}"]`);
      if (resultLocation) {
        resultLocation.setAttribute('hidden', true);
      }

      if (resultTabButton) {
        resultTabButton.setAttribute('hidden', true);
        resultTabButton.setAttribute('aria-selected', false);
      }
    });
  }
}

function updatePagination(newPagination, searchText, location, args) {
  const pagDiv = document.querySelector(`#${air_search_settings.pagination_id}`);
  if (pagDiv) {
    args = args.replace(/air-page=[0-9]+&?/i, '');

    pagDiv.removeAttribute('hidden');
    pagDiv.innerHTML = newPagination;

    pagDiv.querySelectorAll('a.page-numbers').forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();

        const pageNumber = event.target.href.match('air-page=([0-9]+)');
        if (pageNumber) {
          args += `air-page=${pageNumber[1]}&`;
        }

        showDiv('loading');
        const searchContainer = document.querySelector(`#${air_search_settings.search_container_id}`);
        if (searchContainer) {
          searchContainer.setAttribute('pagination', true);
        }
        callApi(searchText, location, args);
      });
    });
  }
}

function clearPagination() {
  const pagDiv = document.querySelector(`#${air_search_settings.pagination_id}`);
  if (pagDiv) {
    pagDiv.setAttribute('hidden', true);
    pagDiv.innerHTML = '';
  }
}

function updateResultsText(text) {
  const searchTextElement = document.querySelector(`#${air_search_settings.result_text_id}`);
  if (searchTextElement && text) {
    searchTextElement.innerHTML = text;
  }
}
