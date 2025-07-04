// Function to handle user selection (Admin or Staff)
function selectUser(userType) {
  document.getElementById("admin").classList.remove("selected");
  document.getElementById("staff").classList.remove("selected");

  if (userType === "Admin") {
    document.getElementById("admin").classList.add("selected");
  } else {
    document.getElementById("staff").classList.add("selected");
  }
}

// Function to show the custom modal
function showModal(message) {
  const modal = document.getElementById("customModal");
  const modalMessage = document.getElementById("modalMessage");
  modalMessage.textContent = message;
  modal.style.display = "flex"; // Show the modal using flex
}

// Function to close the custom modal
function closeModal() {
  const modal = document.getElementById("customModal");
  modal.style.display = "none"; // Hide the modal
  setTimeout(() => {
    document.getElementById("username").focus(); // Refocus on the input field
  }, 100);
}

// Add event listener to close the modal when the close button is clicked
document.getElementById("closeModal").addEventListener("click", closeModal);

// Function to handle form submission
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const selectedUserType = document.querySelector(
      ".user-option.selected p"
    ).textContent;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          role: selectedUserType,
        }),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        localStorage.setItem("authToken", result.token);

        showModal(result.message);
        setTimeout(() => {
          window.location.href = result.redirect_url;
        }, 1000);
      } else {
        showModal(result.error || "Login failed");
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        setTimeout(() => {
          document.getElementById("username").focus();
        }, 100);
      }
    } catch (error) {
      console.error("Login error:", error);
      showModal("An error occurred while logging in");
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
      setTimeout(() => {
        document.getElementById("username").focus();
      }, 100);
    }
  });

// Ensure the default user type is selected on page load
window.onload = function () {
  selectUser("Staff");
};
