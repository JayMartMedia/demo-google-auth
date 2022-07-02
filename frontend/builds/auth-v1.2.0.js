(() => {
  /**
   * Things that need to be public:
   * - showOneTap: function
   * - logout: function
   * - fetchAuth: function
   * - configureGoogleAccount: function
   * - refreshAccessTokenIfNeeded: function
   * - render: function
   * - userInfo: object
   *
   * Classes used:
   * - auth-show-logged-in
   * - auth-show-logged-out
   * - auth-hide
   *
   * Id's used:
   * - auth-google-login-btn
   */
  /*** Private Variables ***/
  let _refreshToken;
  let _refreshTokenExpiry;
  let _accessToken;
  let _accessTokenExpiry;

  const CLIENT_ID = "403706356522-9l5kmo3oujjk8ho182ec3kts8k96d935.apps.googleusercontent.com";
  const AUTH_SERVER_HOST = "http://localhost:4401";

  /*** Private Methods ***/
  // utility
  function _extractPayload(jwt) {
    const tokens = jwt.split(".");
    // this atob may not work for decoding jwt?
    const unencoded = atob(tokens[1]);
    //const unencoded = Buffer.from(tokens[1], 'base64');
    const payload = JSON.parse(unencoded);
    return payload;
  }

  // dom manipulation
  function _addStyles() {
    var css = '.auth-hide { display: none; }',
      head = document.head || document.getElementsByTagName('head')[0],
      style = document.createElement('style');
    head.appendChild(style);
    style.appendChild(document.createTextNode(css));
  }

  function _renderLoggedIn() {
    _showWithClassName('auth-show-logged-in');
    _hideWithClassName('auth-show-logged-out');
  }

  function _renderLoggedOut() {
    _hideWithClassName('auth-show-logged-in');
    _showWithClassName('auth-show-logged-out');
  }

  function _hideWithClassName(className) {
    for (elem of document.getElementsByClassName(className)) {
      elem.classList.add('auth-hide');
    };
  }

  function _showWithClassName(className) {
    for (elem of document.getElementsByClassName(className)) {
      elem.classList.remove('auth-hide');
    };
  }

  // state manipulation
  function _setUserInfo(userInfo) {
    window.auth.userInfo = userInfo;
  }

  function _getAccessToken() {
    return _accessToken || sessionStorage.getItem('accessToken');
  }

  function _getAccessTokenExpiry() {
    return _accessTokenExpiry || sessionStorage.getItem('accessTokenExpiry');
  }

  function _setAccessTokenAndExpiry(accessToken) {
    _accessToken = accessToken;
    sessionStorage.setItem('accessToken', accessToken);

    const { exp } = _extractPayload(accessToken);
    _accessTokenExpiry = exp;
    sessionStorage.setItem('accessTokenExpiry', exp);
  }

  function _getRefreshToken() {
    return _refreshToken || sessionStorage.getItem('refreshToken');
  }

  function _getRefreshTokenExpiry() {
    return _refreshTokenExpiry || sessionStorage.getItem('refreshTokenExpiry');
  }

  function _setRefreshTokenAndExpiry(refreshToken) {
    _refreshToken = refreshToken;
    sessionStorage.setItem('refreshToken', refreshToken);

    const { exp } = _extractPayload(refreshToken);
    _refreshTokenExpiry = exp;
    sessionStorage.setItem('refreshTokenExpiry', exp);
  }

  /**
   * @returns return true if user needed to be logged out, false if user was not logged out
   */
  function logoutIfRefreshExpired() {
    if (_getRefreshTokenExpiry() < Math.floor(Date.now() / 1000)) {
      logout();
      return true;
    }
    return false;
  }

  async function refreshAccessTokenIfNeeded() {
    // TODO: ideally, we would prevent the request if not logged in
    if (!_getRefreshToken()) return;
    if (_getAccessTokenExpiry() < Math.floor(Date.now() / 1000)) {
      if (!logoutIfRefreshExpired()) {
        await _refreshTokens();
      }
    }
  }

  // auth methods
  function _produceLoginEvent(accessToken) {
    const payload = _extractPayload(accessToken);
    const userInfo = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    }
    const event = new CustomEvent('logged-in', { detail: { userInfo } });
    document.dispatchEvent(event);
  }

  function _produceLogoutEvent() {
    const event = new CustomEvent('logged-out');
    document.dispatchEvent(event);
  }

  async function _googleLoginCallback(response) {
    const googleJwt = response.credential;

    // get tokens for internal use
    const res = await fetch(`${AUTH_SERVER_HOST}/token`, {
      method: "POST",
      body: JSON.stringify({
        googleJwt
      }),
      headers: new Headers({
        "Content-Type": "application/json"
      }),
    });

    // save values
    const { accessToken, refreshToken } = await res.json();
    _setRefreshTokenAndExpiry(refreshToken);
    _setAccessTokenAndExpiry(accessToken);

    // login finished, produce login event
    _produceLoginEvent(accessToken);
    _renderLoggedIn();

    // set userInfo
    const { userId, picture, name, email } = _extractPayload(accessToken);
    _setUserInfo({ userId, picture, name, email });
  }

  async function _refreshTokens() {
    const res = await fetch(`${AUTH_SERVER_HOST}/refresh`, {
      method: "POST",
      body: JSON.stringify({
        refreshToken: _getRefreshToken()
      }),
      headers: new Headers({
        "Content-Type": "application/json"
      }),
    });
    const { accessToken, refreshToken } = await res.json();
    _setRefreshTokenAndExpiry(refreshToken);
    _setAccessTokenAndExpiry(accessToken);
  }

  /*** Public Methods ***/
  function configureGoogleAccount() {
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: _googleLoginCallback
    });
    google.accounts.id.renderButton(
      document.getElementById("auth-google-login-btn"),
      { theme: "outline", size: "large" }
    );
  }

  function logout() {
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshTokenExpiry');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessTokenExpiry');
    _refreshToken = null;
    _refreshTokenExpiry = null;
    _accessToken = null;
    _accessTokenExpiry = null;
    _produceLogoutEvent();
    _renderLoggedOut();
  }

  function showOneTap() {
    google.accounts.id.prompt();
  }

  async function fetchAuth(url, options) {
    await refreshAccessTokenIfNeeded();
    if (!options || !options.headers) {
      options = {
        ...options,
        headers: new Headers({
          "Authorization": _getAccessToken()
        }),
      }
    } else if (!options.headers["Authorization"]) {
      options.headers.append("Authorization", _getAccessToken());
    }
    return fetch(url, options);
  }

  function render() {
    if (_getRefreshTokenExpiry() > Math.floor(Date.now() / 1000)) {
      // refreshToken is still valid
      _produceLoginEvent(_getAccessToken());
      _renderLoggedIn();
    } else {
      _renderLoggedOut();
      showOneTap();
    }
  }

  /*** Initialization ***/
  function _setup() {
    window.auth = {
      logout,
      showOneTap,
      fetchAuth,
      configureGoogleAccount,
      refreshAccessTokenIfNeeded,
      render,
      userInfo: null
    }

    _addStyles();
    render()
  }
  window.onload = () => {
    configureGoogleAccount();
    _setup();
  }
})();
