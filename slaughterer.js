// // Slaughterer
// function setupSlaughtererFunctionality(userAddress) {
//   // If slaughterer not in the batch page (home page)
//   if (!isBatchPage) {
//     disableSlaughtererMainPage();
//     return;
//   }

//   function disableSlaughtererMainPage() {
//     const dashboardContent = document.querySelector(".dashboard-content");
//     if (dashboardContent) {
//       dashboardContent.innerHTML = `
//         <div class="main-page-notice">
//           <p>To process a batch, you need to:</p>
//           <ol>
//             <li>Get a QR code from a farmer</li>
//             <li>Scan the QR code with your phone camera</li>
//             <li>You'll be redirected to the batch page</li>
//             <li>Fill the slaughter and halal certification forms</li>
//           </ol>
//           <p class="note">Note: You can only process each batch once.</p>
//         </div>
//       `;
//     }
//   }

//   // If slaughterer is in the batch page, check status
//   checkBatchStatusForSlaughter(userAddress);
// }

// // Check if batch is ready for slaughter
// async function checkBatchStatusForSlaughter(userAddress) {
//   try {
//     // Get batch status
//     const batchInfo = await contract.methods
//       .getBatchStatus(currentBatchId)
//       .call();
//     const status = Number(batchInfo.status);

//     console.log(
//       "Batch status:",
//       status,
//       "isHalalCertified:",
//       batchInfo.isHalalCertified
//     );

//     // Check if batch is already slaughtered
//     if (status >= 1) {
//       // 1 = Slaughtered, 2 = Distributed, 3 = Retail Ready
//       disableSlaughtererForms(
//         "This batch has already been slaughtered and certified."
//       );
//       return;
//     }

//     // Check if batch is created (status 0) and ready for slaughter
//     if (status === 0) {
//       // 0 = Created
//       enableSlaughtererForms(userAddress);
//     } else {
//       disableSlaughtererForms("Batch is not ready for slaughter.");
//     }
//   } catch (error) {
//     console.error("Error checking batch status:", error);
//     disableSlaughtererForms("Error loading batch information.");
//   }
// }

// // Enable forms and setup event listeners
// function enableSlaughtererForms(userAddress) {
//   // Remove the individual form submissions
//   // Instead, add ONE submission button that handles both forms together

//   const dashboardContent = document.querySelector(".worker-dashboard");
//   if (dashboardContent) {
//     const dashboardTitle = dashboardContent.querySelector("p");
//     // Add batch info at the top
//     const batchInfoDiv = document.createElement("div");
//     batchInfoDiv.className = "batch-info-slaughterer";
//     batchInfoDiv.innerHTML = `
//       <h4>Processing Batch #${currentBatchId}</h4>
//       <p>Status: Created (Ready for Slaughter)</p>
//       <p class="warning">⚠️ Fill both forms below, then click Submit to process this batch.</p>
//     `;
//     // Insert after the title
//     if (dashboardTitle) {
//       dashboardTitle.insertAdjacentElement("afterend", batchInfoDiv);
//     } else {
//       // Fallback: insert as first child
//       dashboardContent.insertBefore(batchInfoDiv, dashboardContent.firstChild);
//     }
//   }

//   // Add a combined submit button at the bottom
//   const submitDiv = document.createElement("div");
//   submitDiv.className = "dashboard-content-btn";
//   submitDiv.innerHTML = `
//     <button id="submitSlaughterAndCertification" class="submit-btn-combined">
//       Submit Slaughter & Halal Certification
//     </button>
//   `;
//   dashboardContent.appendChild(submitDiv);

//   // Hide the individual submit buttons
//   const slaughterBtn = document.querySelector("#slaughterForm button");
//   const halalBtn = document.querySelector("#halalCertificateForm button");
//   if (slaughterBtn) slaughterBtn.style.display = "none";
//   if (halalBtn) halalBtn.style.display = "none";

//   // Add event listener to combined button
//   const combinedBtn = document.getElementById(
//     "submitSlaughterAndCertification"
//   );
//   if (combinedBtn) {
//     combinedBtn.addEventListener("click", async (event) => {
//       event.preventDefault();
//       await submitSlaughterAndCertification(userAddress);
//     });
//   }
// }

// // Disable forms with message
// function disableSlaughtererForms(message) {
//   const dashboardContent = document.querySelector(".dashboard-content");
//   if (dashboardContent) {
//     dashboardContent.innerHTML = `
//       <div class="disabled-notice">
//         <h4>Forms Disabled</h4>
//         <p>${message}</p>
//         ${isBatchPage ? `<p>Batch ID: ${currentBatchId}</p>` : ""}
//         <p><a href="${window.location.origin}">Go to main page</a></p>
//       </div>
//     `;
//   }
// }

// // Submit both slaughter flow AND halal certification together
// async function submitSlaughterAndCertification(userAddress) {
//   if (currentBatchId === null && currentBatchId !== 0) {
//     alert("No batch ID found");
//     return;
//   }

//   // Get slaughter flow values
//   const location = document.getElementById("slaughterLocation").value;
//   const content = document.getElementById("slaughterContent").value;

