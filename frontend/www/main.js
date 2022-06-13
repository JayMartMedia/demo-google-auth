function handleCredentialResponse(response) {
  console.log("Response", response);
  console.log("Encoded JWT ID token: " + response.credential);
  window.jwt = response.credential;
}

// setup listeners for google auth
window.onload = function () {
  google.accounts.id.initialize({
    client_id: "403706356522-9l5kmo3oujjk8ho182ec3kts8k96d935.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("google_login_btn"),
    { theme: "outline", size: "large" }  // customization attributes
  );
  google.accounts.id.prompt(); // also display the One Tap dialog
}

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
