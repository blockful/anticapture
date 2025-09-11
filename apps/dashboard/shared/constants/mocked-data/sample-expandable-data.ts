import { SupplyType } from "@/shared/components/badges/SupplyLabel";

export interface TransactionData {
  id: string;
  affectedSupply: SupplyType[];
  amount: number;
  date: string;
  from: string;
  to: string;
  isAutoUpdated?: boolean;
  direction?: "up" | "down";
  subRows?: TransactionData[];
}

export const sampleTransactionData: TransactionData[] = [
  {
    id: "1",
    affectedSupply: ["CEX", "DEX"],
    amount: 1024,
    date: "2 days ago",
    from: "Binance Hot Wallet",
    to: "isadorable.eth",
    subRows: [
      {
        id: "1.1",
        affectedSupply: ["CEX"],
        amount: 0,
        date: "2 days ago",
        from: "0xD12a...25aD",
        to: "netto.eth",
        subRows: [
          {
            id: "1.1.1",
            affectedSupply: ["Delegation"],
            amount: 123,
            date: "",
            from: "0xD12a...25aD",
            to: "netto.eth",
            direction: "down",
          },
        ],
      },

      {
        id: "1.3",
        affectedSupply: ["DEX"],
        amount: 895,
        date: "",
        from: "0xD12a...25aD",
        to: "danimim.eth",
        subRows: [
          {
            id: "1.2.1",
            affectedSupply: ["Delegation"],
            amount: 123,
            date: "",
            from: "0xD12a...25aD",
            to: "danimim.eth",
            direction: "down",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    affectedSupply: ["CEX"],
    amount: 850,
    date: "3 days ago",
    from: "Binance Hot Wallet",
    to: "0xB3c4...45oF",
  },
  {
    id: "3",
    affectedSupply: ["DEX"],
    amount: 200,
    date: "3 days ago",
    from: "zeugh.eth",
    to: "0xG3b4...90iK",
  },
  {
    id: "4",
    affectedSupply: ["Delegation"],
    amount: 152,
    date: "1 week ago",
    from: "Binance Hot Wallet",
    to: "danimim.eth",
    subRows: [
      {
        id: "4.1",
        affectedSupply: ["Delegation"],
        amount: 152,
        date: "1 week ago",
        from: "netto.eth",
        to: "0xD12a...25aD",
      },
      {
        id: "4.2",
        affectedSupply: ["Delegation"],
        amount: -152,
        date: "1 week ago",
        from: "0xD12a...25aD",
        to: "netto.eth",
      },
    ],
  },
  {
    id: "5",
    affectedSupply: ["Lending"],
    amount: 102,
    date: "1 week ago",
    from: "duds.eth",
    to: "0xD7eB...67fH",
  },
  {
    id: "6",
    affectedSupply: ["CEX"],
    amount: 101,
    date: "2 weeks ago",
    from: "Binance Hot Wallet",
    to: "0xQ3f4...90sU",
  },
  {
    id: "7",
    affectedSupply: ["CEX"],
    amount: 101,
    date: "2 weeks ago",
    from: "Binance Hot Wallet",
    to: "0xQ3f4...90sU",
  },
  {
    id: "8",
    affectedSupply: ["DEX"],
    amount: 93,
    date: "1 month ago",
    from: "0xM5hc...56oQ",
    to: "0xL3g4...45nP",
  },
  {
    id: "9",
    affectedSupply: ["Lending"],
    amount: -90,
    date: "1 month ago",
    from: "0xJ9eQ...23iN",
    to: "0xN7i8...67pR",
  },
  {
    id: "10",
    affectedSupply: ["Others"],
    amount: 150,
    date: "2 weeks ago",
    from: "0xA1b2...34cD",
    to: "0xE5f6...78gH",
  },
  {
    id: "11",
    affectedSupply: ["CEX"],
    amount: -75,
    date: "1 week ago",
    from: "0xI9j0...12kL",
    to: "0xM3n4...56oP",
  },
];

// Keep the old data for backwards compatibility if needed
export interface SamplePerson {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: "relationship" | "complicated" | "single";
  progress: number;
  subRows?: SamplePerson[];
}

export const sampleExpandableData: SamplePerson[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    age: 30,
    visits: 45,
    status: "relationship",
    progress: 75,
    subRows: [
      {
        id: "1.1",
        firstName: "Jane",
        lastName: "Doe",
        age: 28,
        visits: 32,
        status: "relationship",
        progress: 68,
        subRows: [
          {
            id: "1.1.1",
            firstName: "Baby",
            lastName: "Doe",
            age: 2,
            visits: 12,
            status: "single",
            progress: 25,
          },
        ],
      },
      {
        id: "1.2",
        firstName: "Junior",
        lastName: "Doe",
        age: 8,
        visits: 18,
        status: "single",
        progress: 40,
      },
    ],
  },
  {
    id: "2",
    firstName: "Alice",
    lastName: "Smith",
    age: 25,
    visits: 67,
    status: "single",
    progress: 90,
    subRows: [
      {
        id: "2.1",
        firstName: "Bob",
        lastName: "Smith",
        age: 27,
        visits: 23,
        status: "complicated",
        progress: 55,
      },
    ],
  },
  {
    id: "3",
    firstName: "Charlie",
    lastName: "Brown",
    age: 35,
    visits: 89,
    status: "complicated",
    progress: 82,
    subRows: [
      {
        id: "3.1",
        firstName: "Snoopy",
        lastName: "Brown",
        age: 7,
        visits: 156,
        status: "single",
        progress: 95,
      },
      {
        id: "3.2",
        firstName: "Woodstock",
        lastName: "Brown",
        age: 3,
        visits: 78,
        status: "single",
        progress: 60,
      },
    ],
  },
  {
    id: "4",
    firstName: "Diana",
    lastName: "Prince",
    age: 29,
    visits: 134,
    status: "relationship",
    progress: 88,
  },
  {
    id: "5",
    firstName: "Bruce",
    lastName: "Wayne",
    age: 42,
    visits: 201,
    status: "complicated",
    progress: 77,
    subRows: [
      {
        id: "5.1",
        firstName: "Alfred",
        lastName: "Pennyworth",
        age: 65,
        visits: 523,
        status: "single",
        progress: 100,
      },
      {
        id: "5.2",
        firstName: "Robin",
        lastName: "Wayne",
        age: 16,
        visits: 98,
        status: "single",
        progress: 65,
      },
    ],
  },
];
