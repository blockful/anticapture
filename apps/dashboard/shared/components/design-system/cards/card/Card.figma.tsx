import figma from "@figma/code-connect";

import { Card } from "@/shared/components/design-system/cards/card/Card";

figma.connect(
  Card,
  "https://www.figma.com/design/mUgy2KpQ3gJ07yZaUaXu8l/%F0%9F%9B%B0%EF%B8%8F-Product-Design?node-id=2753-61663",
  {
    example: () => (
      <Card>
        <div className="p-4">Card content</div>
      </Card>
    ),
  },
);
