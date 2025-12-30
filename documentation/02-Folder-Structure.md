
# Folder Structure Guide

This document breaks down the organization of the Cheezious Connect project directory.

```
.
├── src
│   ├── app                 # Main application routes and pages
│   │   ├── admin           # Admin dashboard pages
│   │   ├── api             # API routes
│   │   ├── branch          # Customer-facing branch pages
│   │   ├── cashier         # Cashier dashboard page
│   │   ├── marketing       # Marketing dashboard pages
│   │   ├── (public)        # Public pages (login, home, etc.)
│   │   └── layout.tsx      # Root layout of the application
│   │
│   ├── components          # Reusable React components
│   │   ├── auth            # Authentication-related components
│   │   ├── cart            # Shopping cart components
│   │   ├── cashier         # Components for the cashier view
│   │   ├── layout          # Global layout components (Header)
│   │   ├── menu            # Menu-related components
│   │   ├── reporting       # Components for sales reports
│   │   └── ui              # ShadCN UI components
│   │
│   ├── context             # Global state management (React Context)
│   │
│   ├── ai                  # Genkit AI flows and configuration
│   │   ├── flows           # Specific AI business logic
│   │   └── genkit.ts       # Genkit initialization
│   │
│   ├── config              # Static configuration files (e.g., permissions)
│   │
│   ├── lib                 # Shared utilities, types, and data
│   │
│   └── hooks               # Custom React hooks
│
├── documentation         # Project documentation (you are here)
│
├── public                # Static assets (images, etc. - not used in this project)
│
├── .env                    # Environment variables
├── components.json         # ShadCN UI configuration
├── package.json            # Project dependencies and scripts
└── tailwind.config.ts    # Tailwind CSS configuration
```

## Key Directories Explained

### `src/app`

This is the heart of the Next.js application, using the App Router convention. Each folder inside `src/app` typically represents a URL segment.

-   `page.tsx`: Defines the UI for a specific URL.
-   `layout.tsx`: Defines a shared UI shell for a segment and its children.
-   `loading.tsx`: A temporary UI shown while a page or its data is loading.
-   `error.tsx`: A UI boundary to catch and display errors within a segment.
-   `route.ts`: Used for creating API endpoints (e.g., `src/app/api/...`).

### `src/components`

This directory contains all the reusable React components. It's subdivided by feature or domain.

-   **`ui/`**: This special sub-folder contains the base UI components provided by **ShadCN UI** (e.g., `Button`, `Card`, `Input`). These are the building blocks for all other components.
-   **Feature Folders (e.g., `cart/`, `reporting/`)**: Components specific to a certain feature are grouped here. For example, `OrderCard.tsx` is located in `src/components/cashier/`.

### `src/context`

This is where the application's global state is managed using React's Context API. Each file defines a "provider" that makes its state and associated functions available to any child component that uses its corresponding hook (e.g., `useAuth()`).

### `src/lib`

A general-purpose directory for shared code that doesn't fit elsewhere.

-   `types.ts`: Contains all TypeScript type definitions and Zod schemas used across the application. This is a critical file for understanding the data structures.
-   `utils.ts`: General utility functions. `cn` is a helper for combining and managing Tailwind CSS classes.
-   `data.ts`: Contains initial hardcoded data for the menu, categories, etc.
-   `exporter.ts`: Logic for exporting report data to PDF and CSV formats.

### `src/config`

Contains static configuration files that are not expected to change during runtime.

-   `permissions.ts`: Defines all available permissions in the system, used for role-based access control.

### `src/ai`

This directory holds all the Genkit-related code for AI functionalities.

-   `flows/`: Contains the business logic for AI agents. In this project, it's used to define the process for syncing an order to an external system.
-   `genkit.ts`: Initializes and configures the Genkit `ai` instance.
