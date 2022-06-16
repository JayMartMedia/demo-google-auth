# Overview
Server to validate JWT from Google Auth

https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

# Local Setup

### To run without hot-reload (used to just run the app)
> ```sh
> npm install
> npm run tsc
> npm start
> ```

### To run with hot-reload (often used for development)
> ```sh
> npm install
> # watch ./src files, transpile to dist folder when a file is changed
> npm run tsc:watch
> ```
> *in a separate terminal*
> ```sh
> # watch ./dist files, use nodemon to restart app when a file is changed
> npm run start:dev
> ```