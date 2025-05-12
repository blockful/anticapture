import { getMesh as meshCode, type MeshInstance } from '@graphql-mesh/runtime';
import { createMeshHTTPHandler } from '@graphql-mesh/http';
import { createServer } from 'node:http';

import config from '../mesh.config';

let meshInstance: MeshInstance;
const getMesh = async () => {
  if (!meshInstance) {
    meshInstance = await meshCode(await config);
  }
  return meshInstance;
};


const bootstrap = async () => {
  const mesh = await getMesh();

  const handler = createMeshHTTPHandler({
    baseDir: __dirname,
    getBuiltMesh: () => Promise.resolve(mesh),
  });

  const server = createServer((req, res) => handler(req, res));
  server.listen(4000, () => {
    console.log('🚀 Mesh running at http://localhost:4000/graphql');
  });
};

bootstrap();
