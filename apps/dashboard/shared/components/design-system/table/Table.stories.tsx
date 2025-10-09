import { useCallback } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ColumnDef } from "@tanstack/react-table";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { Table } from "@/shared/components/design-system/table/Table";

interface ExampleData {
  id: number;
  name: string;
  email: string;
  age: number;
  city: string;
}

const ExampleDataTable = (props: {
  data: ExampleData[];
  columns: ColumnDef<ExampleData, unknown>[];
  [k: string]: unknown;
}) => <Table<ExampleData, unknown> {...props} />;

const columns: ColumnDef<ExampleData, unknown>[] = [
  { header: "Name", accessorKey: "name" },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Age",
    accessorKey: "age",
    meta: {
      columnClassName: "w-[50px]",
    },
  },
  {
    header: "City",
    accessorKey: "city",
    meta: {
      columnClassName: "w-[100px]",
    },
  },
];

const mockFetchPage = async ({
  pageParam = 0,
}: {
  pageParam?: number;
}): Promise<{ items: ExampleData[]; nextPage?: number }> => {
  const PAGE_SIZE = 10;
  const TOTAL_PAGES = 5;

  await new Promise((r) => setTimeout(r, 500));

  const base = pageParam * PAGE_SIZE;
  const items: ExampleData[] = Array.from({ length: PAGE_SIZE }).map((_, i) => {
    const id = base + i + 1;
    return {
      id,
      name: `anticapture_user_${id}`,
      email: `anticapture_user${id}@example.com`,
      age: 18 + ((id * 3) % 40),
      city: ["Lisbon", "Berlin", "Paris", "NYC", "Tokyo"][id % 5],
    };
  });

  return {
    items,
    nextPage: pageParam + 1 < TOTAL_PAGES ? pageParam + 1 : undefined,
  };
};

const meta: Meta<typeof ExampleDataTable> = {
  title: "Data Display/Table",
  component: ExampleDataTable,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultTable: Story = {
  args: {
    columns,
    data: (await mockFetchPage({ pageParam: 0 })).items,
    className: "w-full mx-auto",
    withSorting: true,
  },
  render: (args) => (
    <div className="flex w-full justify-center p-4">
      <ExampleDataTable {...args} />
    </div>
  ),
};

export const SmallTable: Story = {
  args: {
    columns,
    data: (await mockFetchPage({ pageParam: 0 })).items,
    size: "sm",
    className: "w-full",
    wrapperClassName: "max-h-[320px] overflow-y-auto p-4",
  },
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 0 } },
});

const TableWithInfiniteScroll = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["example-table"],
      queryFn: mockFetchPage,
      getNextPageParam: (last) => last.nextPage,
      initialPageParam: 0,
    });

  const flatRows = data?.pages.flatMap((p) => p.items) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  return (
    <ExampleDataTable
      columns={columns}
      data={flatRows}
      withSorting
      enableInfiniteScroll
      onLoadMore={loadMore}
      hasMore={!!hasNextPage}
      isLoadingMore={isFetchingNextPage}
      className="w-full"
      wrapperClassName="max-h-[475px] p-4"
      showWhenEmpty={<div className="p-6 text-center">No results</div>}
      isTableSmall
    />
  );
};

export const InfiniteScroll: Story = {
  args: {
    columns: [],
    data: [],
  },
  render: () => (
    <QueryClientProvider client={queryClient}>
      <TableWithInfiniteScroll />
    </QueryClientProvider>
  ),
};

export const DownloadCSV: Story = {
  args: {
    columns,
    data: (await mockFetchPage({ pageParam: 0 })).items,
    className: "w-full",
    wrapperClassName: "max-h-[300px] overflow-y-auto p-4",
    withDownloadCSV: true,
  },
};

export const EmptyState: Story = {
  args: {
    columns,
    data: [],
    className: "w-full",
    wrapperClassName: "max-h-[300px] overflow-y-auto p-4",
  },
};

export const CustomEmptyState: Story = {
  args: {
    columns,
    data: [],
    className: "w-full",
    wrapperClassName: "max-h-[300px] overflow-y-auto p-4",
    customEmptyState: (
      <div className="text-secondary/70 p-8 text-center text-sm">
        Nothing here yet
      </div>
    ),
  },
};
