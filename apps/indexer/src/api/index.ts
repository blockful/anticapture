import { db } from "ponder:api";
import { graphql } from "ponder";
import { Hono } from "hono";
import schema from "ponder:schema";
import * as controllers from "./controller";
import docs from "./docs";

const app = new Hono();

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

Object.values(controllers).forEach((controller) => {
  app.route("/", controller);
});

app.route("/", docs);

export default app;
