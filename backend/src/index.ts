import * as express from "express";
import * as cors from "cors";
import * as swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger.json";
import * as morgan from "morgan";
import { ITokenRepository } from "./repositories/ITokenRepository";
import { tokenInMemoryRepository } from "./repositories/tokenInMemoryRepository";
import { OAuth2Client } from "google-auth-library";
import { setupAuthController } from "./controllers/auth";
import { setupJwtDomain } from "./domain/jwtDomain";
import { setupHealthcheckController } from "./controllers/healthcheck";
import { setupSecureController } from "./controllers/secure";
import { setupAuthenticateMiddleware } from "./middleware/authenticate";
import { tokenMongoRepository } from "./repositories/tokenMongoRepository";
import { env } from "./config/env";

// setup express
const app = express();
app.use(cors({
  origin: env.allowedOrigins
}));
app.use(express.json());
app.use(morgan('dev'));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// configure google auth
const client = new OAuth2Client(env.googleClientId);

// setup services (for basic dependency injection)
// const tokenRepository: ITokenRepository = new tokenInMemoryRepository(); // swap this with the line below if you don't want to setup mongo
const tokenRepository: ITokenRepository = new tokenMongoRepository();
const jwtDomain: IJwtDomain = setupJwtDomain(tokenRepository, client);
const middleware = setupAuthenticateMiddleware(jwtDomain);

// setup endpoints (insert dependencies)
setupAuthController(app, tokenRepository, jwtDomain);
setupSecureController(app, middleware);
setupHealthcheckController(app);

// start server
app.listen(env.port, () => {
  console.log(`Example app listening on port ${env.port}`)
})
