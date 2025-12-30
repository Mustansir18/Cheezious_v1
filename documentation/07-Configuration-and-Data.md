
# Configuration and Data

This document explains the key configuration files and data sources within the Cheezious Connect application.

---

## `src/lib/` - Core Data & Logic

### `src/lib/types.ts`
This is one of the most important files for understanding the application's data structures. It contains all the TypeScript type definitions for core concepts like `Order`, `MenuItem`, `CartItem`, `User`, `Branch`, `Role`, etc. It also contains the Zod schemas used for validating AI flow inputs and outputs.

### `src/lib/data.ts`
This file serves as the initial, hardcoded data source for the application's menu. It exports default arrays for `menuItems`, `menuCategories`, and `addons`. When the application is first run, or if the data in `localStorage` is cleared, the `MenuContext` will be seeded with this data.

### `src/lib/placeholder-images.json`
To ensure a consistent and professional look, all placeholder images used in the application are defined in this JSON file. The `data.ts` file imports image URLs from here. This makes it easy to manage and update all images from a single location.

### `src/lib/exporter.ts`
This file contains all the client-side logic for exporting data from the reporting pages into different formats. It uses `jsPDF` and `jspdf-autotable` for creating PDF documents and vanilla JavaScript for generating CSV files and ZIP archives (`jszip`).

---

## `src/config/` - Static Application Configuration

### `src/config/permissions.ts`
This file exports a single constant, `ALL_PERMISSIONS`. This array defines every possible permission that can be assigned to a user role. Each permission object contains an `id` (which often corresponds to a route), a user-friendly `name`, and a `description`. This provides the data for the role management UI in the admin settings.

### `src/config/roles.json` and `branches.json`
These files are present but are largely superseded by the state managed in `SettingsContext`. The application defaults to the hardcoded initial state in the context provider if `localStorage` is empty.

---

## Root Configuration Files

### `package.json`
The standard Node.js project file. It defines:
-   **`scripts`**: Commands for running the development server (`dev`), building the application (`build`), and starting it in production (`start`).
-   **`dependencies`**: All the libraries required for the application to run, such as `next`, `react`, `lucide-react`, `tailwindcss`, and `genkit`.
-   **`devDependencies`**: Libraries used only for development, like `typescript` and `postcss`.

### `tailwind.config.ts`
The configuration file for Tailwind CSS. It defines the application's theme, including colors, fonts, and spacing. It's set up to use CSS variables, which are defined in `src/app/globals.css`. This allows for dynamic theming (e.g., light/dark mode).

### `components.json`
This file is specific to **ShadCN UI**. It tells the ShadCN CLI where to find key files, such as the Tailwind config and global CSS file, and defines import aliases (e.g., `@/components`) to make importing modules cleaner.

### `next.config.mjs`
The main configuration file for Next.js. Here you can configure things like image optimization domains, redirects, and other advanced settings. In this project, it's fairly standard.

### `.env`
Used for storing environment variables. For this project, it would contain the `DYNAMICS_RSSU_API_ENDPOINT` for the external order sync, but it is currently empty.
