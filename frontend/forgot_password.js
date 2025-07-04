// Function to show the custom modal
function showModal(message) {
    const modal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.style.display = 'flex'; 
}


function closeModal() {
    const modal = document.getElementById('customModal');
    modal.style.display = 'none'; 
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

// Add event listener to close the modal when the close button is clicked
document.getElementById('closeModal').addEventListener('click', closeModal);

// Function to handle form submission
document.getElementById('forgotPasswordForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent the default form submission

    const username = document.getElementById('username').value;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/request-password-reset/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username
            }),
        });

        const result = await response.json();

        if (response.ok) {
            showModal(result.message || 'Password reset email sent. Please check your inbox.');
            document.getElementById('username').value = '';
        } else {
            showModal(result.error || 'Failed to process request');
        }
    } catch (error) {
        console.error('Error:', error);
        showModal('An error occurred while processing your request');
    }
});