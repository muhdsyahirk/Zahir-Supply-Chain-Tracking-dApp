// FARMER
async function setupFarmerFunctionality(userAddress) {
  // If on batch page, disable creation
  if (isBatchPage) {
    await disableFarmerBatchCreation();
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
  async function disableFarmerBatchCreation() {
    const dashboardContentCreate = document.querySelector(
      ".dashboard-content-create"
    );
    const batchQR = document.querySelector(".batch-qr");

    if (dashboardContentCreate) dashboardContentCreate.style.display = "none";
    if (batchQR) batchQR.style.display = "none";

    const dashboardContent = document.querySelector(".dashboard-content");
    if (dashboardContent && currentBatchId !== null) {
      let etherscanLink = "";

      // Try to get the transaction hash for this batch creation
      try {
        const events = await contract.getPastEvents("BatchCreated", {
          filter: { batchId: currentBatchId },
          fromBlock: 0,
          toBlock: "latest",
        });

        if (events.length > 0) {
          const txHash = events[0].transactionHash;
          etherscanLink = `
          <p><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">
            🔍 View batch creation on Etherscan
          </a></p>
        `;
        }
      } catch (error) {
        console.error("Error fetching batch creation transaction:", error);
      }

      dashboardContent.innerHTML += `
      <div class="batch-page-notice">
        <p>Viewing Batch #${currentBatchId}. To create a new batch, go to the <a href="${window.location.origin}${window.location.pathname}">main page</a>.</p>
        ${etherscanLink}
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
    <button id="printQR-${batchId}" class="print-qr-btn">🖨️ Print QR Code</button>
  `;

  // ------------------------------------
  // STAR - Generate QR code
  generateQR(batchId, url);

  // ------------------------------------
  // STAR - Add print functionality
  const printBtn = document.getElementById(`printQR-${batchId}`);
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      printQRCode(batchId, url);
    });
  }
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

// ------------------------------------
// STAR - Print QR code
function printQRCode(batchId, url) {
  // Create a new window for printing
  const printWindow = window.open("", "_blank", "width=600,height=700");

  if (!printWindow) {
    alert("Please allow pop-ups to print the QR code");
    return;
  }

  // Get the QR code canvas
  const qrCanvas = document.querySelector(`#realQrCode-${batchId} canvas`);

  if (!qrCanvas) {
    alert("QR code not generated yet. Please wait and try again.");
    return;
  }

  // Convert canvas to image
  const qrImage = qrCanvas.toDataURL("image/png");

  // Create print content
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print QR Code - Batch #${batchId}</title>
      <style>
        body {
          font-family: "Times New Roman", Times, serif;
          text-align: center;
          padding: 40px;
          margin: 0;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 10px;
        }
        .batch-id {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 30px;
        }
        .qr-container {
          margin: 30px auto;
        }
        .qr-container img {
          border: 2px solid #000;
          padding: 20px;
          background: white;
        }
        .url {
          font-size: 14px;
          word-break: break-all;
          margin-top: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        .instructions {
          margin-top: 30px;
          font-size: 16px;
          text-align: left;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        @media print {
          body {
            padding: 20px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>Zahir Supply Chain Tracking</h1>
      <div class="batch-id">Batch #${batchId}</div>
      
      <div class="qr-container">
        <img src="${qrImage}" alt="QR Code for Batch ${batchId}">
      </div>
      
      <div class="url">
        ${url}
      </div>
      
      <div class="instructions">
        <h3>Instructions:</h3>
        <ol>
          <li>Scan this QR to add the flow or track the supply chain</li>
          <li>Or visit the URL above in your browser</li>
          <li>Keep this with your product documentation</li>
        </ol>
      </div>
      
      <script>
        // Auto print when loaded
        window.onload = function() {
          window.print();
        };
        
        // Close window after printing or canceling
        window.onafterprint = function() {
          setTimeout(function() {
            window.close();
          }, 100);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
