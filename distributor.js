// DISTRIBUTOR
function setupDistributorFunctionality(userAddress) {
  // Main page - show instructions
  if (!isBatchPage) {
    showDistributorInstructions();
    return;
  }

  // ------------------------------------
  // STAR - If in batch page, check status of slaughterer before
  checkBatchStatusForDistribution(userAddress);
}

function showDistributorInstructions() {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="main-page-notice">
        <p>To distribute a batch, you need to:</p>
        <ol>
          <li>Get a QR code from a slaughterer</li>
          <li>Scan the QR code with your phone camera</li>
          <li>You'll be redirected to the batch page</li>
          <li>Fill the distribution form</li>
        </ol>
        <p class="note">⚠️ You can only distribute each batch once.</p>
      </div>
    `;
  }
}

// ------------------------------------
// STAR - If in batch page, check status of slaughterer before
async function checkBatchStatusForDistribution(userAddress) {
  try {
    // **----------------------------------
    // STAR SOL - Calling getBatchStatus
    const batchInfo = await contract.methods
      .getBatchStatus(currentBatchId)
      .call();
    const status = Number(batchInfo.status);
    const isHalalCertified = batchInfo.isHalalCertified;

    console.log(
      "Batch status for distribution:",
      status,
      "isHalalCertified:",
      isHalalCertified
    );

    if (status >= 2) {
      // Already distributed
      showDistributorDisabledMessage(
        "This batch has already been distributed."
      );
    } else if (status === 1 && isHalalCertified) {
      // ------------------------------------
      // STAR - Distributor can then fill their form
      enableDistributorForms(userAddress);
    } else if (status === 1 && !isHalalCertified) {
      showDistributorDisabledMessage(
        "Batch is slaughtered but not halal certified."
      );
    } else if (status === 0) {
      showDistributorDisabledMessage("Batch has not been slaughtered yet.");
    } else {
      showDistributorDisabledMessage("Batch is not ready for distribution.");
    }
  } catch (error) {
    console.error("Error checking batch status:", error);
    showDistributorDisabledMessage("Error loading batch information.");
  }
}

// ------------------------------------
// STAR - Distributor can then fill their form
function enableDistributorForms(userAddress) {
  const dashboardContent = document.querySelector(".dashboard-content");

  // Add batch info header
  const batchInfoDiv = document.createElement("div");
  batchInfoDiv.className = "batch-info";
  batchInfoDiv.innerHTML = `
    <h4>Distributing Batch #${currentBatchId}</h4>
    <p>Status: Slaughtered & Halal Certified ✓</p>
    <p class="warning">⚠️ Fill the form below and submit to mark this batch as distributed.</p>
  `;
  dashboardContent.insertBefore(batchInfoDiv, dashboardContent.firstChild);

  // Setup form submit listener
  const distributorForm = document.getElementById("distributorForm");
  if (distributorForm) {
    distributorForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // ------------------------------------
      // STAR - Distributor form
      await addDistributorFlow(userAddress);
    });
  }
}

async function showDistributorDisabledMessage(message) {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (!dashboardContent) return;

  let etherscanLink = "";

  // If batch was distributed, get transaction hash
  if (message.includes("distributed") && currentBatchId !== null) {
    try {
      const events = await contract.getPastEvents("BatchUpdated", {
        filter: { batchId: currentBatchId, newStatus: 2 }, // 2 = Distributed
        fromBlock: 0,
        toBlock: "latest",
      });

      if (events.length > 0) {
        const txHash = events[0].transactionHash;
        etherscanLink = `
          <p><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">
            🔍 View transaction on Etherscan
          </a></p>
        `;
      }
    } catch (error) {
      console.error("Error fetching transaction hash:", error);
    }
  }

  dashboardContent.innerHTML = `
    <div class="disabled-notice">
      <h4>Form Disabled</h4>
      <p>${message}</p>
      <p>Batch ID: #${currentBatchId}</p>
      ${etherscanLink}
      <p><a href="${window.location.origin}${window.location.pathname}">← Back to main page</a></p>
    </div>
  `;
}
function showDistributorDisabledMessageWithTx(message, txHash) {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="disabled-notice">
        <h4>Form Disabled</h4>
        <p>${message}</p>
        <p>Batch ID: #${currentBatchId}</p>
        <p><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">
          🔍 View transaction on Etherscan
        </a></p>
        <p><a href="${window.location.origin}${window.location.pathname}">← Back to main page</a></p>
      </div>
    `;
  }
}

// ------------------------------------
// STAR - Distributor form
async function addDistributorFlow(userAddress) {
  if (currentBatchId === null && currentBatchId !== 0) {
    alert("No batch ID found");
    return;
  }

  const location = document.getElementById("distributorLocation").value;
  const content = document.getElementById("distributorContent").value;

  if (!location) {
    alert("Please enter current location");
    return;
  }

  try {
    const button = document.querySelector("#distributorForm button");
    const originalText = button.textContent;
    button.textContent = "Processing...";
    button.disabled = true;

    // **----------------------------------
    // STAR SOL - Calling addDistributorFlow
    await contract.methods
      .addDistributorFlow(currentBatchId, location, content || "")
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Distribution transaction hash:", hash);
      })
      .on("receipt", (receipt) => {
        console.log("Distribution completed!");
        const txHash = receipt.transactionHash;
        alert(`✅ Batch #${currentBatchId} has been distributed!`);

        // Show success message with tx hash
        showDistributorDisabledMessageWithTx(
          "This batch has been successfully distributed.",
          txHash
        );
      })
      .on("error", (error) => {
        console.error("Transaction error:", error);
        alert("Failed to distribute batch: " + error.message);
        button.textContent = originalText;
        button.disabled = false;
      });
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);

    const button = document.querySelector("#distributorForm button");
    if (button) {
      button.textContent = "Add Distributor Flow";
      button.disabled = false;
    }
  }
}
