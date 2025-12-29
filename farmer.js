// FARMER
function setupFarmerFunctionality(userAddress) {
  // If on batch page, disable creation
  if (isBatchPage) {
    disableFarmerBatchCreation();
    return;
  }
  // If farmer in batch page
  function disableFarmerBatchCreation() {
    const dashboardContentCreate = document.querySelector(
      ".dashboard-content-create"
    );
    const batchQR = document.querySelector(".batch-qr");
    dashboardContentCreate.style.display = "none";
    batchQR.style.display = "none";

    const dashboardContent = document.querySelector(".dashboard-content");
    if (dashboardContent && currentBatchId !== null) {
      dashboardContent.innerHTML += `
      <div class="batch-page-notice">
        <p>Viewing Batch #${currentBatchId}. To create a new batch, go to the <a href="${window.location.origin}">main page</a>.</p>
      </div>
    `;
    }
  }
  // If farmer not in batch page - setup batch creation form
  const createBatchForm = document.getElementById("createBatchForm");
  if (createBatchForm) {
    createBatchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await createBatch(userAddress);
    });
  }
}
// The actual create batch function
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

    // Get total batches BEFORE creating new one
    const totalBatchesBefore = await contract.methods.getTotalBatches().call();
    // Convert BigInt to Number
    const totalBatchesNum = Number(totalBatchesBefore);

    // Call the smart contract function
    await contract.methods
      .initialiseBatch(location, content)
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Transaction hash:", hash);
      })
      .on("receipt", async (receipt) => {
        console.log("Batch created!");

        // Get the new batch ID (it's the total batches before creation)
        const newBatchId = totalBatchesNum - 1; // Because batchID increments after creation

        alert(`Batch #${newBatchId} created successfully!`);

        // Clear form
        document.getElementById("batchLocation").value = "";
        document.getElementById("batchContent").value = "";

        // Update button
        button.textContent = "Create Batch";
        button.disabled = false;

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
  }
}
function showBatchQR(batchId) {
  const batchQR = document.querySelector(".batch-qr");
  const url = `${window.location.origin}?batch=${batchId}`;

  batchQR.innerHTML = `
  <p>Batch #${batchId}</p>
  <div id="realQrCode-${batchId}">QR HERE</div>
  <a href="${url}">${url}</a>
  `;

  generateQR(batchId, url);
}
function generateQR(batchId, url) {
  const qrContainer = document.getElementById(`realQrCode-${batchId}`);
  if (!qrContainer) return;

  // Clear container
  qrContainer.innerHTML = "";

  // Generate QR code
  QRCode.toCanvas(
    url,
    {
      width: 200,
      height: 200,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    },
    function (error, canvas) {
      if (error) {
        console.error("QR generation error:", error);
        qrContainer.innerHTML = `
          <p>QR Code Generation Failed</p>
      `;
      } else {
        qrContainer.appendChild(canvas);
      }
    }
  );
}
