
let transactions = [];
let myChart;

let db;
// create a new db request for a "BudgetDB" database.
const request = window.indexedDB.open('budgetDB', 1);

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return response.json();
  })
  .then(data => {
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
    // fetch failed, so save in indexed db
    saveRecord(transaction);

    // clear form
    nameEl.value = "";
    amountEl.value = "";
  });
}

// begin INDEXEDDB code
request.onupgradeneeded = function (event) {
  // create object store called "BudgetStore" and set autoIncrement to true]
  const db = event.target.result;

  const budgetStore = db.createObjectStore('BudgetStore', {autoIncrement: true});
};

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  // log error here
  console.log('error opening database' + event.target.errorCode);

};

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(['BudgetStore'], 'readwrite');
  // access your pending object store
  const objStore = transaction.objectStore('BudgetStore');
  // add record to your store with add method.
  objStore.add(record);

  transaction.oncomplete = function() {
    console.log('stored record!');
  }
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(['BudgetStore']);
  // access your pending object store
  const objStore = transaction.objectStore('BudgetStore');
  // get all records from store and set to a variable
  const getAll = objStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((response) => console.log(response))
        .then(() => {
          // if successful, open a transaction on your pending db
          const tx = db.transaction(['BudgetStore'], 'readwrite');
          // access your pending object store
          const store = tx.objectStore('BudgetStore');
          // clear all items in your store
          const clearStore = store.clear();
          clearStore();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
//END INDEXEDDB CODE


document.querySelector("#add-btn").onclick = function() {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function() {
  sendTransaction(false);
};
