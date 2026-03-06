import figma from "@figma/code-connect";

import { Table } from "@/shared/components/design-system/table/Table";

figma.connect(
  Table,
  "https://www.figma.com/design/DEKMQifA8YOb3oxznHboSY/%F0%9F%93%81-Orbit-UI?node-id=10713-66772",
  {
    props: {
      size: figma.boolean("isSmall", {
        true: "sm" as const,
        false: "default" as const,
      }),
      isError: figma.boolean("isError"),
    },
    example: ({ size, isError }) => (
      <Table
        columns={[]}
        data={[]}
        size={size}
        error={isError ? new Error("Something went wrong") : null}
      />
    ),
  },
);
