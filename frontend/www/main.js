/* global window.accessToken, window.refreshToken */
const apiHost = "http://localhost:4401";

// add onclick listener to button
window.addEventListener("load", () => {
  // setup secure request button
  const secure_request_btn = document.querySelectorAll("#send_secure_request_btn").item(0);
  secure_request_btn.addEventListener("click", () => {
    handleSendSecureRequestBtnClick();
  });

  // setup logout button
  const logout_btn = document.querySelectorAll("#logout_btn").item(0);
  logout_btn.addEventListener("click", () => {
    logout();
  });
})

// called when send_secure_request_btn is clicked
function handleSendSecureRequestBtnClick() {
  try{
    sendSecureRequest();
  }catch(e){
    console.error(e);
  }
}

// use fetch to send request, and log response data
async function sendSecureRequest() {
  const res = await fetchAuth(`${apiHost}/secure`);
  console.log("response data", await res.json());
}
