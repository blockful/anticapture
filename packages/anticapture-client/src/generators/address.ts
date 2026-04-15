import type { PluginTs } from "@kubb/plugin-ts";
import { createGenerator, type Generator } from "@kubb/plugin-oas/generators";

export const AddressGenerator: Generator<PluginTs> = createGenerator<PluginTs>({
  name: "ethereum-address-generator",

  async schema({ schema, generator }) {
    if (schema.name !== "EthereumAddress") {
      return [];
    }

    const pluginKey = generator.context.plugin.key;

    // Resolve the generated type/file name the same way Kubb does,
    // so references from the rest of the generated code stay aligned.
    const typeName = generator.context.pluginManager.resolveName({
      name: schema.name,
      pluginKey,
      type: "type",
    });

    const file = generator.context.pluginManager.getFile({
      name: typeName,
      extname: ".ts",
      pluginKey,
      options: { type: "file", pluginKey },
    });

    return [
      {
        baseName: file.baseName,
        path: file.path,
        meta: file.meta,
        imports: [],
        exports: [],
        sources: [
          {
            value: `
/**
 * EVM address in 0x-prefixed 20-byte hex form.
 * Runtime validation still comes from the OpenAPI pattern.
 */
export type ${typeName} = string & {
  readonly __brand: "EthereumAddress";
};
            `.trim(),
          },
        ],
      },
    ];
  },
});
