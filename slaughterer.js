// Slaughterer
function setupSlaughtererFunctionality(userAddress) {
  // If slaughterer not in the batch page (home page)
  if (!isBatchPage) {
    disableSlaughtererMainPage();
    return;
  }
  function disableSlaughtererMainPage() {
    const dashboardContentCreate = document.querySelector(
      ".dashboard-content-create"
    );
    dashboardContentCreate.style.display = "none";

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
        <p class="note">Note: You can only process each batch once.</p>
      </div>
    `;
    }
  }

  // If slaughterer is in the batch page, check status
  checkBatchStatusForSlaughter(userAddress);
}

// Check if batch is ready for slaughter
async function checkBatchStatusForSlaughter(userAddress) {
  try {
    // Get batch status
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

    // Check if batch is already slaughtered
    if (status >= 1) {
      // 1 = Slaughtered, 2 = Distributed, 3 = Retail Ready
      disableSlaughtererForms("This batch has already been slaughtered.");
      return;
    }

    // Check if batch is created (status 0) and ready for slaughter
    if (status === 0) {
      // 0 = Created
      enableSlaughtererForms(userAddress);
    } else {
      disableSlaughtererForms("Batch is not ready for slaughter.");
    }
  } catch (error) {
    console.error("Error checking batch status:", error);
    disableSlaughtererForms("Error loading batch information.");
  }
}
// Enable forms and setup event listeners
function enableSlaughtererForms(userAddress) {
  const slaughterForm = document.getElementById("slaughterForm");
  const halalForm = document.getElementById("halalCertificateForm");

  if (slaughterForm) {
    slaughterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await addSlaughterFlow(userAddress);
    });
  }

  if (halalForm) {
    halalForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await addHalalCertification(userAddress);
    });
  }
  // Show batch info
  // const dashboardContent = document.querySelector(".dashboard-content");
  // if (dashboardContent) {
  //   const batchInfoDiv = document.createElement("div");
  //   batchInfoDiv.className = "batch-info-slaughterer";
  //   batchInfoDiv.innerHTML = `
  //     <h4>Processing Batch #${currentBatchId}</h4>
  //     <p>Status: Created (Ready for Slaughter)</p>
  //     <p class="warning">⚠️ You can only submit these forms once per batch.</p>
  //   `;
  //   dashboardContent.insertBefore(batchInfoDiv, dashboardContent.firstChild);
  // }
}
// Disable forms with message
function disableSlaughtererForms(message) {
  const slaughterForm = document.getElementById("slaughterForm");
  const halalForm = document.getElementById("halalCertificateForm");

  // Disable all form inputs
  const allForms = document.querySelectorAll(
    "#slaughterForm input, #slaughterForm textarea, #slaughterForm button, #halalCertificateForm input, #halalCertificateForm button"
  );
  allForms.forEach((input) => {
    input.disabled = true;
  });

  // Add disabled message
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    if (dashboardContent) {
      dashboardContent.innerHTML = `
      <div class="disabled-notice">
        <h4>Forms Disabled</h4>
        <p>${message}</p>
        ${isBatchPage ? `<p>Batch ID: ${currentBatchId}</p>` : ""}
      </div>
    `;
      dashboardContent.insertBefore(disabledMsg, dashboardContent.firstChild);
    }
  }
}

// Add slaughter flow (without halal certification)
async function addSlaughterFlow(userAddress) {
  if (!currentBatchId && currentBatchId !== 0) {
    alert("No batch ID found");
    return;
  }

  const location = document.getElementById("slaughterLocation").value;
  const content = document.getElementById("slaughterContent").value;

  if (!location) {
    alert("Please enter slaughterhouse location");
    return;
  }

  try {
    const button = document.querySelector("#slaughterForm button");
    const originalText = button.textContent;
    button.textContent = "Processing...";
    button.disabled = true;

    // Call the slaughter function WITHOUT halal certification
    await contract.methods
      .addSlaughterFlow(
        currentBatchId,
        location,
        content || "",
        "", // supervisorName (empty for now)
        "", // halalCertificationBodyName (empty for now)
        "", // halalCertificateId (empty for now)
        0 // slaughterTimestamp (0 for now)
      )
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Slaughter transaction hash:", hash);
      })
      .on("receipt", (receipt) => {
        alert("✅ Slaughter flow added!");
        button.textContent = originalText;
        button.disabled = false;

        // Clear form
        document.getElementById("slaughterLocation").value = "";
        document.getElementById("slaughterContent").value = "";

        // Update UI - disable forms since slaughter is done
        disableSlaughtererForms(
          "Slaughter process completed. You can now add halal certification."
        );
      })
      .on("error", (error) => {
        alert("Error: " + error.message);
        button.textContent = originalText;
        button.disabled = false;
      });
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Add halal certification
async function addHalalCertification(userAddress) {
  if (!currentBatchId && currentBatchId !== 0) {
    alert("No batch ID found");
    return;
  }

  const supervisorName = document.getElementById("supervisorName").value;
  const halalCertificationBodyName = document.getElementById(
    "halalCertificationBodyName"
  ).value;
  const halalCertificateId =
    document.getElementById("halalCertificateId").value;
  const slaughtererTimestamp = document.getElementById(
    "slaughtererTimestamp"
  ).value;

  // Validate all fields
  if (
    !supervisorName ||
    !halalCertificationBodyName ||
    !halalCertificateId ||
    !slaughtererTimestamp
  ) {
    alert("Please fill in all halal certification fields");
    return;
  }

  // Convert timestamp to number
  const timestamp = parseInt(slaughtererTimestamp);
  if (isNaN(timestamp) || timestamp <= 0) {
    alert("Please enter a valid timestamp (numbers only)");
    return;
  }

  try {
    const button = document.querySelector("#halalCertificateForm button");
    const originalText = button.textContent;
    button.textContent = "Certifying...";
    button.disabled = true;

    // We need to check batch status first
    const batchInfo = await contract.methods
      .getBatchStatus(currentBatchId)
      .call();
    const status = Number(batchInfo.status);

    // If batch is not slaughtered yet, we need to do both slaughter and certification
    if (status === 0) {
      // Not slaughtered yet
      alert(
        "Please complete slaughter flow first before adding halal certification."
      );
      button.textContent = originalText;
      button.disabled = false;
      return;
    }

    // For now, we'll just alert that this needs to be combined with slaughter flow
    alert(
      "Note: Halal certification should be added along with slaughter flow. Please use the 'Add Slaughterer Flow' form for complete processing."
    );
    button.textContent = originalText;
    button.disabled = false;
  } catch (error) {
    alert("Error: " + error.message);
  }
}
