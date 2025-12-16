// Simple front-end logic for Construction Estimator & Invoice

// Tab handling
const tabButtons = document.querySelectorAll(".tab-button");
const tabs = document.querySelectorAll(".tab");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.tab;
    tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
    tabs.forEach((tab) => tab.classList.toggle("active", tab.id === id));
  });
});

// DOM elements for estimate
const materialsBody = document.getElementById("materialsBody");
const addMaterialBtn = document.getElementById("addMaterialBtn");
const chipButtons = document.querySelectorAll(".chip");
const syncInvoiceBtn = document.getElementById("syncInvoiceBtn");

const projectNameInput = document.getElementById("projectName");
const clientNameInput = document.getElementById("clientName");
const clientAddressInput = document.getElementById("clientAddress");
const projectLocationInput = document.getElementById("projectLocation");
const projectAreaInput = document.getElementById("projectArea");
const laborRateInput = document.getElementById("laborRate");
const laborDaysInput = document.getElementById("laborDays");
const markupPercentInput = document.getElementById("markupPercent");
const taxPercentInput = document.getElementById("taxPercent");

const materialSubtotalLabel = document.getElementById("materialSubtotalLabel");
const laborCostLabel = document.getElementById("laborCostLabel");
const markupLabel = document.getElementById("markupLabel");
const subtotalLabel = document.getElementById("subtotalLabel");
const taxLabel = document.getElementById("taxLabel");
const grandTotalLabel = document.getElementById("grandTotalLabel");

// DOM elements for invoice
const printInvoiceBtn = document.getElementById("printInvoiceBtn");
const invoiceNumberInput = document.getElementById("invoiceNumber");
const invoiceDateInput = document.getElementById("invoiceDate");
const invoiceDueDateInput = document.getElementById("invoiceDueDate");

const invoiceClientName = document.getElementById("invoiceClientName");
const invoiceClientAddress = document.getElementById("invoiceClientAddress");
const invoiceProjectName = document.getElementById("invoiceProjectName");
const invoiceProjectLocation = document.getElementById("invoiceProjectLocation");

const invoiceDescription = document.getElementById("invoiceDescription");
const invoiceTerms = document.getElementById("invoiceTerms");
const invoiceItemsBody = document.getElementById("invoiceItemsBody");

const invoiceMaterialSubtotal = document.getElementById("invoiceMaterialSubtotal");
const invoiceLabor = document.getElementById("invoiceLabor");
const invoiceMarkup = document.getElementById("invoiceMarkup");
const invoiceTax = document.getElementById("invoiceTax");
const invoiceTotal = document.getElementById("invoiceTotal");

// Quantity tab elements
const qtyBody = document.getElementById("qtyBody");
const qtyMaterialSubtotalLabel = document.getElementById("qtyMaterialSubtotalLabel");
const qtyLaborLabel = document.getElementById("qtyLaborLabel");
const qtyMarkupLabel = document.getElementById("qtyMarkupLabel");
const qtyTaxLabel = document.getElementById("qtyTaxLabel");
const qtyGrandTotalLabel = document.getElementById("qtyGrandTotalLabel");
const qtyRefreshBtn = document.getElementById("qtyRefreshBtn");
const qtyToInvoiceBtn = document.getElementById("qtyToInvoiceBtn");
const qtyPrintBtn = document.getElementById("qtyPrintBtn");

function formatMoney(value) {
  if (!isFinite(value)) return "₹0.00";
  return `₹${value.toFixed(2)}`;
}

