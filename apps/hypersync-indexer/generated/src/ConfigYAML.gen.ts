/* TypeScript file generated from ConfigYAML.res by genType. */

/* eslint-disable */
/* tslint:disable */

const ConfigYAMLJS = require('./ConfigYAML.res.js');

export type hyperSyncConfig = { readonly endpointUrl: string };

export type hyperFuelConfig = { readonly endpointUrl: string };

export abstract class rpcConfig { protected opaque!: any }; /* simulate opaque types */

export type syncSource = 
    { TAG: "HyperSync"; _0: hyperSyncConfig }
  | { TAG: "HyperFuel"; _0: hyperFuelConfig }
  | { TAG: "Rpc"; _0: rpcConfig };

export abstract class aliasAbi { protected opaque!: any }; /* simulate opaque types */

export type eventName = string;

export type contract = {
  readonly name: string; 
  readonly abi: aliasAbi; 
  readonly addresses: string[]; 
  readonly events: eventName[]
};

export type configYaml = {
  readonly syncSource: syncSource; 
  readonly startBlock: number; 
  readonly confirmedBlockThreshold: number; 
  readonly contracts: {[id: string]: contract}; 
  readonly lowercaseAddresses: boolean
};

export const getGeneratedByChainId: (chainId:number) => configYaml = ConfigYAMLJS.getGeneratedByChainId as any;
