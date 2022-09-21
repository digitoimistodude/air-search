/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */

let latestSearchText;
const searchForm = document.querySelector(`#${air_search_settings.search_form_id}`);
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
    fallbackResults.style.display = 'none';
  }

  clearPagination();
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
    clearTimeout(typingTimer);
    // if (searchField.value) {
    typingTimer = setTimeout(formSubmitEvent, doneTypingInterval);
    // }
  });
}

function formSubmitEvent() {
  // form.submit() function doesn't trigger 'submit' event so we have to make one.
  searchForm.dispatchEvent(new CustomEvent('submit'));
}

async function callApi(searchText, location, args) {
  showDiv('loading');
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
  data.items.forEach((item) => {
    const targetParent = document.querySelector(`#${item.target}`);
    targetParent.style.display = '';
    const targetElement = targetParent.querySelector(`#${air_search_settings.items_container_id}`);
    if (targetElement) {
      targetElement.innerHTML += item.html;
    }
  });
}

function clearItems() {
  const itemsElement = document.querySelector(`#${air_search_settings.results_container_id}`);

  itemsElement.querySelectorAll(`#${air_search_settings.items_container_id}`).forEach((itemElement) => {
    if (itemElement.hasChildNodes()) {
      itemElement.innerHTML = '';
    }
  });
}

function clearItemCounts() {
  const countElements = document.querySelectorAll(`#${air_search_settings.results_container_id} #count`);
  countElements.forEach((element) => {
    element.innerHTML = '';
  });
}

function updateItemCounts(counts) {
  if (!counts) {
    return;
  }

  counts.forEach((count) => {
    const countElement = document.querySelector(`.${count.target} #count`);

    if (countElement) {
      countElement.innerHTML = count.count;
    }
  });
}

function showDiv(divToShow) {
  const loading = document.querySelector('#air-search-loading');
  const noResults = document.querySelector('#air-search-no-results');
  const results = document.querySelector('#air-search-results');
  const start = document.querySelector('#air-search-start');
  const searchTextElement = document.querySelector(`#${air_search_settings.result_text_id}`);

  if (loading) {
    loading.style.display = 'none';
  }

  if (noResults) {
    noResults.style.display = 'none';
  }

  if (results) {
    results.style.display = 'none';
  }

  if (start) {
    start.style.display = 'none';
  }

  if (document.querySelector(`.air-search-${divToShow}`)) {
    document.querySelector(`.air-search-${divToShow}`).style.display = '';

    if (searchTextElement && (divToShow === 'start' || divToShow === 'loading')) {
      searchTextElement.style.display = 'none';
    }
  }
}

function hideResultContainers() {
  const resultsWrapper = document.querySelector(`#${air_search_settings.results_container_id}`);

  if (resultsWrapper.hasChildNodes) {
    Array.from(resultsWrapper.children).forEach((element) => {
      element.style.display = 'none';
    });
  }
}

function updatePagination(newPagination, searchText, location, args) {
  const pagDiv = document.querySelector(`#${air_search_settings.pagination_id}`);
  args = args.replace(/&?air-page=[0-9]+&?/i, '');
  if (pagDiv) {
    pagDiv.style.display = '';
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
  pagDiv.style.display = 'none';
  pagDiv.innerHTML = '';
}

function updateResultsText(text) {
  const searchTextElement = document.querySelector(`#${air_search_settings.result_text_id}`);
  if (searchTextElement && text) {
    searchTextElement.innerHTML = text;
    searchTextElement.style.display = '';
  }
}
