/* global window.accessToken, window.refreshToken, window.accessExp, apiHost*/

// setup listeners for google auth
function handleCredentialResponse(response) {
  const googleJwt = response.credential;
  getInternalTokens(googleJwt);
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
  console.log('logged in');
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
  const tokens = _accessToken.split(".");
  const unencoded = atob(tokens[1]);
  const payload = JSON.parse(unencoded);
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