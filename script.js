// ===============================
// LedgerLine - Part 3A.1
// ===============================

// DOM Elements
const form = document.getElementById("transactionForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");

const transactionList = document.getElementById("transactionList");
const searchInput = document.getElementById("search");
const themeBtn = document.getElementById("themeBtn");

// Load saved transactions
let transactions =
    JSON.parse(localStorage.getItem("ledgerline-transactions")) || [];

// Unique ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Save to Local Storage
function saveTransactions() {
    localStorage.setItem(
        "ledgerline-transactions",
        JSON.stringify(transactions)
    );
}

// Add Transaction
form.addEventListener("submit", function (e) {

    e.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value || new Date().toISOString().slice(0,10);

    if(title === "" || amount <= 0){

        alert("Please enter valid details.");

        return;
    }

    const transaction = {

        id: generateId(),
        title,
        amount,
        type,
        category,
        date

    };

    transactions.unshift(transaction);

    saveTransactions();

    renderTransactions(transactions);

    updateSummary();

    form.reset();

});

// Render Transactions
function renderTransactions(data){

    transactionList.innerHTML = "";

    if(data.length === 0){

        transactionList.innerHTML = `
        <div class="transaction">
            <div class="left">
                <div class="title">No Transactions Found</div>
            </div>
        </div>`;

        return;
    }

    data.forEach(item=>{

        const row = document.createElement("div");

        row.className = "transaction";

        row.innerHTML = `

        <div class="left">

            <div class="title">${item.title}</div>

            <div class="category">

                ${item.category} • ${item.date}

            </div>

        </div>

        <div class="right">

            <strong class="${item.type}">

                ${item.type==="income" ? "+" : "-"} ₹${item.amount}

            </strong>

            <button
                class="deleteBtn"
                onclick="deleteTransaction(${item.id})">

                <i class="fa-solid fa-trash"></i>

            </button>

        </div>

        `;

        transactionList.appendChild(row);

    });
  // ===============================
// LedgerLine - Part 3A.2
// Continue below Part 3A.1
// ===============================

// Delete Transaction
function deleteTransaction(id) {

    transactions = transactions.filter(item => item.id !== id);

    saveTransactions();

    renderTransactions(transactions);

    updateSummary();
}

// Update Dashboard Summary
function updateSummary() {

    let income = 0;
    let expense = 0;

    transactions.forEach(item => {

        if (item.type === "income") {

            income += item.amount;

        } else {

            expense += item.amount;

        }

    });

    const balance = income - expense;

    balanceEl.textContent = "₹" + balance.toLocaleString();

    incomeEl.textContent = "₹" + income.toLocaleString();

    expenseEl.textContent = "₹" + expense.toLocaleString();

}

// Dark Mode
const savedTheme = localStorage.getItem("ledgerline-theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark");

    themeBtn.innerHTML =
        '<i class="fa-solid fa-sun"></i>';

}

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {

        localStorage.setItem(
            "ledgerline-theme",
            "dark"
        );

        themeBtn.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

    } else {

        localStorage.setItem(
            "ledgerline-theme",
            "light"
        );

        themeBtn.innerHTML =
            '<i class="fa-solid fa-moon"></i>';

    }

});

// Initial Load
renderTransactions(transactions);

updateSummary();

}
