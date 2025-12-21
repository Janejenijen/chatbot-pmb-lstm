const API_URL = "http://localhost:8000";

async function send() {
  const input = document.getElementById("msg");
  const msg = input.value.trim();
  
  if (!msg) return;
  
  // Clear input
  input.value = "";
  
  // Show user message
  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML += `<p><b>Kamu:</b> ${msg}</p>`;
  
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({message: msg})
    });
    
    const data = await response.json();
    chatDiv.innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;
    
    // Auto scroll to bottom
    chatDiv.scrollTop = chatDiv.scrollHeight;
  } catch (error) {
    chatDiv.innerHTML += `<p><b>Bot:</b> <em>Maaf, terjadi kesalahan koneksi.</em></p>`;
  }
}

// Allow sending with Enter key
document.addEventListener("DOMContentLoaded", function() {
  const input = document.getElementById("msg");
  if (input) {
    input.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        send();
      }
    });
  }
});
