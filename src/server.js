import Vision from "@hapi/vision";
import Hapi from "@hapi/hapi";
import Cookie from "@hapi/cookie";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";
import { webRoutes } from "./web-routes.js";
import { db } from "./models/db.js";
import { accountsController } from "./controllers/accounts-controller.js";
import dotenv from "dotenv";
import Joi from "joi";
import Inert from '@hapi/inert';


const result = dotenv.config();
if (result.error) {
  console.log(result.error.message);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
  });

  await server.register(Vision);
  await server.register(Cookie);
  await server.register(Inert);
  server.validator(Joi);

  server.views({
    engines: {
      hbs: Handlebars,
    },
    relativeTo: __dirname,
    path: "./views",
    layoutPath: "./views/layouts",
    partialsPath: "./views/partials",
    layout: true,
    isCached: false,
  });

  server.auth.strategy("session", "cookie", {
    cookie: {
      name: process.env.COOKIE_NAME,
      password: process.env.COOKIE_PASSWORD,
      isSecure: false,
    },
    redirectTo: "/",
    validate: accountsController.validate,
  });
  server.auth.default("session");

  db.init();

  server.route({
    method: 'GET',
    path: '/public/images/{param*}',
    handler: {
      directory: {
        path: path.join(__dirname, '/public/images'),
        listing: false,
        index: false,
      },
    },
  });

  server.route(webRoutes);
  await server.start();
  console.log("Server running on %s", server.info.uri);
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
