import type { Preview } from "@storybook/nextjs";
import React, { useEffect } from "react";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
} from "@apollo/client";

import "../app/globals.css";

const queryClient = new QueryClient();

const mockApolloClient = new ApolloClient({
  link: new ApolloLink(() => new Observable(() => {})),
  cache: new InMemoryCache(),
});

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        dark: { name: "Dark", value: "#09090B" },
        light: { name: "Light", value: "#FFFFFF" }
      }
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  decorators: [
    (Story) => {
      useEffect(() => {
        // Apply dark class to html element for dark theme
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");

        return () => {
          document.documentElement.classList.remove("dark");
          document.body.classList.remove("dark");
        };
      }, []);

      return React.createElement(
        ApolloProvider,
        { client: mockApolloClient },
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            TooltipProvider,
            null,
            React.createElement(
              "div",
              { className: "dark" },
              React.createElement(Story),
            ),
          ),
        ),
      );
    },
  ],

  initialGlobals: {
    backgrounds: {
      value: "dark"
    }
  }
};

export default preview;
