import type { Meta, StoryObj } from "@storybook/nextjs";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import {
  Inbox,
  FileX,
  SearchX,
  FolderX,
  PackageX,
  ShieldX,
  Database,
  Users,
  AlertCircle,
  WifiOff,
} from "lucide-react";

const meta = {
  title: "Design System/Feedback/BlankSlate",
  component: BlankSlate,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "title", "small"],
      description: "The visual variant of the blank slate",
    },
    icon: {
      control: false,
      description: "Icon component from lucide-react",
    },
    title: {
      control: "text",
      description: "Optional title text (uppercase, monospace)",
    },
    description: {
      control: "text",
      description: "Main description text",
    },
    children: {
      control: false,
      description: "Optional action buttons or additional content",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
} satisfies Meta<typeof BlankSlate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    icon: Inbox,
    description: "No items found",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const WithTitle: Story = {
  args: {
    variant: "title",
    icon: FileX,
    title: "No Documents",
    description: "There are no documents in this folder yet",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Small: Story = {
  args: {
    variant: "small",
    icon: SearchX,
    description: "No results found",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const WithAction: Story = {
  args: {
    variant: "default",
    icon: FolderX,
    title: "No Projects",
    description: "Create your first project to get started",
    children: (
      <button className="bg-surface-action-primary text-inverted mt-4 rounded px-4 py-2 text-sm hover:opacity-90">
        Create Project
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const WithMultipleActions: Story = {
  args: {
    variant: "default",
    icon: PackageX,
    title: "No Items",
    description: "Add items to your collection to see them here",
    children: (
      <div className="mt-4 flex gap-2">
        <button className="bg-surface-action-primary text-inverted rounded px-4 py-2 text-sm hover:opacity-90">
          Add Item
        </button>
        <button className="text-secondary hover:text-primary border-border-contrast rounded border px-4 py-2 text-sm">
          Import
        </button>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const EmptyInbox: Story = {
  args: {
    variant: "title",
    icon: Inbox,
    title: "Inbox Zero",
    description: "All caught up! No new messages",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const NoSearchResults: Story = {
  args: {
    variant: "default",
    icon: SearchX,
    title: "No Results",
    description: "Try adjusting your search or filters",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const NoPermissions: Story = {
  args: {
    variant: "default",
    icon: ShieldX,
    title: "Access Denied",
    description: "You don't have permission to view this content",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const EmptyDatabase: Story = {
  args: {
    variant: "title",
    icon: Database,
    title: "No Data",
    description: "Database is empty. Start by adding some records",
    children: (
      <button className="bg-surface-action-primary text-inverted mt-4 rounded px-4 py-2 text-sm hover:opacity-90">
        Add Record
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const NoUsers: Story = {
  args: {
    variant: "small",
    icon: Users,
    description: "No users in this group",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const ErrorState: Story = {
  args: {
    variant: "default",
    icon: AlertCircle,
    title: "Something Went Wrong",
    description: "Unable to load content. Please try again",
    children: (
      <button className="bg-surface-action-primary text-inverted mt-4 rounded px-4 py-2 text-sm hover:opacity-90">
        Retry
      </button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Offline: Story = {
  args: {
    variant: "default",
    icon: WifiOff,
    title: "You're Offline",
    description: "Check your internet connection and try again",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const AllVariants = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <p className="text-tertiary mb-2 text-xs">Default Variant</p>
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No items found in this section"
        />
      </div>

      <div>
        <p className="text-tertiary mb-2 text-xs">With Title</p>
        <BlankSlate
          variant="title"
          icon={FileX}
          title="Empty Folder"
          description="This folder doesn't contain any files yet"
        />
      </div>

      <div>
        <p className="text-tertiary mb-2 text-xs">Small Variant</p>
        <BlankSlate
          variant="small"
          icon={SearchX}
          description="No results found"
        />
      </div>

      <div>
        <p className="text-tertiary mb-2 text-xs">With Action Button</p>
        <BlankSlate
          variant="default"
          icon={PackageX}
          title="No Items"
          description="Add your first item to get started"
        >
          <button className="bg-surface-action-primary text-inverted mt-4 rounded px-4 py-2 text-sm hover:opacity-90">
            Add Item
          </button>
        </BlankSlate>
      </div>
    </div>
  ),
};

export const InContainer = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="bg-surface-hover w-full max-w-4xl rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-primary text-lg font-semibold">Documents</h2>
        <button className="text-secondary hover:text-primary px-3 py-1.5 text-sm">
          Upload
        </button>
      </div>
      <BlankSlate
        variant="default"
        icon={FolderX}
        title="No Documents"
        description="Upload documents to see them here"
      >
        <button className="bg-surface-action-primary text-inverted mt-4 rounded px-4 py-2 text-sm hover:opacity-90">
          Upload Document
        </button>
      </BlankSlate>
    </div>
  ),
};
