# Overview
Server to validate JWT from Google Auth

https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

# Local Setup

### To start the local mongo db (not needed if using tokenInMemoryRepository)
> `docker run -d -p 27017:27017 --name mongo-db mongo:latest`

### To run without hot-reload (used to just run the app)
> ```sh
> npm install
> npm run tsc
> npm start
> ```
> Server will now be up at [http://localhost:4401](http://localhost:4401), view the API spec in [Swagger](http://localhost:4401/swagger)

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
> Server will now be up at [http://localhost:4401](http://localhost:4401), view the API spec in [Swagger](http://localhost:4401/swagger)
