import * as express from "express";
import * as cors from "cors";
import * as swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "./swagger.json";
import { ITokenRepository } from "./repository/ITokenRepository";
import { tokenInMemoryRepository } from "./repository/tokenInMemoryRepository";
import { OAuth2Client } from "google-auth-library";
import { CLIENT_ID, ALLOWED_ORIGINS, PORT } from "./constants";
import { setupAuthController } from "./controllers/auth";
import { setupJwtDomain } from "./domain/jwtDomain";
import { setupHealthcheckController } from "./controllers/healthcheck";
import { setupSecureController } from "./controllers/secure";

// setup express
const app = express();
app.use(cors({
  origin: ALLOWED_ORIGINS
}));
app.use(express.json());

// setup swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// configure google auth
const client = new OAuth2Client(CLIENT_ID);

// setup services
const tokenRepository: ITokenRepository = new tokenInMemoryRepository();
const jwtDomain: IJwtDomain = setupJwtDomain(tokenRepository, client);

// setup endpoints
setupAuthController(app, tokenRepository, jwtDomain);
setupSecureController(app, jwtDomain);
setupHealthcheckController(app);

// start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
