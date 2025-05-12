"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var config_1 = require("@graphql-mesh/config");
dotenv_1.default.config();
// const subgraphs = Object.entries(process.env).reduce((acc, [key, value]) => {
//   const [match, chain] = key.match(/^DAO_API_(\w+)/) || []
//   if (match) {
//     // try {
//     return [
//       ...acc,
//       {
//         name: `graphql_${chain}`,
//         handler: {
//           graphql: {
//             endpoint: value!,
//           }
//         }
//       },
//       // {
//       //   sourceHandler: loadOpenAPISubgraph(`rest_${chain}`, {
//       //     source: `${value!}/docs/json`,
//       //   })
//       // },
//     ]
//     // } catch (error) {
//     //   console.error({ message: `Unable to load ${chain} DAO API`, error })
//     // }
//   }
//   return acc
// }, [])
// if (process.env.PETITION_API_URL) {
//   try {
//     subgraphs.push({
//       sourceHandler: loadOpenAPISubgraph("Petition", {
//         source: process.env.PETITION_API_URL,
//       }),
//     })
//   } catch (error) {
//     console.error({ message: "Unable to load petition API", error })
//   }
// }
exports.default = (0, config_1.processConfig)({
    sources: [
        {
            name: "ENS",
            handler: {
                graphql: {
                    endpoint: process.env.DAO_API_ENS,
                },
                openapi: {
                    source: "".concat(process.env.DAO_API_ENS, "/docs/json"),
                }
            }
        },
        {
            name: "UNI",
            handler: {
                graphql: {
                    endpoint: process.env.DAO_API_UNI,
                },
                openapi: {
                    source: "".concat(process.env.DAO_API_UNI, "/docs/json"),
                }
            }
        }
    ],
});