function parseNumber(input) {
  if (!input) return 0;
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function createMaterialRow(initial) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>
      <input type="text" class="material-name-input" placeholder="Material / Description" value="${initial?.name ?? ""}">
    </td>
    <td>
      <input type="text" class="material-unit-input" placeholder="Unit" value="${initial?.unit ?? ""}">
    </td>
    <td>
      <input type="number" class="number-input material-qty-input" min="0" step="0.01" value="${
        initial?.qty ?? ""
      }">
    </td>
    <td>
      <input type="number" class="number-input material-unit-cost-input" min="0" step="0.01" value="${
        initial?.unitCost ?? ""
      }">
    </td>
    <td class="number-cell material-line-total">$0.00</td>
    <td>
      <button class="btn btn-small btn-danger remove-material-btn">X</button>
    </td>
  `;

  // hook events
  tr.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", recalcAll);
  });
  tr.querySelector(".remove-material-btn").addEventListener("click", () => {
    tr.remove();
    recalcAll();
  });

  materialsBody.appendChild(tr);
  recalcAll();
}

function estimateMaterialFromArea(type) {
  const area = parseNumber(projectAreaInput.value);
  if (area <= 0) return;

  // Very rough generic rules-of-thumb (for demonstration only, now based on sq ft)
  let name = "";
  let unit = "";
  let qty = 0;
  let unitCost = "";

  switch (type) {
    case "brick":
      name = "Bricks / Blocks (approx.)";
      unit = "pcs";
      qty = Math.round(area * 4.7); // ~4.7 pcs per sq ft wall, extremely rough
      break;
    case "cement":
      name = "Cement Bags (approx.)";
      unit = "bag";
      qty = Math.round(area * 0.056 * 10) / 10; // fake factor per sq ft
      break;
    case "steel":
      name = "Reinforcement Steel (approx.)";
      unit = "ton";
      qty = Math.round(area * 0.0019 * 100) / 100; // fake factor per sq ft
      break;
    case "paint":
      name = "Paint (approx.)";
      unit = "L";
      qty = Math.round(area * 0.023 * 10) / 10; // fake factor per sq ft
      break;
  }

  createMaterialRow({ name, unit, qty, unitCost });
}

function getMaterialLines() {
  const rows = Array.from(materialsBody.querySelectorAll("tr"));
  return rows.map((tr) => {
    const name = tr.querySelector(".material-name-input").value.trim();
    const unit = tr.querySelector(".material-unit-input").value.trim();
    const qty = parseNumber(tr.querySelector(".material-qty-input").value);
    const unitCost = parseNumber(tr.querySelector(".material-unit-cost-input").value);
    const lineTotal = qty * unitCost;

    // update UI cell
    const cell = tr.querySelector(".material-line-total");
    cell.textContent = formatMoney(lineTotal);

    return { name, unit, qty, unitCost, lineTotal };
  });
}

function recalcAll() {
  const materials = getMaterialLines();
  const materialSubtotal = materials.reduce((sum, m) => sum + (isFinite(m.lineTotal) ? m.lineTotal : 0), 0);

  const laborRate = parseNumber(laborRateInput.value);
  const laborDays = parseNumber(laborDaysInput.value);
  const laborCost = laborRate * laborDays;

  const markupPercent = parseNumber(markupPercentInput.value);
  const taxPercent = parseNumber(taxPercentInput.value);

  const baseSubtotal = materialSubtotal + laborCost;
  const markup = (baseSubtotal * markupPercent) / 100;
  const subtotalBeforeTax = baseSubtotal + markup;
  const tax = (subtotalBeforeTax * taxPercent) / 100;
  const grandTotal = subtotalBeforeTax + tax;

  materialSubtotalLabel.textContent = formatMoney(materialSubtotal);
  laborCostLabel.textContent = formatMoney(laborCost);
  markupLabel.textContent = formatMoney(markup);
  subtotalLabel.textContent = formatMoney(subtotalBeforeTax);
  taxLabel.textContent = formatMoney(tax);
  grandTotalLabel.textContent = formatMoney(grandTotal);
}

// Sync to Quantity & Price tab (read-only BOQ-style view)
function syncToQuantityTab() {
  if (!qtyBody) return;
  const materials = getMaterialLines();
  qtyBody.innerHTML = "";

  materials.forEach((m) => {
    if (!m.name && m.lineTotal === 0) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name || "-"}</td>
      <td>${m.unit || ""}</td>
      <td class="number-cell">${m.qty || ""}</td>
      <td class="number-cell">${m.unitCost ? formatMoney(m.unitCost).replace("₹", "") : ""}</td>
      <td class="number-cell">${formatMoney(m.lineTotal)}</td>
    `;
    qtyBody.appendChild(tr);
  });

  if (qtyMaterialSubtotalLabel) qtyMaterialSubtotalLabel.textContent = materialSubtotalLabel.textContent;
  if (qtyLaborLabel) qtyLaborLabel.textContent = laborCostLabel.textContent;
  if (qtyMarkupLabel) qtyMarkupLabel.textContent = markupLabel.textContent;
  if (qtyTaxLabel) qtyTaxLabel.textContent = taxLabel.textContent;
  if (qtyGrandTotalLabel) qtyGrandTotalLabel.textContent = grandTotalLabel.textContent;
}

