/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
const searchForm = document.querySelector('.search-form');
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const searchText = event.target.querySelector('input[name="s"]').value;
  const { location } = event.target.dataset;
  let args = '?';
  event.target.querySelectorAll('select').forEach((select) => {
    if (select.value) {
      args += `${select.name}=${select.value}&`;
    }
  });

  document.querySelector('[class*="fallback"]').style.display = 'none';
  document.querySelector('[class*="fallback"]').setAttribute('aria-hidden', 'true');

  if (searchText && location) {
    callApi(searchText, location, args);
  } else {
    showDiv('start');
    clearItems();
    clearItemCounts();
    clearPagination();
  }
});

async function callApi(searchText, location, args) {
  showDiv('loading');
  const apiBase = 'wp-json/air-search/v1/';
  const res = await fetch(`${apiBase + location}/${searchText}${args}`, { method: 'GET' });

  window.history.pushState(null, '', `${args}s=${searchText}&airloc=${location}`);
  clearItemCounts();
  clearPagination();
  if (!res.ok) {
    showDiv('no-results');
    clearItems();
    return;
  }

  const output = await res.json();
  if (output.success === false) {
    showDiv('no-results');
    clearItems();
    return;
  }

  showDiv('results');
  printItems(output, searchText, location, args);
}

function printItems(results, searchText, location, args) {
  clearItems();
  hideResultContainers();
  const data = JSON.parse(results);

  updateItemCounts(data.total_items);
  updatePagination(data.pagination, searchText, location, args);
  data.items.forEach((item) => {
    const targetParent = document.querySelector(`.${item.target}`);
    targetParent.style.display = '';
    const targetElement = targetParent.querySelector('.items');
    if (targetElement) {
      targetElement.innerHTML += item.html;
    }
  });
}

function clearItems() {
  const itemsElement = document.querySelector('.air-search-results');

  itemsElement.querySelectorAll('.items').forEach((itemElement) => {
    if (itemElement.hasChildNodes()) {
      itemElement.innerHTML = '';
    }
  });
}

function clearItemCounts() {
  const countElements = document.querySelectorAll('.air-search-results .count');
  countElements.forEach((element) => {
    element.innerHTML = '';
  });
}

function updateItemCounts(counts) {
  if (!counts) {
    return;
  }

  counts.forEach((count) => {
    const countElement = document.querySelector(`.${count.target} .count`);

    if (countElement) {
      countElement.innerHTML = count.count;
    }
  });
}

function showDiv(divToShow) {
  const loading = document.querySelector('.air-search-loading');
  const noResults = document.querySelector('.air-search-no-results');
  const results = document.querySelector('.air-search-results');
  const start = document.querySelector('.air-search-start');

  if (loading) {
    loading.style.display = 'none';
    loading.setAttribute('aria-hidden', 'true');
  }

  if (noResults) {
    noResults.style.display = 'none';
    noResults.setAttribute('aria-hidden', 'true');
  }

  if (results) {
    results.style.display = 'none';
    results.setAttribute('aria-hidden', 'true');
  }

  if (start) {
    start.style.display = 'none';
    start.setAttribute('aria-hidden', 'true');
  }

  if (document.querySelector(`.air-search-${divToShow}`)) {
    document.querySelector(`.air-search-${divToShow}`).style.display = '';
    document.querySelector(`.air-search-${divToShow}`).setAttribute('aria-hidden', 'true');
  }
}

function hideResultContainers() {
  const resultsWrapper = document.querySelector('.air-search-results');

  if (resultsWrapper.hasChildNodes) {
    Array.from(resultsWrapper.children).forEach((element) => {
      element.style.display = 'none';
    });
  }
}

function updatePagination(newPagination, searchText, location, args) {
  const pagDiv = document.querySelector('.air-search-pagination');
  args = args.replace(/&?air-page=[0-9]+&?/i, '');
  if (pagDiv) {
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
  const pagDiv = document.querySelector('.air-search-pagination');
  pagDiv.innerHTML = '';
}
