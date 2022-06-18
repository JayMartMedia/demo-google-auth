/* global window.accessToken, window.refreshToken */
const apiHost = "http://localhost:4401";


document.addEventListener("logged-in", (obj) => {
  const userInfo = obj.detail.userInfo;
  document.getElementById("user-id").innerText = userInfo.userId;
  document.getElementById("user-img").setAttribute('src', userInfo.picture);
});

// called when send_secure_request_btn is clicked
async function handleSendSecureRequestBtnClick() {
  try {
    const res = await window.auth.fetchAuth(`${apiHost}/secure`);
    console.log("response data", await res.json());
  } catch (e) {
    console.error(e);
  }
}
