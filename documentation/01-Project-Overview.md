
# Project Overview: Cheezious Connect

Welcome to the Cheezious Connect documentation. This document provides a high-level overview of the project's architecture, technology stack, and core concepts.

## 1. Technology Stack

This application is a modern, full-stack web application built with a focus on performance, maintainability, and user experience.

-   **Framework:** [Next.js](https://nextjs.org/) (using the App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **UI Library:** [React](https://react.dev/)
-   **Component Library:** [ShadCN UI](https://ui.shadcn.com/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **AI Integration:** [Genkit](https://firebase.google.com/docs/genkit)
-   **State Management:** React Context API

## 2. Core Architectural Concepts

### Next.js App Router

The application uses the Next.js App Router, which enables a file-system-based routing system. Key features utilized are:

-   **Server Components:** Most components are rendered on the server by default, reducing the amount of JavaScript sent to the client and improving initial page load times.
-   **Client Components:** Components requiring interactivity (e.g., using `useState`, `useEffect`, or event listeners) are marked with the `'use client';` directive at the top of the file.
-   **Layouts:** The `layout.tsx` files define a UI that is shared across multiple pages. Layouts can be nested to create complex UI structures.

### State Management with React Context

The application avoids complex state management libraries like Redux in favor of React's built-in Context API. This provides a clean and efficient way to manage and share global state across the component tree.

Each major "domain" of the application has its own context provider, which encapsulates its state and logic. These providers are all wrapped around the application in `src/app/AppLayout.tsx`.

The primary contexts are:
-   `AuthContext`: Manages user authentication and user data.
-   `SettingsContext`: Manages restaurant settings (floors, tables, branches, etc.).
-   `OrderContext`: Manages the state of all orders.
-   `CartContext`: Manages the user's current shopping cart.
-   `MenuContext`: Manages the menu items, categories, and add-ons.
-   `DealsContext`: Manages promotional deals.
-   `RatingContext`: Manages customer feedback and ratings.
-   `ActivityLogContext`: Manages a log of significant user and system actions.

All data is persisted in the browser's `localStorage` or `sessionStorage`, meaning the application state is maintained between page reloads.

### AI with Genkit

For backend AI functionality, the application uses Genkit. The key file for this is `src/ai/flows/sync-order-flow.ts`, which defines a "flow" for processing data. In this app, it's configured to sync order data with an external system.

-   **Flows:** These are server-side functions that orchestrate AI models and business logic.
-   **Schemas:** [Zod](https://zod.dev/) is used to define the input and output schemas for AI flows, ensuring type safety and data validation.
-   **Server-Side Execution:** AI flows are executed on the server, triggered by client-side actions. The `'use server';` directive is used in these files.
