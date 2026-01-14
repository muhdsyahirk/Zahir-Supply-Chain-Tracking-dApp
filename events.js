// BLOCKCHAIN EVENTS LISTENER
let eventSubscriptions = [];

// Start listening to events when page loads
async function initializeEventListeners() {
  if (!contract) {
    console.error("Contract not initialized");
    return;
  }

  try {
    // ------------------------------------
    // STAR - Get past events first (last 100 blocks)
    await loadPastEvents();

    // ------------------------------------
    // STAR - Then listen for new events in real-time
    listenToNewEvents();
  } catch (error) {
    console.error("Error initializing event listeners:", error);
  }
}

// ------------------------------------
// STAR - Load past events to show recent activity
async function loadPastEvents() {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  try {
    // Get current block number
    const currentBlock = await web3.eth.getBlockNumber();
    const fromBlock = Math.max(0, Number(currentBlock) - 100); // Last 100 blocks

    // Get all past events
    const batchCreatedEvents = await contract.getPastEvents("BatchCreated", {
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const batchUpdatedEvents = await contract.getPastEvents("BatchUpdated", {
      fromBlock: fromBlock,
      toBlock: "latest",
    });

    const halalCertifiedEvents = await contract.getPastEvents(
      "HalalCertified",
      {
        fromBlock: fromBlock,
        toBlock: "latest",
      }
    );

    // Combine all events
    const allEvents = [
      ...batchCreatedEvents.map((e) => ({ ...e, type: "BatchCreated" })),
      ...batchUpdatedEvents.map((e) => ({ ...e, type: "BatchUpdated" })),
      ...halalCertifiedEvents.map((e) => ({ ...e, type: "HalalCertified" })),
    ];

    // Sort by block number (most recent first)
    allEvents.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

    // Display events
    if (allEvents.length === 0) {
      activityList.innerHTML = `
        <div class="no-activities">
          <p>No recent activities found. Create a batch to get started!</p>
        </div>
      `;
    } else {
      activityList.innerHTML = "";
      // Show only last 10 events
      allEvents.slice(0, 10).forEach((event) => {
        displayEvent(event);
      });
    }
  } catch (error) {
    console.error("Error loading past events:", error);
    activityList.innerHTML = `
      <div class="no-activities">
        <p>Unable to load recent activities. Please refresh the page.</p>
      </div>
    `;
  }
}

// Listen for new events in real-time
function listenToNewEvents() {
  try {
    // BatchCreated event
    contract.events
      .BatchCreated({
        fromBlock: "latest",
      })
      .on("connected", (subscriptionId) => {
        console.log("BatchCreated listener connected:", subscriptionId);
      })
      .on("data", (event) => {
        console.log("New BatchCreated event:", event);
        displayEvent({ ...event, type: "BatchCreated" }, true);
      })
      .on("error", (error) => {
        console.error("BatchCreated error:", error);
      });

    // BatchUpdated event
    contract.events
      .BatchUpdated({
        fromBlock: "latest",
      })
      .on("connected", (subscriptionId) => {
        console.log("BatchUpdated listener connected:", subscriptionId);
      })
      .on("data", (event) => {
        console.log("New BatchUpdated event:", event);
        displayEvent({ ...event, type: "BatchUpdated" }, true);
      })
      .on("error", (error) => {
        console.error("BatchUpdated error:", error);
      });

    // HalalCertified event
    contract.events
      .HalalCertified({
        fromBlock: "latest",
      })
      .on("connected", (subscriptionId) => {
        console.log("HalalCertified listener connected:", subscriptionId);
      })
      .on("data", (event) => {
        console.log("New HalalCertified event:", event);
        displayEvent({ ...event, type: "HalalCertified" }, true);
      })
      .on("error", (error) => {
        console.error("HalalCertified error:", error);
      });

    console.log("All event listeners initialized successfully!");
  } catch (error) {
    console.error("Error setting up event listeners:", error);
  }
}

// Display an event in the activity feed
function displayEvent(event, isNew = false) {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  // Remove "no activities" message if it exists
  const noActivities = activityList.querySelector(".no-activities");
  if (noActivities) {
    noActivities.remove();
  }

  const { type, returnValues, blockNumber } = event;
  let icon, message, batchId;

  switch (type) {
    case "BatchCreated":
      icon = "🆕";
      batchId = returnValues.batchId;
      message = `New batch created by farmer`;
      break;

    case "BatchUpdated":
      icon = getStatusIcon(returnValues.newStatus);
      batchId = returnValues.batchId;
      message = getStatusMessage(returnValues.newStatus);
      break;

    case "HalalCertified":
      icon = "✅";
      batchId = returnValues.batchId;
      message = `Halal certified by ${returnValues.certifierName}`;
      break;

    default:
      return;
  }

  const activityItem = document.createElement("div");
  activityItem.className = "activity-item";
  if (isNew) {
    activityItem.style.animation = "slideIn 0.5s ease-out";
  }

  activityItem.innerHTML = `
    <div class="activity-icon">${icon}</div>
    <div class="activity-content">
      <div class="activity-message">${message}</div>
      <div class="activity-time">Block #${blockNumber}</div>
    </div>
    <div class="activity-batch">Batch #${batchId}</div>
  `;

  // Add to top of list
  activityList.insertBefore(activityItem, activityList.firstChild);

  // Keep only last 10 items
  const items = activityList.querySelectorAll(".activity-item");
  if (items.length > 10) {
    items[items.length - 1].remove();
  }
}

// Helper: Get icon for status
function getStatusIcon(status) {
  const icons = {
    1: "🔪", // Slaughtered
    2: "📦", // Distributed
    3: "🏪", // Retail Ready
  };
  return icons[status] || "📝";
}

// Helper: Get message for status
function getStatusMessage(status) {
  const messages = {
    1: "Batch slaughtered and processed",
    2: "Batch distributed to retail",
    3: "Batch ready for sale at retail",
  };
  return messages[status] || "Batch updated";
}

// Add slide-in animation
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

// Cleanup subscriptions when page unloads
window.addEventListener("beforeunload", () => {
  eventSubscriptions.forEach((sub) => {
    if (sub && sub.unsubscribe) {
      sub.unsubscribe();
    }
  });
});
