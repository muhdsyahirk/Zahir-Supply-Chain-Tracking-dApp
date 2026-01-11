// CONSUMER TRACKING

const consumerBtn = document.getElementById("consumer-btn");
const consumer = document.querySelector(".consumer");

consumerBtn.addEventListener("click", async () => {
  // Check page type
  checkPageType();

  if (!isBatchPage || currentBatchId === null) {
    // Not on batch page - show instructions
    showConsumerInstructions();
  } else {
    // On batch page - load tracking
    await loadConsumerTracking(currentBatchId);
  }

  // Show consumer section
  consumer.style.display = "flex";
});

// Show instructions when not on batch page
function showConsumerInstructions() {
  const consumerContainer = document.querySelector(".consumer-container");
  if (consumerContainer) {
    consumerContainer.innerHTML = `
      <div class="consumer-instructions">
        <h2>🔍 Track Your Product</h2>
        <p>To view the complete supply chain journey:</p>
        <ol>
          <li>Scan the QR code on your product packaging</li>
          <li>You'll be automatically redirected to the tracking page</li>
        </ol>
        <p class="note">No QR code? Ask your retailer for the batch tracking information.</p>
      </div>
    `;
  }
}

// Load and display tracking for a batch
async function loadConsumerTracking(batchId) {
  const consumerContainer = document.querySelector(".consumer-container");

  if (!consumerContainer) return;

  // Show loading
  consumerContainer.innerHTML = `
    <div class="consumer-loading">
      <p>Loading batch tracking...</p>
    </div>
  `;

  try {
    // Fetch all flows
    const flows = await contract.methods.getAllFlows(batchId).call();

    if (!flows || flows.length === 0) {
      showConsumerError("No tracking information found for Batch #" + batchId);
      return;
    }

    // Fetch halal certification
    const halalInfo = await contract.methods
      .verifyHalalCertification(batchId)
      .call();

    // Clear container
    consumerContainer.innerHTML = "";

    // Add header
    const header = document.createElement("div");
    header.className = "consumer-header";
    header.innerHTML = `
      <h2>Batch #${batchId}</h2>
      <p>Complete Supply Chain Journey</p>
    `;
    consumerContainer.appendChild(header);

    // Display each flow as a block
    flows.forEach((flow, index) => {
      // Create flow block
      const block = createFlowBlock(flow, index);
      consumerContainer.appendChild(block);

      // Add chain connector (except after last block)
      if (index < flows.length - 1) {
        const chain = document.createElement("div");
        chain.className = "consumer-chain";
        consumerContainer.appendChild(chain);
      }
    });

    // Add halal certification if certified
    if (halalInfo.isHalalCertified) {
      // Add final chain connector
      const finalChain = document.createElement("div");
      finalChain.className = "consumer-chain";
      consumerContainer.appendChild(finalChain);

      // Add halal cert block
      const halalBlock = createHalalBlock(halalInfo);
      consumerContainer.appendChild(halalBlock);
    }
  } catch (error) {
    console.error("Error loading tracking:", error);
    showConsumerError(
      "Batch #" + batchId + " does not exist or cannot be loaded."
    );
  }
}

// Create a flow block
function createFlowBlock(flow, index) {
  const block = document.createElement("div");
  block.className = "consumer-block";

  // Get status name
  const statusName = getFlowStatusName(Number(flow.status));

  // Format timestamp
  const timestamp = Number(flow.timestamp);
  const date = new Date(timestamp * 1000);
  const formattedDate = date.toLocaleString();

  // Shorten address
  const address = flow.updatedBy;
  const shortAddress = address.substring(0, 6) + "..." + address.substring(38);

  block.innerHTML = `
    <div class="batch-status">
      <p>${statusName}</p>
    </div>
    <div class="block-details">
      <p><strong>Updated By:</strong></p>
      <p class="updated-by">${shortAddress}</p>
      
      <p><strong>Timestamp:</strong></p>
      <p class="timestamp">${formattedDate}</p>
      
      <p><strong>Location:</strong></p>
      <p class="location">${flow.location}</p>
      
      ${
        flow.content
          ? `
        <p><strong>Details:</strong></p>
        <p class="content">${flow.content}</p>
      `
          : ""
      }
    </div>
  `;

  return block;
}

// Create halal certification block
function createHalalBlock(halalInfo) {
  const block = document.createElement("div");
  block.className = "consumer-block consumer-halal";

  // Format slaughter date
  const slaughterTime = Number(halalInfo.slaughterTimestamp);
  const date = new Date(slaughterTime * 1000);
  const formattedDate = date.toLocaleString();

  // Shorten address
  const address = halalInfo.slaughtererAddress;
  const shortAddress = address.substring(0, 6) + "..." + address.substring(38);

  block.innerHTML = `
    <div class="batch-status halal-status">
      <p>✓ Halal Certified</p>
    </div>
    <div class="block-details">
      <p><strong>Certificate ID:</strong></p>
      <p class="cert-id">${halalInfo.certificateId}</p>
      
      <p><strong>Supervisor:</strong></p>
      <p class="supervisor">${halalInfo.supervisorName}</p>
      
      <p><strong>Certification Body:</strong></p>
      <p class="certifier">${halalInfo.certifierName}</p>
      
      <p><strong>Slaughterer:</strong></p>
      <p class="slaughterer">${shortAddress}</p>
      
      <p><strong>Slaughter Date:</strong></p>
      <p class="slaughter-date">${formattedDate}</p>
    </div>
  `;

  return block;
}

// Show error message
function showConsumerError(message) {
  const consumerContainer = document.querySelector(".consumer-container");
  if (consumerContainer) {
    consumerContainer.innerHTML = `
      <div class="consumer-error">
        <h3>⚠️ Error</h3>
        <p>${message}</p>
        <p><a href="${window.location.origin}${window.location.pathname}">← Go back to home</a></p>
      </div>
    `;
  }
}

// Get readable status name
function getFlowStatusName(status) {
  const names = {
    0: "Created by Farmer",
    1: "Slaughtered",
    2: "Distributed",
    3: "Retail Ready",
  };
  return names[status] || "Unknown";
}
