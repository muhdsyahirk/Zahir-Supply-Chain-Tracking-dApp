// FARMER
function setupFarmerFunctionality(userAddress) {
  // If on batch page, disable creation
  if (isBatchPage) {
    disableFarmerBatchCreation();
    return;
  }

  // ------------------------------------
  // STAR - If farmer not in batch page - setup batch creation form
  const createBatchForm = document.getElementById("createBatchForm");
  if (createBatchForm) {
    // Submit form
    createBatchForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // ------------------------------------
      // STAR - setup batch creation form
      await createBatch(userAddress);
    });
  }

  // ------------------------------------
  // STAR - If farmer in batch page, disable creation form
  function disableFarmerBatchCreation() {
    const dashboardContentCreate = document.querySelector(
      ".dashboard-content-create"
    );
    const batchQR = document.querySelector(".batch-qr");

    if (dashboardContentCreate) dashboardContentCreate.style.display = "none";
    if (batchQR) batchQR.style.display = "none";

    const dashboardContent = document.querySelector(".dashboard-content");
    if (dashboardContent && currentBatchId !== null) {
      dashboardContent.innerHTML += `
        <div class="batch-page-notice">
          <p>Viewing Batch #${currentBatchId}. To create a new batch, go to the <a href="${window.location.origin}${window.location.pathname}">main page</a>.</p>
        </div>
      `;
    }
  }
}

// ------------------------------------
// STAR - The actual create batch function
async function createBatch(userAddress) {
  const location = document.getElementById("batchLocation").value;
  const content = document.getElementById("batchContent").value;

  if (!location || !content) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const button = document.querySelector("#createBatchForm button");
    button.textContent = "Creating...";
    button.disabled = true;

    // **----------------------------------
    // STAR SOL - Get total batches BEFORE creating new one
    const totalBatchesBefore = await contract.methods.getTotalBatches().call();
    const totalBatchesNum = Number(totalBatchesBefore);

    // The new batch will have ID = current batchID value (before increment)
    const newBatchId = totalBatchesNum;

    // **----------------------------------
    // STAR SOL - Call the smart contract function for initialising the batch
    await contract.methods
      .initialiseBatch(location, content)
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Transaction hash:", hash);
      })
      .on("receipt", async (receipt) => {
        console.log("Batch created!");
        alert(`✅ Batch #${newBatchId} created successfully!`);

        // Clear form
        document.getElementById("batchLocation").value = "";
        document.getElementById("batchContent").value = "";

        // Update button
        button.textContent = "Create Batch";
        button.disabled = false;

        // ------------------------------------
        // STAR - Show QR code
        showBatchQR(newBatchId);
      })
      .on("error", (error) => {
        console.error("Error creating batch:", error);
        alert("Failed to create batch: " + error.message);
        button.textContent = "Create Batch";
        button.disabled = false;
      });
  } catch (error) {
    console.error("Error:", error);
    alert("Error: " + error.message);

    // Reset button
    const button = document.querySelector("#createBatchForm button");
    if (button) {
      button.textContent = "Create Batch";
      button.disabled = false;
    }
  }
}

// ------------------------------------
// STAR - Show QR code
function showBatchQR(batchId) {
  const batchQR = document.querySelector(".batch-qr");
  if (!batchQR) return;

  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}?batch=${batchId}`;

  batchQR.innerHTML = `
    <p>Batch #${batchId}</p>
    <div id="realQrCode-${batchId}">QR HERE</div>
    <a href="${url}" target="_blank">${url}</a>
  `;

  // ------------------------------------
  // STAR - Generate QR code
  generateQR(batchId, url);
}

// ------------------------------------
// STAR - Generate QR code
function generateQR(batchId, url) {
  const qrContainer = document.getElementById(`realQrCode-${batchId}`);
  if (!qrContainer) return;

  // Clear container
  qrContainer.innerHTML = "";

  // Check if QRCode library is loaded
  if (typeof QRCode === "undefined") {
    console.error("QRCode library not loaded");
    qrContainer.innerHTML = `<p>QR Code library not loaded. Please refresh the page.</p>`;
    return;
  }

  try {
    // Generate QR code using constructor method
    new QRCode(qrContainer, {
      text: url,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    qrContainer.innerHTML = `<p>QR Code Generation Failed</p>`;
  }
}
