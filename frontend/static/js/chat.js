function send() {
  let msg = document.getElementById("msg").value;

  fetch("/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({message: msg})
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("chat").innerHTML +=
      "<p><b>Kamu:</b> " + msg + "</p>" +
      "<p><b>Bot:</b> " + data.reply + "</p>";
  });
}
