import ComponentTypes from "@theme-original/NavbarItem/ComponentTypes";
import LlmDocsNavbarItem from "@site/src/components/LlmDocsNavbarItem";

// Register a custom navbar item type usable as `{ type: "custom-llmDocs" }`.
export default {
  ...ComponentTypes,
  "custom-llmDocs": LlmDocsNavbarItem,
};
