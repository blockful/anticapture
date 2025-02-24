import { db } from "ponder:api";
import { graphql } from "ponder";
import { Hono } from "hono";
import schema from "ponder:schema";
import {
  governanceActivity,
  tokenDistribution,
  assets,
  dao,
  petition,
} from "./controller";

const app = new Hono();

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

app.route("/", governanceActivity);
app.route("/", tokenDistribution);
app.route("/", assets);
app.route("/", dao);
app.route("/", petition);

export default app;
