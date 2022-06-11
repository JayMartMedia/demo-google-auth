// add onclick listener to button
window.addEventListener("load", () => {
  const btn = document.querySelectorAll("#send_secure_request_btn").item(0);
  btn.addEventListener("click", () => {
    handleSendSecureRequestBtnClick();
  })
})

// called when send_secure_request_btn is clicked
function handleSendSecureRequestBtnClick() {
  sendSecureRequest();
}

// use fetch to send request, and log response data
async function sendSecureRequest() {
  const apiHost = "http://localhost:4401";
  const res = await fetch(`${apiHost}/secure`, {
    headers: new Headers({
      "Authorization": window.jwt
    }),
  });
  console.log("response data", await res.json());
}
