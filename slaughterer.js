// SLAUGHTERER
function setupSlaughtererFunctionality(userAddress) {
  // Main page - show instructions
  if (!isBatchPage) {
    showSlaughtererInstructions();
    return;
  }

  // ------------------------------------
  // STAR - If in batch page, check status of farmer before
  checkBatchStatusForSlaughter(userAddress);
}

// If in main page
function showSlaughtererInstructions() {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="main-page-notice">
        <p>To process a batch, you need to:</p>
        <ol>
          <li>Get a QR code from a farmer</li>
          <li>Scan the QR code with your phone camera</li>
          <li>You'll be redirected to the batch page</li>
          <li>Fill the slaughter and halal certification forms</li>
        </ol>
        <p class="note">⚠️ You can only process each batch once.</p>
      </div>
    `;
  }
}

// ------------------------------------
// STAR - If in batch page, check status of farmer before
async function checkBatchStatusForSlaughter(userAddress) {
  try {
    // **----------------------------------
    // STAR SOL - Calling getBatchStatus
    const batchInfo = await contract.methods
      .getBatchStatus(currentBatchId)
      .call();
    const status = Number(batchInfo.status);

    console.log(
      "Batch status:",
      status,
      "isHalalCertified:",
      batchInfo.isHalalCertified
    );

    if (status >= 1) {
      // Already processed
      showSlaughtererDisabledMessage(
        "This batch has already been slaughtered and halal certified."
      );
    } else if (status === 0) {
      // ------------------------------------
      // STAR - Slaughterer can then fill their form
      enableSlaughtererForms(userAddress);
    } else {
      showSlaughtererDisabledMessage("Batch is not ready for slaughter.");
    }
  } catch (error) {
    console.error("Error checking batch status:", error);
    showSlaughtererDisabledMessage("Error loading batch information.");
  }
}

// ------------------------------------
// STAR - Slaughterer can then fill their form
function enableSlaughtererForms(userAddress) {
  const dashboardContent = document.querySelector(".dashboard-content");

  // Add batch info header
  const batchInfoDiv = document.createElement("div");
  batchInfoDiv.className = "batch-info";
  batchInfoDiv.innerHTML = `
    <h4>Processing Batch #${currentBatchId}</h4>
    <p>Status: Created (Ready for Slaughter)</p>
    <p class="warning">⚠️ Fill both forms below, then click Submit to process this batch.</p>
  `;
  dashboardContent.insertBefore(batchInfoDiv, dashboardContent.firstChild);

  // Add submit button at bottom
  const submitDiv = document.createElement("div");
  submitDiv.className = "dashboard-content-btn";
  submitDiv.innerHTML = `
    <button id="submitSlaughterAndCertification">
      Submit Slaughter & Halal Certification
    </button>
  `;
  dashboardContent.appendChild(submitDiv);

  // Setup event listener
  const submitBtn = document.getElementById("submitSlaughterAndCertification");
  if (submitBtn) {
    submitBtn.addEventListener("click", async (event) => {
      event.preventDefault();

      // ------------------------------------
      // STAR - Slaughterer form
      await submitSlaughterAndCertification(userAddress);
    });
  }
}

async function showSlaughtererDisabledMessage(message) {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (!dashboardContent) return;

  let etherscanLink = "";

  // If batch was already processed, try to get the transaction hash
  if (
    message.includes("slaughtered and halal certified") &&
    currentBatchId !== null
  ) {
    try {
      // Get past events for this specific batch
      const events = await contract.getPastEvents("HalalCertified", {
        filter: { batchId: currentBatchId },
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
      <h4>Forms Disabled</h4>
      <p>${message}</p>
      <p>Batch ID: #${currentBatchId}</p>
      ${etherscanLink}
      <p><a href="${window.location.origin}${window.location.pathname}">← Back to main page</a></p>
    </div>
  `;
}
function showSlaughtererDisabledMessageWithTx(message, txHash) {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="disabled-notice">
        <h4>Forms Disabled</h4>
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
// STAR - Slaughterer form
async function submitSlaughterAndCertification(userAddress) {
  if (currentBatchId === null && currentBatchId !== 0) {
    alert("No batch ID found");
    return;
  }

  // Get all form values
  const location = document.getElementById("slaughterLocation").value;
  const content = document.getElementById("slaughterContent").value;
  const supervisorName = document.getElementById("supervisorName").value;
  const halalBodyName = document.getElementById(
    "halalCertificationBodyName"
  ).value;
  const certId = document.getElementById("halalCertificateId").value;
  const timestampInput = document.getElementById("slaughtererTimestamp").value;

  // Validate required fields
  if (!location) {
    alert("Please enter slaughterhouse location");
    return;
  }

  if (!supervisorName || !halalBodyName || !certId || !timestampInput) {
    alert("Please fill in all halal certification fields");
    return;
  }

  // Convert datetime-local to Unix timestamp
  const selectedDate = new Date(timestampInput);
  const timestamp = Math.floor(selectedDate.getTime() / 1000);

  if (isNaN(timestamp) || timestamp <= 0) {
    alert("Please select a valid date and time");
    return;
  }

  // Check if timestamp is not in the future
  const currentTime = Math.floor(Date.now() / 1000);
  if (timestamp > currentTime) {
    alert("Slaughter date cannot be in the future");
    return;
  }

  try {
    const button = document.getElementById("submitSlaughterAndCertification");
    const originalText = button.textContent;
    button.textContent = "Processing...";
    button.disabled = true;

    // **----------------------------------
    // STAR SOL - Calling addSlaughterFlow
    await contract.methods
      .addSlaughterFlow(
        currentBatchId,
        location,
        content || "No additional notes",
        supervisorName,
        halalBodyName,
        certId,
        timestamp
      )
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Transaction hash:", hash);
      })
      .on("receipt", (receipt) => {
        console.log("Slaughter and certification completed!");
        const txHash = receipt.transactionHash;
        alert(
          `✅ Batch #${currentBatchId} has been slaughtered and halal certified!`
        );

        // Show success message with transaction hash
        showSlaughtererDisabledMessageWithTx(
          "This batch has been successfully slaughtered and halal certified.",
          txHash
        );
      })
      .on("error", (error) => {
        console.error("Transaction error:", error);
        alert("Failed to process batch: " + error.message);
        button.textContent = originalText;
        button.disabled = false;
      });
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);

    const button = document.getElementById("submitSlaughterAndCertification");
    if (button) {
      button.textContent = "Submit Slaughter & Halal Certification";
      button.disabled = false;
    }
  }
}
