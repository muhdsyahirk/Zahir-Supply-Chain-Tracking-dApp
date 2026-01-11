// // RETAILER
// function setupRetailerFunctionality(userAddress) {
//   // If retailer not in the batch page (home page)
//   if (!isBatchPage) {
//     console.log(!isBatchPage);
//     disableRetailerMainPage();
//     return;
//   }

//   function disableRetailerMainPage() {
//     const dashboardContentCreate = document.querySelector(
//       ".dashboard-content-create"
//     );
//     dashboardContentCreate.style.display = "none";

//     const dashboardContent = document.querySelector(".dashboard-content");
//     if (dashboardContent) {
//       dashboardContent.innerHTML = `
//       <div class="main-page-notice">
//         <p>To mark a batch as retail ready, you need to:</p>
//         <ol>
//           <li>Get a QR code from a distributor</li>
//           <li>Scan the QR code with your phone camera</li>
//           <li>You'll be redirected to the batch page</li>
//           <li>Fill the retailer form</li>
//         </ol>
//         <p class="note">Note: You can only mark each batch as retail ready once.</p>
//       </div>
//     `;
//     }
//   }

//   // If retailer is in the batch page, check status
//   checkBatchStatusForRetail(userAddress);
// }

// // Check if batch is ready for retail
// async function checkBatchStatusForRetail(userAddress) {
//   try {
//     // Get batch status
//     const batchInfo = await contract.methods
//       .getBatchStatus(currentBatchId)
//       .call();
//     const status = Number(batchInfo.status);

//     console.log("Batch status for retail:", status);

//     // Check if batch is already retail ready
//     if (status >= 3) {
//       // 3 = Retail Ready
//       disableRetailerForms("This batch is already marked as retail ready.");
//       return;
//     }

//     // Check if batch is distributed (status 2)
//     if (status === 2) {
//       // Ready for retail
//       enableRetailerForms(userAddress);
//     } else if (status === 1) {
//       disableRetailerForms("Batch is slaughtered but not distributed yet.");
//     } else if (status === 0) {
//       disableRetailerForms("Batch is not slaughtered yet.");
//     } else {
//       disableRetailerForms("Batch is not ready for retail.");
//     }
//   } catch (error) {
//     console.error("Error checking batch status:", error);
//     disableRetailerForms("Error loading batch information.");
//   }
// }

// // Enable forms and setup event listeners
// function enableRetailerForms(userAddress) {
//   const retailerForm = document.getElementById("retailerForm");

//   if (retailerForm) {
//     retailerForm.addEventListener("submit", async (event) => {
//       event.preventDefault();
//       await addRetailerFlow(userAddress);
//     });
//   }

//   // Show batch info
//   const dashboardContent = document.querySelector(".dashboard-content");
//   if (dashboardContent) {
//     const batchInfoDiv = document.createElement("div");
//     batchInfoDiv.className = "batch-info-retailer";
//     batchInfoDiv.innerHTML = `
//       <h4>Preparing Batch #${currentBatchId} for Retail</h4>
//       <p>Status: Distributed ✓</p>
//       <p class="warning">⚠️ You can only mark this batch as retail ready once.</p>
//     `;
//     dashboardContent.insertBefore(batchInfoDiv, dashboardContent.firstChild);
//   }
// }

// // Disable forms with message
// function disableRetailerForms(message) {
//   const retailerForm = document.getElementById("retailerForm");

//   // Disable all form inputs
//   const allForms = document.querySelectorAll(
//     "#retailerForm input, #retailerForm textarea, #retailerForm button"
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

// // Add retailer flow
// async function addRetailerFlow(userAddress) {
//   if (!currentBatchId && currentBatchId !== 0) {
//     alert("No batch ID found");
//     return;
//   }

//   const location = document.getElementById("retailerLocation").value;
//   const content = document.getElementById("retailerContent").value;

//   if (!location) {
//     alert("Please enter store location");
//     return;
//   }

//   try {
//     const button = document.querySelector("#retailerForm button");
//     const originalText = button.textContent;
//     button.textContent = "Processing...";
//     button.disabled = true;

//     // Call the retailer function
//     await contract.methods
//       .addRetailerFlow(currentBatchId, location, content || "")
//       .send({ from: userAddress })
//       .on("transactionHash", (hash) => {
//         console.log("Retail transaction hash:", hash);
//       })
//       .on("receipt", (receipt) => {
//         alert("✅ Retail flow added! Batch is now ready for sale.");
//         button.textContent = originalText;
//         button.disabled = false;

//         // Clear form
//         document.getElementById("retailerLocation").value = "";
//         document.getElementById("retailerContent").value = "";

//         // Update UI - disable forms since retail is done
//         disableRetailerForms("Batch marked as retail ready.");
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

// RETAILER
function setupRetailerFunctionality(userAddress) {
  // Main page - show instructions
  if (!isBatchPage) {
    showRetailerInstructions();
    return;
  }

  // Batch page - check status
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

async function checkBatchStatusForRetail(userAddress) {
  try {
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
      // Ready for retail
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

function enableRetailerForms(userAddress) {
  const dashboardContent = document.querySelector(".dashboard-content");

  // Add batch info header
  const batchInfoDiv = document.createElement("div");
  batchInfoDiv.className = "batch-info-slaughterer";
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
