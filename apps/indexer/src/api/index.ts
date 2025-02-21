import { db } from "ponder:api";
import { graphql } from "ponder";
import { Hono } from "hono";
import schema from "ponder:schema";
import "./controller";

const app = new Hono();

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

export default app;
