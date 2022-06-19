import * as express from "express";
import * as cors from "cors";
import * as swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger.json";
import * as morgan from "morgan";
import { ITokenRepository } from "./repositories/ITokenRepository";
import { tokenInMemoryRepository } from "./repositories/tokenInMemoryRepository";
import { OAuth2Client } from "google-auth-library";
import { CLIENT_ID, ALLOWED_ORIGINS, PORT } from "./constants";
import { setupAuthController } from "./controllers/auth";
import { setupJwtDomain } from "./domain/jwtDomain";
import { setupHealthcheckController } from "./controllers/healthcheck";
import { setupSecureController } from "./controllers/secure";
import { setupAuthenticateMiddleware } from "./middleware/authenticate";

// setup express
const app = express();
app.use(cors({
  origin: ALLOWED_ORIGINS
}));
app.use(express.json());
app.use(morgan('tiny'));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// configure google auth
const client = new OAuth2Client(CLIENT_ID);

// setup services (for basic dependency injection)
const tokenRepository: ITokenRepository = new tokenInMemoryRepository();
const jwtDomain: IJwtDomain = setupJwtDomain(tokenRepository, client);
const middleware = setupAuthenticateMiddleware(jwtDomain);

// setup endpoints (insert dependencies)
setupAuthController(app, tokenRepository, jwtDomain);
setupSecureController(app, middleware);
setupHealthcheckController(app);

// start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
