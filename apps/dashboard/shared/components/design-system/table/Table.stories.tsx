import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle, Info, CheckCircle2, HeartIcon } from "lucide-react";

import { Table } from "@/shared/components/design-system/table/Table";

const meta = {
  title: "Design System/Table/BaseTable",
  component: Table,
  parameters: {
    layout: "fullwidth",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BaseTable: Story = {
  args: {
    columns: [
      {
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Age",
        accessorKey: "age",
      },
      {
        header: "City",
        accessorKey: "city",
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
          const rowData = row.original as { status: string };

          const status = rowData.status;
          if (status === "active") {
            return <CheckCircle2 className="text-green-500" />;
          }
          if (status === "inactive") {
            return <AlertCircle className="text-red-500" />;
          }
          return <Info className="text-yellow-500" />;
        },
      },
      {
        header: "Favorite",
        accessorKey: "favorite",
        cell: ({ row }) => {
          const rowData = row.original as { favorite: boolean };

          const favorite = rowData.favorite;

          return (
            <HeartIcon
              className={`size-5 transition-colors duration-300 ${
                favorite ? "text-red-500" : "text-gray-400"
              }`}
            />
          );
        },
        meta: { headerClassName: "w-[350px] justify-center" },
      },
    ],
    data: [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        age: 30,
        city: "New York",
        status: "active",
        favorite: true,
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        age: 25,
        city: "Los Angeles",
        status: "inactive",
        favorite: false,
      },
      {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        age: 28,
        city: "Chicago",
        status: "active",
        favorite: true,
      },
    ],
    className: "w-full mx-auto",
  },
};
