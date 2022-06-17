/* global window.accessToken, window.refreshToken, window.accessExp, apiHost*/
function signIn(name, picture){
  // hide google login button
  document.querySelector("#google_login_btn").classList.add("hide");
  // show login button
  document.querySelector("#logout_btn").classList.remove("hide");
  // show user-card
  document.querySelector("#user-card").classList.remove("hide");
  // show user details
  if(name) {
    document.querySelector('#user-id').innerHTML = name;
  }
  if(picture) {
    document.querySelector('#user-img').setAttribute("src", picture);
  }
}

function logout(){
  window.accessToken = null;
  window.refreshToken = null;
  document.querySelector("#google_login_btn").classList.remove("hide");
  document.querySelector("#logout_btn").classList.add("hide");
  document.querySelector("#user-card").classList.add("hide");
  document.querySelector("#user-card").classList.add("hide");
  document.querySelector('#user-img').setAttribute("src", "");
  document.querySelector('#user-id').innerHTML = "";
  google.accounts.id.prompt();
}

// setup listeners for google auth
function handleCredentialResponse(response) {
  const googleJwt = response.credential;
  getInternalTokens(googleJwt);
  const payload = extractPayload(googleJwt);
  signIn(payload.name, payload.picture);
}

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

// wrap fetch and pass authorization header on request
// do not use for external requests because that could give them an access token
async function fetchAuth(url, options){
  await refreshAccessTokenIfNeeded();
  if(!options || !options.headers){
    options = {
      ...options,
      headers: new Headers({
        "Authorization": window.accessToken
      }),
    }
  }else if(!options.headers["Authorization"]){
    options.headers.append("Authorization", window.accessToken);
  }
  return fetch(url, options);
}

// auth flow
async function getInternalTokens(_googleJwt) {
  const res = await fetch(`${apiHost}/token`, {
    method: "POST",
    body: JSON.stringify({
      googleJwt: _googleJwt
    }),
    headers: new Headers({
      "Content-Type": "application/json"
    }),
  });
  const json = await res.json();
  window.accessToken = json.accessToken;
  window.refreshToken = json.refreshToken;
  setClientAccessTokenExpireTime(json.accessToken);
}

async function refreshTokens() {
  const res = await fetch(`${apiHost}/refresh`, {
    method: "POST",
    body: JSON.stringify({
      refreshToken: window.refreshToken
    }),
    headers: new Headers({
      "Content-Type": "application/json"
    }),
  });
  const json = await res.json();
  window.accessToken = json.accessToken;
  window.refreshToken = json.refreshToken;
  setClientAccessTokenExpireTime(json.accessToken);
}

async function setClientAccessTokenExpireTime(_accessToken) {
  const payload = extractPayload(_accessToken);
  window.accessTokenExpiry = payload.exp;
}

// return true if access token expiry time is before the current time
function isAccessTokenExpired() {
  const currentTimeInSeconds = Math.floor(Date.now()/1000);
  // check if accessToken will be expired in 5 seconds into the future
  return window.accessTokenExpiry < currentTimeInSeconds + 5;
}

async function refreshAccessTokenIfNeeded() {
  if(isAccessTokenExpired()){
    await refreshTokens()
  }
}

function extractPayload(jwt) {
  const tokens = jwt.split(".");
  // this atob may not work for decoding jwt?
  const unencoded = atob(tokens[1]);
  const payload = JSON.parse(unencoded);
  return payload;
}