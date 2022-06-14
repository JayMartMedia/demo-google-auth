# Google Auth demo

Allows user to auth on client-side. Then allows user to make request to backend, where JWT is then validated on server-side.

Must have app configured through Google APIs Console: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

# About JWT's

### JWT Advantages
- No need for any microservice to make a call to user service to see whether user should have access to resource

### JWT Principles (non-exhaustive)
- JWT should not be sent in the url of an HTTP GET request
  - This would show up in history, or be seen by sniffers
  - POST body is encrypted (over https), GET url is not
- Refresh tokens should only be allowed to be used once
  - If a refresh token is used multiple times, the entire chain should be invalidated
    - This means that if an attacker somehow intercepts or retrieves a refresh token, then uses it to gain an access token, when the user's browser uses the refresh token, then the refresh token then the attacker will not be able to gain further access tokens using any refresh tokens they they have retrieved. ⚠️ TODO: clarify this

### JWT Disadvantages
- If an access token is intercepted or somehow (xss, etc.) retrieved from client, it cannot be invalidated
  - To mitigate this, use short expiry times (~15 minutes) on access tokens
