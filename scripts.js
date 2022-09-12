/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
const searchForm = document.querySelector('.search-form');
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const searchText = event.target.querySelector('.search-field').value;
  const { location } = event.target.dataset;
  let args = '?';
  event.target.querySelectorAll('select').forEach((select) => {
    args += `${select.name}=${select.value}&`;
  });

  if (searchText && location) {
    showDiv('loading');
    callApi(searchText, location, args);
  } else {
    showDiv('start');
    clearItems();
    clearItemCounts();
  }
});

async function callApi(searchText, location, args) {
  const apiBase = 'wp-json/air-search/v1/';
  const res = await fetch(`${apiBase + location}/${searchText}${args}`, { method: 'GET' });

  clearItemCounts();
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
  printItems(output);
}

function printItems(results) {
  clearItems();
  hideResultContainers();

  const data = JSON.parse(results);
  updateItemCounts(data.total_items);
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
  const countElements = document.querySelectorAll('.air-search-results [class$="-count"]');
  countElements.forEach((element) => {
    element.innerHTML = '';
  });
}

function updateItemCounts(counts) {
  if (!counts) {
    return;
  }

  counts.forEach((count) => {
    const countElement = document.querySelector(`.${count.target}-count`);

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

  loading.style.display = 'none';
  noResults.style.display = 'none';
  results.style.display = 'none';
  start.style.display = 'none';

  document.querySelector(`.air-search-${divToShow}`).style.display = '';
}

function hideResultContainers() {
  const resultsWrapper = document.querySelector('.air-search-results');

  if (resultsWrapper.hasChildNodes) {
    Array.from(resultsWrapper.children).forEach((element) => {
      element.style.display = 'none';
    });
  }
}