// Sync data from estimate to invoice
function syncToInvoice() {
  const materials = getMaterialLines();

  // Project / client
  invoiceClientName.textContent = clientNameInput.value || "Client Name";
  invoiceClientAddress.textContent = clientAddressInput.value || "Client address";
  invoiceProjectName.textContent = projectNameInput.value || "Project Name";
  invoiceProjectLocation.textContent = projectLocationInput.value || "Project location";

  // Invoice lines
  invoiceItemsBody.innerHTML = "";
  materials.forEach((m) => {
    if (!m.name && m.lineTotal === 0) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name || "-"}</td>
      <td class="number-cell">${m.qty || ""}</td>
      <td class="number-cell">${m.unitCost ? formatMoney(m.unitCost) : ""}</td>
      <td class="number-cell">${formatMoney(m.lineTotal)}</td>
    `;
    invoiceItemsBody.appendChild(tr);
  });

  const materialSubtotal = parseNumber(materialSubtotalLabel.textContent.replace(/[^0-9.-]/g, ""));
  const laborCost = parseNumber(laborCostLabel.textContent.replace(/[^0-9.-]/g, ""));
  const markup = parseNumber(markupLabel.textContent.replace(/[^0-9.-]/g, ""));
  const tax = parseNumber(taxLabel.textContent.replace(/[^0-9.-]/g, ""));
  const total = parseNumber(grandTotalLabel.textContent.replace(/[^0-9.-]/g, ""));

  invoiceMaterialSubtotal.textContent = formatMoney(materialSubtotal);
  invoiceLabor.textContent = formatMoney(laborCost);
  invoiceMarkup.textContent = formatMoney(markup);
  invoiceTax.textContent = formatMoney(tax);
  invoiceTotal.textContent = formatMoney(total);

  // switch to invoice tab
  const invoiceTabButton = Array.from(tabButtons).find((b) => b.dataset.tab === "invoiceTab");
  if (invoiceTabButton) invoiceTabButton.click();
}

// Listeners
addMaterialBtn.addEventListener("click", () => createMaterialRow());

chipButtons.forEach((chip) => {
  chip.addEventListener("click", () => {
    const type = chip.dataset.type;
    estimateMaterialFromArea(type);
  });
});

[
  projectAreaInput,
  laborRateInput,
  laborDaysInput,
  markupPercentInput,
  taxPercentInput,
].forEach((input) => {
  input.addEventListener("input", recalcAll);
});

syncInvoiceBtn.addEventListener("click", syncToInvoice);

printInvoiceBtn.addEventListener("click", () => {
  window.print();
});

// Aurora material library: add template items into main materials table
document.querySelectorAll(".material-template").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.name || "";
    const unit = btn.dataset.unit || "";
    createMaterialRow({ name, unit });
    // Switch to Estimate tab so user sees the item added
    const estimateTabButton = Array.from(tabButtons).find((b) => b.dataset.tab === "estimateTab");
    if (estimateTabButton) estimateTabButton.click();
  });
});

// Quantity tab actions
if (qtyRefreshBtn) {
  qtyRefreshBtn.addEventListener("click", () => {
    syncToQuantityTab();
    const qtyTabButton = Array.from(tabButtons).find((b) => b.dataset.tab === "quantityTab");
    if (qtyTabButton) qtyTabButton.classList.add("active");
  });
}

if (qtyToInvoiceBtn) {
  qtyToInvoiceBtn.addEventListener("click", () => {
    syncToInvoice();
    const invoiceTabButton = Array.from(tabButtons).find((b) => b.dataset.tab === "invoiceTab");
    if (invoiceTabButton) invoiceTabButton.click();
  });
}

if (qtyPrintBtn) {
  qtyPrintBtn.addEventListener("click", () => {
    window.print();
  });
}

// Default invoice dates
function initDates() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  invoiceDateInput.value = `${yyyy}-${mm}-${dd}`;

  const due = new Date(today);
  due.setDate(due.getDate() + 7);
  const dyyyy = due.getFullYear();
  const dmm = String(due.getMonth() + 1).padStart(2, "0");
  const ddd = String(due.getDate()).padStart(2, "0");
  invoiceDueDateInput.value = `${dyyyy}-${dmm}-${ddd}`;
}

// Initialize with one empty material row
createMaterialRow();
initDates();
recalcAll();


