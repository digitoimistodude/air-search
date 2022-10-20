/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */

let latestSearchText;
const searchForm = document.querySelector(`#${air_search_settings.search_form_id}`);
if (searchForm) {
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const searchText = event.target.querySelector('input[name="s"]').value;
    latestSearchText = searchText;
    const { location } = event.target.dataset;
    let args = '?';
    event.target.querySelectorAll('select, input[type="checkbox"]:checked, input[type="radio"]:checked').forEach((select) => {
      if (select.value) {
        args += `${select.name}=${select.value}&`;
      }
    });

    const fallbackResults = document.querySelector(`#${air_search_settings.fallback_id}`);
    if (fallbackResults) {
      fallbackResults.setAttribute('hidden', true);
    }

    clearPagination();
    showDiv('loading');
    if (searchText && location) {
      callApi(searchText, location, args);
    } else {
      showDiv('start');
      clearItems();
      clearItemCounts();
    }
  });

  // Clear the textfield when pressing the escape key
  searchForm.querySelector('input[name="s"]').addEventListener('keydown', (event) => {
    if (event.keyCode === 27) {
      event.target.value = '';
      showDiv('start');
      clearItems();
      clearItemCounts();
      clearPagination();
    }
  });

  // Automatic form submitting when user stops typing for a specified time
  const doneTypingInterval = parseInt(air_search_settings.typing_time, 10);
  if (Number.isInteger(doneTypingInterval)) {
    const searchField = searchForm.querySelector('input[name="s"]');
    let typingTimer;
    searchField.addEventListener('input', () => {
      if (searchField.value.length > 2 || searchField.value.length === 0) {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(formSubmitEvent, doneTypingInterval);
      }
    });
  }
}

function formSubmitEvent() {
  // form.submit() function doesn't trigger 'submit' event so we have to make one.
  searchForm.dispatchEvent(new CustomEvent('submit'));
}

async function callApi(searchText, location, args) {
  const apiBase = 'wp-json/air-search/v1/';
  const res = await fetch(`${apiBase + location}/${searchText}${args}`, { method: 'GET' });

  window.history.pushState(null, '', `${args}s=${searchText}&airloc=${location}`);
  clearItemCounts();

  if (!res.ok) {
    showDiv('no-results');
    clearItems();
    return;
  }

  const outputRaw = await res.json();
  const output = JSON.parse(outputRaw);
  if (latestSearchText !== output.search_text) {
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

    targetButton.removeAttribute('hidden');
    if (index === 0) {
      targetParent.removeAttribute('hidden');
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
  const results = document.querySelector('#air-search-container');

  if (divToShow === 'loading') {
    results.setAttribute('aria-busy', true);
  } else {
    results.setAttribute('aria-busy', false);
    results.dataset.airSearchState = divToShow;
  }
}

function hideResultContainers() {
  const resultsWrapper = document.querySelector(`#${air_search_settings.search_container_id}`);

  air_search_settings.result_locations.forEach((location) => {
    const resultLocation = resultsWrapper.querySelector(`#${location}`);
    const resultTabButton = resultsWrapper.querySelector(`[aria-controls="${location}"]`);
    if (resultLocation) {
      resultLocation.setAttribute('hidden', true);
    }

    if (resultTabButton) {
      resultTabButton.setAttribute('hidden', true);
    }
  });
}

function updatePagination(newPagination, searchText, location, args) {
  const pagDiv = document.querySelector(`#${air_search_settings.pagination_id}`);
  args = args.replace(/&?air-page=[0-9]+&?/i, '');
  if (pagDiv) {
    pagDiv.removeAttribute('hidden');
    pagDiv.innerHTML = newPagination;
  }

  pagDiv.querySelectorAll('a.page-numbers').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();

      const pageNumber = event.target.href.match('air-page=([0-9]+)');
      if (pageNumber) {
        args += `air-page=${pageNumber[1]}&`;
      }

      callApi(searchText, location, args);
    });
  });
}

function clearPagination() {
  const pagDiv = document.querySelector(`#${air_search_settings.pagination_id}`);
  pagDiv.setAttribute('hidden', true);
  pagDiv.innerHTML = '';
}

function updateResultsText(text) {
  const searchTextElement = document.querySelector(`#${air_search_settings.result_text_id}`);
  if (searchTextElement && text) {
    searchTextElement.innerHTML = text;
  }
}