//   // Get halal certification values
//   const supervisorName = document.getElementById("supervisorName").value;
//   const halalBodyName = document.getElementById(
//     "halalCertificationBodyName"
//   ).value;
//   const certId = document.getElementById("halalCertificateId").value;
//   const timestampInput = document.getElementById("slaughtererTimestamp").value;

//   // Validate all required fields
//   if (!location) {
//     alert("Please enter slaughterhouse location");
//     return;
//   }

//   if (!supervisorName || !halalBodyName || !certId || !timestampInput) {
//     alert("Please fill in all halal certification fields");
//     return;
//   }

//   // Convert timestamp to Unix timestamp (seconds since epoch)
//   const timestamp = parseInt(timestampInput);
//   if (isNaN(timestamp) || timestamp <= 0) {
//     alert("Please enter a valid timestamp (Unix timestamp in seconds)");
//     return;
//   }

//   // Check if timestamp is not in the future
//   const currentTime = Math.floor(Date.now() / 1000);
//   if (timestamp > currentTime) {
//     alert("Slaughter timestamp cannot be in the future");
//     return;
//   }

//   try {
//     const button = document.getElementById("submitSlaughterAndCertification");
//     const originalText = button.textContent;
//     button.textContent = "Processing...";
//     button.disabled = true;

//     // Call the smart contract with ALL required fields
//     await contract.methods
//       .addSlaughterFlow(
//         currentBatchId,
//         location,
//         content || "No additional notes",
//         supervisorName,
//         halalBodyName,
//         certId,
//         timestamp
//       )
//       .send({ from: userAddress })
//       .on("transactionHash", (hash) => {
//         console.log("Transaction hash:", hash);
//       })
//       .on("receipt", (receipt) => {
//         console.log("Slaughter and certification completed!");
//         alert(
//           `✅ Batch #${currentBatchId} has been slaughtered and halal certified!`
//         );

//         // Clear all forms
//         document.getElementById("slaughterLocation").value = "";
//         document.getElementById("slaughterContent").value = "";
//         document.getElementById("supervisorName").value = "";
//         document.getElementById("halalCertificationBodyName").value = "";
//         document.getElementById("halalCertificateId").value = "";
//         document.getElementById("slaughtererTimestamp").value = "";

//         button.textContent = originalText;
//         button.disabled = false;

//         // Disable forms since batch is now processed
//         disableSlaughtererForms(
//           "This batch has been successfully slaughtered and halal certified."
//         );
//       })
//       .on("error", (error) => {
//         console.error("Transaction error:", error);
//         alert("Failed to process batch: " + error.message);
//         button.textContent = originalText;
//         button.disabled = false;
//       });
//   } catch (error) {
//     console.error("Error:", error);
//     alert("Error: " + error.message);

//     const button = document.getElementById("submitSlaughterAndCertification");
//     if (button) {
//       button.textContent = "Submit Slaughter & Halal Certification";
//       button.disabled = false;
//     }
//   }
// }

// SLAUGHTERER
function setupSlaughtererFunctionality(userAddress) {
  // Main page - show instructions
  if (!isBatchPage) {
    showSlaughtererInstructions();
    return;
  }

  // Batch page - check status
  checkBatchStatusForSlaughter(userAddress);
}

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

async function checkBatchStatusForSlaughter(userAddress) {
  try {
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
      // Ready to process
      enableSlaughtererForms(userAddress);
    } else {
      showSlaughtererDisabledMessage("Batch is not ready for slaughter.");
    }
  } catch (error) {
    console.error("Error checking batch status:", error);
    showSlaughtererDisabledMessage("Error loading batch information.");
  }
}

function enableSlaughtererForms(userAddress) {
  const dashboardContent = document.querySelector(".dashboard-content");

  // Add batch info header
  const batchInfoDiv = document.createElement("div");
  batchInfoDiv.className = "batch-info-slaughterer";
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
      await submitSlaughterAndCertification(userAddress);
    });
  }
}

function showSlaughtererDisabledMessage(message) {
  const dashboardContent = document.querySelector(".dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
      <div class="disabled-notice">
        <h4>Forms Disabled</h4>
        <p>${message}</p>
        <p>Batch ID: #${currentBatchId}</p>
        <p><a href="${window.location.origin}">← Back to main page</a></p>
      </div>
    `;
  }
}

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

  // Validate timestamp
  const timestamp = parseInt(timestampInput);
  if (isNaN(timestamp) || timestamp <= 0) {
    alert("Please enter a valid timestamp (Unix timestamp in seconds)");
    return;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (timestamp > currentTime) {
    alert("Slaughter timestamp cannot be in the future");
    return;
  }

  try {
    const button = document.getElementById("submitSlaughterAndCertification");
    const originalText = button.textContent;
    button.textContent = "Processing...";
    button.disabled = true;

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
        alert(
          `✅ Batch #${currentBatchId} has been slaughtered and halal certified!`
        );

        // Show success message
        showSlaughtererDisabledMessage(
          "This batch has been successfully slaughtered and halal certified."
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
