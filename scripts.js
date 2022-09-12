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
    callApi(searchText, location, args);
  } else {
    clearItems();
  }
});

async function callApi(searchText, location, args) {
  const apiBase = 'wp-json/air-search/v1/';
  const res = await fetch(`${apiBase + location}/${searchText}${args}`, { method: 'GET' });
  if (!res.ok) {
    clearItems();
    return;
  }

  const output = await res.json();
  if (output.success === false) {
    clearItems();
    return;
  }

  printItems(output);
}

function printItems(results) {
  clearItems();

  JSON.parse(results).items.forEach((item) => {
    const targetElement = document.querySelector(`.${item.target}`);
    if (targetElement) {
      targetElement.innerHTML += item.html;
    }
  });
}

function clearItems() {
  const itemsElement = document.querySelector('.search-items');

  itemsElement.querySelectorAll('.items').forEach((itemElement) => {
    if (itemElement.hasChildNodes()) {
      itemElement.innerHTML = '';
    }
  });
}
