// // DISTRIBUTOR
// function setupDistributorFunctionality(userAddress) {
//   // If distributor not in the batch page (home page)
//   if (!isBatchPage) {
//     console.log(!isBatchPage);
//     disableDistributorMainPage();
//     return;
//   }

//   function disableDistributorMainPage() {
//     const dashboardContentCreate = document.querySelector(
//       ".dashboard-content-create"
//     );
//     dashboardContentCreate.style.display = "none";

//     const dashboardContent = document.querySelector(".dashboard-content");
//     if (dashboardContent) {
//       dashboardContent.innerHTML = `
//       <div class="main-page-notice">
//         <p>To distribute a batch, you need to:</p>
//         <ol>
//           <li>Get a QR code from a slaughterer</li>
//           <li>Scan the QR code with your phone camera</li>
//           <li>You'll be redirected to the batch page</li>
//           <li>Fill the distribution form</li>
//         </ol>
//         <p class="note">Note: You can only distribute each batch once.</p>
//       </div>
//     `;
//     }
//   }

//   // If distributor is in the batch page, check status
//   checkBatchStatusForDistribution(userAddress);
// }

// // Check if batch is ready for distribution
// async function checkBatchStatusForDistribution(userAddress) {
//   try {
//     // Get batch status
//     const batchInfo = await contract.methods
//       .getBatchStatus(currentBatchId)
//       .call();
//     const status = Number(batchInfo.status);
//     const isHalalCertified = batchInfo.isHalalCertified;

//     console.log(
//       "Batch status for distribution:",
//       status,
//       "isHalalCertified:",
//       isHalalCertified
//     );

//     // Check if batch is already distributed
//     if (status >= 2) {
//       // 2 = Distributed, 3 = Retail Ready
//       disableDistributorForms("This batch has already been distributed.");
//       return;
//     }

//     // Check if batch is slaughtered (status 1) and halal certified
//     if (status === 1 && isHalalCertified) {
//       // Ready for distribution
//       enableDistributorForms(userAddress);
//     } else if (status === 1 && !isHalalCertified) {
//       disableDistributorForms("Batch is slaughtered but not halal certified.");
//     } else if (status === 0) {
//       disableDistributorForms("Batch is not slaughtered yet.");
//     } else {
//       disableDistributorForms("Batch is not ready for distribution.");
//     }
//   } catch (error) {
//     console.error("Error checking batch status:", error);
//     disableDistributorForms("Error loading batch information.");
//   }
// }

// // Enable forms and setup event listeners
// function enableDistributorForms(userAddress) {
//   const distributorForm = document.getElementById("distributorForm");

//   if (distributorForm) {
//     distributorForm.addEventListener("submit", async (event) => {
//       event.preventDefault();
//       await addDistributorFlow(userAddress);
//     });
//   }

//   // Show batch info
//   const dashboardContent = document.querySelector(".dashboard-content");
//   if (dashboardContent) {
//     const batchInfoDiv = document.createElement("div");
//     batchInfoDiv.className = "batch-info-distributor";
//     batchInfoDiv.innerHTML = `
//       <h4>Distributing Batch #${currentBatchId}</h4>
//       <p>Status: Slaughtered & Halal Certified ✓</p>
//       <p class="warning">⚠️ You can only distribute this batch once.</p>
//     `;
//     dashboardContent.insertBefore(batchInfoDiv, dashboardContent.firstChild);
//   }
// }

// // Disable forms with message
// function disableDistributorForms(message) {
//   const distributorForm = document.getElementById("distributorForm");

//   // Disable all form inputs
//   const allForms = document.querySelectorAll(
//     "#distributorForm input, #distributorForm textarea, #distributorForm button"
//   );
//   allForms.forEach((input) => {
//     input.disabled = true;
//   });

//   // Add disabled message
//   const dashboardContent = document.querySelector(".dashboard-content");
//   if (dashboardContent) {
//     // Clear existing content and show message
//     dashboardContent.innerHTML = `
//       <div class="disabled-notice">
//         <h4>Form Disabled</h4>
//         <p>${message}</p>
//         ${isBatchPage ? `<p>Batch ID: ${currentBatchId}</p>` : ""}
//       </div>
//     `;
//   }
// }

// // Add distributor flow
// async function addDistributorFlow(userAddress) {
//   if (!currentBatchId && currentBatchId !== 0) {
//     alert("No batch ID found");
//     return;
//   }

//   const location = document.getElementById("distributorLocation").value;
//   const content = document.getElementById("distributorContent").value;

//   if (!location) {
//     alert("Please enter current location");
//     return;
//   }

//   try {
//     const button = document.querySelector("#distributorForm button");
//     const originalText = button.textContent;
//     button.textContent = "Processing...";
//     button.disabled = true;

//     // Call the distributor function
//     await contract.methods
//       .addDistributorFlow(currentBatchId, location, content || "")
//       .send({ from: userAddress })
//       .on("transactionHash", (hash) => {
//         console.log("Distribution transaction hash:", hash);
//       })
//       .on("receipt", (receipt) => {
//         alert("✅ Distribution flow added!");
//         button.textContent = originalText;
//         button.disabled = false;

//         // Clear form
//         document.getElementById("distributorLocation").value = "";
//         document.getElementById("distributorContent").value = "";

//         // Update UI - disable forms since distribution is done
//         disableDistributorForms("Distribution process completed.");
//       })
//       .on("error", (error) => {
//         alert("Error: " + error.message);
//         button.textContent = originalText;
//         button.disabled = false;
//       });
//   } catch (error) {
//     alert("Error: " + error.message);
//   }
// }

// DISTRIBUTOR
function setupDistributorFunctionality(userAddress) {
  // Main page - show instructions
  if (!isBatchPage) {
    showDistributorInstructions();
    return;
  }

  // Batch page - check status
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

async function checkBatchStatusForDistribution(userAddress) {
  try {
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
      // Ready for distribution
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

function enableDistributorForms(userAddress) {
  const dashboardContent = document.querySelector(".dashboard-content");

  // Add batch info header
  const batchInfoDiv = document.createElement("div");
  batchInfoDiv.className = "batch-info-slaughterer";
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
      await addDistributorFlow(userAddress);
    });
  }
}

function showDistributorDisabledMessage(message) {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="disabled-notice">
        <h4>Form Disabled</h4>
        <p>${message}</p>
        <p>Batch ID: #${currentBatchId}</p>
        <p><a href="${window.location.origin}">← Back to main page</a></p>
      </div>
    `;
  }
}

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

    await contract.methods
      .addDistributorFlow(currentBatchId, location, content || "")
      .send({ from: userAddress })
      .on("transactionHash", (hash) => {
        console.log("Distribution transaction hash:", hash);
      })
      .on("receipt", (receipt) => {
        console.log("Distribution completed!");
        alert(`✅ Batch #${currentBatchId} has been distributed!`);

        // Show success message
        showDistributorDisabledMessage(
          "This batch has been successfully distributed."
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
