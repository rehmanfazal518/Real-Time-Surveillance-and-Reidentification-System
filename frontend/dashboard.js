function toggleFullScreen(cameraId) {
  const fullscreenContainer = document.getElementById("fullscreen-video");
  const fullscreenVideoSource = document.getElementById(
    "fullscreen-video-source"
  );
  const currentImg = document.getElementById(cameraId).querySelector("img");

  fullscreenContainer.style.display = "flex";
  fullscreenVideoSource.src = currentImg.src;
}

function closeFullScreen() {
  const fullscreenContainer = document.getElementById("fullscreen-video");
  fullscreenContainer.style.display = "none";
}

function showModal(message) {
  const modal = document.getElementById("customModal");
  const modalMessage = document.getElementById("modalMessage");
  modalMessage.textContent = message;
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("customModal");
  modal.style.display = "none";
}
document.getElementById("closeModal").addEventListener("click", closeModal);

async function logoutUser() {
  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch("http://127.0.0.1:8000/api/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();

    if (response.ok) {
      showModal(result.message);
      localStorage.removeItem("authToken");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    } else {
      showModal(result.error || "Logout failed");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    }
  } catch (error) {
    console.error("Logout Error:", error);
    showModal("An error occurred during logout");
  }
}

// --- Rename Modal Logic ---
function openRenameModal() {
  document.getElementById("renameModal").style.display = "flex";
}

function closeRenameModal() {
  document.getElementById("renameModal").style.display = "none";
}

document
  .getElementById("closeRenameModal")
  .addEventListener("click", closeRenameModal);

async function submitRename() {
  const pid = document.getElementById("renamePid").value;
  const name = document.getElementById("renameName").value;
  const parent = document.getElementById("renameParent").value;

  if (!pid || !name || !parent) {
    showModal("Please enter ID, name, and parent identifier.");
    return;
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parent);
  const payload = {
    pid: parseInt(pid),
    name,
    ...(isEmail ? { parent_email: parent } : { parent_username: parent }),
  };

  try {
    const response = await fetch("http://127.0.0.1:8000/api/reid/rename-id/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (response.ok) {
      showModal(result.message || "Name updated!");
      closeRenameModal();
    } else {
      showModal(result.error || "Rename failed.");
    }
  } catch (error) {
    console.error("Rename Error:", error);
    showModal("Rename request failed.");
  }
}

function startActivityLogStream() {
  const eventSource = new EventSource(
    "http://127.0.0.1:8000/api/reid/activity-stream/"
  );
  const logList = document.getElementById("activityLog");

  eventSource.onmessage = function (event) {
    try {
      const log = JSON.parse(event.data);

      // Skip irrelevant logs for staff
    if (["gallery_saved", "gallery_loaded"].includes(log.type)) return;

      const li = document.createElement("li");
      li.textContent = `[${log.timestamp}] ${log.type.toUpperCase()}: ${
        log.message
      }`;
      logList.prepend(li);

      if (log.type === "disappearance") {
        showModal(`⚠️ ALERT: ${log.message}`);
        const audio = new Audio("alert.mp3");
        audio.play().catch((e) => console.warn("Audio play blocked:", e));
      }
    } catch (err) {
      console.error("Invalid log entry:", err);
    }
  };

  eventSource.onerror = function () {
    console.warn("Activity log stream disconnected");
    eventSource.close();
  };
}

startActivityLogStream();

function openProfileModal() {
  // Fetch current user data and populate the profile modal
  const token = localStorage.getItem("authToken");

  fetch("http://127.0.0.1:8000/api/current_user/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.user) {
        document.getElementById("profileUsername").textContent =
          data.user.username;
        document.getElementById("profileEmail").textContent = data.user.email;
        document.getElementById("profileMobile").textContent =
          data.user.mobile_number || "N/A";
        document.getElementById("profileCnic").textContent =
          data.user.cnic || "N/A";
        document.getElementById("profileAddress").textContent =
          data.user.current_address || "N/A";
        document.getElementById("profileRole").textContent =
          data.user.role || "N/A";

        document.getElementById("profileModal").style.display = "flex";
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
      showModal("Error loading profile data");
    });
}

function switchTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.style.display = "none";
  });

  // Show selected tab content
  document.getElementById(tabId).style.display = "block";

  // Update active tab button
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");
}

async function changePassword(event) {
  event.preventDefault();

  const form = document.getElementById("passwordChangeForm");
  const currentPassword = document
    .getElementById("currentPassword")
    .value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const confirmPassword = document
    .getElementById("confirmPassword")
    .value.trim();

  // Password format: at least 8 chars, letters and numbers
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  // Validate fields
  if (!currentPassword || !newPassword || !confirmPassword) {
    showModal("All password fields are required.");
    return;
  }

  if (!passwordRegex.test(newPassword)) {
    showModal(
      "New password must be at least 8 characters long and include both letters and numbers."
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    showModal("New password and confirmation do not match.");
    return;
  }

  if (newPassword === currentPassword) {
    showModal("New password must be different from the current password.");
    return;
  }

  // Submit request
  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch("http://127.0.0.1:8000/api/change_password/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showModal(result.message || "Password changed successfully");
      form.reset();
    } else {
      showModal(result.error || "Password change failed");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    showModal("An error occurred. Please try again.");
  }
}

document.getElementById("closeProfileModal").addEventListener("click", () => {
  document.getElementById("profileModal").style.display = "none";
});
