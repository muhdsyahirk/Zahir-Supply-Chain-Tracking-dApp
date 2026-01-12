// RETAILER
function setupRetailerFunctionality(userAddress) {
  // Main page - show instructions
  if (!isBatchPage) {
    showRetailerInstructions();
    return;
  }

  // ------------------------------------
  // STAR - If in batch page, check status of distributor before
  checkBatchStatusForRetail(userAddress);
}

function showRetailerInstructions() {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="main-page-notice">
        <p>To mark a batch as retail ready, you need to:</p>
        <ol>
          <li>Get a QR code from a distributor</li>
          <li>Scan the QR code with your phone camera</li>
          <li>You'll be redirected to the batch page</li>
          <li>Fill the retailer form</li>
        </ol>
        <p class="note">⚠️ You can only mark each batch as retail ready once.</p>
      </div>
    `;
  }
}

// ------------------------------------
// STAR - If in batch page, check status of distributor before
async function checkBatchStatusForRetail(userAddress) {
  try {
    // **----------------------------------
    // STAR SOL - Calling getBatchStatus
    const batchInfo = await contract.methods
      .getBatchStatus(currentBatchId)
      .call();
    const status = Number(batchInfo.status);

    console.log("Batch status for retail:", status);

    if (status >= 3) {
      // Already retail ready
      showRetailerDisabledMessage(
        "This batch is already marked as retail ready."
      );
    } else if (status === 2) {
      // ------------------------------------
      // STAR - Retailer can then fill their form
      enableRetailerForms(userAddress);
    } else if (status === 1) {
      showRetailerDisabledMessage(
        "Batch is slaughtered but not distributed yet."
      );
    } else if (status === 0) {
      showRetailerDisabledMessage("Batch has not been slaughtered yet.");
    } else {
      showRetailerDisabledMessage("Batch is not ready for retail.");
    }
  } catch (error) {
    console.error("Error checking batch status:", error);
    showRetailerDisabledMessage("Error loading batch information.");
  }
}

// ------------------------------------
// STAR - Retailer can then fill their form
function enableRetailerForms(userAddress) {
  const dashboardContent = document.querySelector(".dashboard-content");

  // Add batch info header
  const batchInfoDiv = document.createElement("div");
  batchInfoDiv.className = "batch-info";
  batchInfoDiv.innerHTML = `
    <h4>Preparing Batch #${currentBatchId} for Retail</h4>
    <p>Status: Distributed ✓</p>
    <p class="warning">⚠️ Fill the form below and submit to mark this batch as retail ready.</p>
  `;
  dashboardContent.insertBefore(batchInfoDiv, dashboardContent.firstChild);

  // Setup form submit listener
  const retailerForm = document.getElementById("retailerForm");
  if (retailerForm) {
    retailerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // ------------------------------------
      // STAR - Retailer form
      await addRetailerFlow(userAddress);
    });
  }
}

function showRetailerDisabledMessage(message) {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="disabled-notice">
        <h4>Form Disabled</h4>
        <p>${message}</p>
        <p>Batch ID: #${currentBatchId}</p>
        <p><a href="${window.location.origin}${window.location.pathname}">← Back to main page</a></p>
      </div>
    `;
  }
}

// ------------------------------------
// STAR - Retailer form
async function addRetailerFlow(userAddress) {
  if (currentBatchId === null && currentBatchId !== 0) {
    alert("No batch ID found");
    return;
  }

  const location = document.getElementById("retailerLocation").value;
  const content = document.getElementById("retailerContent").value;

  if (!location) {
    alert("Please enter store location");
    return;
  }

  try {
    const button = document.querySelector("#retailerForm button");
    const originalText = button.textContent;
    button.textContent = "Processing...";
    button.disabled = true;

    // **----------------------------------
    // STAR SOL - Calling addRetailerFlow
    await contract.methods
      .addRetailerFlow(currentBatchId, location, content || "")
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Retail transaction hash:", hash);
      })
      .on("receipt", (receipt) => {
        console.log("Retail flow completed!");
        alert(`✅ Batch #${currentBatchId} is now ready for sale!`);

        // Show success message
        showRetailerDisabledMessage(
          "This batch is now marked as retail ready."
        );
      })
      .on("error", (error) => {
        console.error("Transaction error:", error);
        alert("Failed to mark batch as retail ready: " + error.message);
        button.textContent = originalText;
        button.disabled = false;
      });
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);

    const button = document.querySelector("#retailerForm button");
    if (button) {
      button.textContent = "Add Retailer Flow";
      button.disabled = false;
    }
  }
}
