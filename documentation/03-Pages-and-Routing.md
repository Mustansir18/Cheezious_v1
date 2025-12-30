
# Pages and Routing

The application uses the Next.js App Router. The file system inside `src/app` defines the routes. This document outlines the main pages and their purpose.

## Customer-Facing Flow

This is the primary flow for a customer placing an order.

### `src/app/page.tsx` (Homepage)

-   **Route:** `/`
-   **Purpose:** The main landing page. It displays the company name, a primary "Start Your Order" button, and a carousel of promotional deals.
-   **Logic:** It uses the `useSettings` hook to find the default branch and redirects the user to the appropriate branch page when they click "Start Your Order".

### `src/app/branch/[branchId]/page.tsx` (Mode Selection)

-   **Route:** `/branch/{branchId}`
-   **Purpose:** After selecting a branch (or starting an order from the homepage), the user is prompted to choose their order type: "Dine-In" or "Take-Away".
-   **Logic:** Based on the user's selection, it redirects them to either the menu (for Take-Away) or the table selection page (for Dine-In). It handles adding a pre-selected deal to the cart if a `dealId` is present in the URL query.

### `src/app/branch/[branchId]/table-selection/page.tsx`

-   **Route:** `/branch/{branchId}/table-selection`
-   **Purpose:** For "Dine-In" orders, this page allows the user to select their floor and table from a list of available tables.
-   **Logic:** It uses the `useSettings` and `useOrders` contexts to determine which tables are currently occupied and disables them. Upon selection, it redirects to the menu page with the table information in the URL.

### `src/app/branch/[branchId]/menu/page.tsx` (Menu)

-   **Route:** `/branch/{branchId}/menu`
-   **Purpose:** The main menu interface where users can browse items by category and add them to their cart.
-   **Logic:**
    -   Displays items grouped by categories in a tabbed interface.
    -   Uses the `MenuItemCard` component, which handles the logic for adding items to the cart, including customization with add-ons via a dialog.
    -   Requires a `mode` (Dine-In/Take-Away) and `tableId` (for Dine-In) in the URL query parameters to function correctly.

### `src/app/branch/[branchId]/order/page.tsx` (Order Confirmation)

-   **Route:** `/branch/{branchId}/order`
-   **Purpose:** The final checkout page. It displays a summary of the items in the cart, calculates the total price including taxes, and allows the user to select a payment method.
-   **Logic:** On "Place Order", it constructs the final `Order` object, calls the `syncOrderToExternalSystem` AI flow, adds the order to the `OrderContext`, and redirects the user to the `order-status` page.

### `src/app/order-status/page.tsx` (Live Order Status)

-   **Route:** `/order-status`
-   **Purpose:** Shows the live status of the order the customer just placed (Pending -> Preparing -> Ready).
-   **Logic:**
    -   It retrieves the `placedOrder` details from `sessionStorage`.
    -   It finds the full order object from the `OrderContext` and updates the UI as the status changes.
    -   Plays a sound when the order becomes "Ready".
    -   Includes an idle timer that redirects back to the homepage after a period of inactivity.

---

## Admin & Staff-Facing Flow

These pages are for managing the restaurant and are protected by authentication.

### `src/app/login/page.tsx`

-   **Route:** `/login`
-   **Purpose:** The login page for staff (Cashiers, Admins, Root).
-   **Logic:** Uses the `AuthContext` to verify credentials. On successful login, it redirects the user to their respective dashboard (`/cashier` or `/admin`).

### `src/app/admin/...` (Admin Dashboard)

-   **Layout:** `src/app/admin/layout.tsx` defines the sidebar navigation for the admin panel.
-   **Pages:**
    -   `/admin`: A dashboard of clickable cards linking to all management sections.
    -   `/admin/orders`: A live view of all orders, similar to the cashier view but with more filtering options.
    -   `/admin/queue`: The public-facing queue display screen.
    -   `/admin/reporting`: Comprehensive sales analytics and reports.
    -   `/admin/menu`: Interface for managing menu items, categories, and add-ons (CRUD).
    -   `/admin/deals`: Interface for managing promotional deals (CRUD).
    -   `/admin/qr-codes`: A tool to generate and print QR codes for tables.
    -   `/admin/feedback`: View customer ratings and comments.
    -   `/admin/users`: Manage user accounts for staff.
    -   `/admin/settings`: Configure core system settings like floors, tables, branches, and payment methods.

### `src/app/cashier/page.tsx` (Cashier Dashboard)

-   **Route:** `/cashier`
-   **Purpose:** The primary interface for cashiers to view and manage incoming orders.
-   **Logic:** Displays `OrderCard` components for all orders. Cashiers can update the status of an order (e.g., from "Ready" to "Completed").

### `src/app/marketing/...` (Marketing Dashboard)

-   **Layout:** `src/app/marketing/layout.tsx` defines the header navigation for the marketing panel.
-   **Pages:** This section re-uses several reporting components from the admin panel to provide a focused view for the marketing team.
    -   `/marketing/reporting`: The main sales analytics page.
    -   `/marketing/hourly-report`: The hourly sales report generator.
    -   `/marketing/feedback`: The customer feedback page.
    -   `/marketing/target`: A tool for setting and tracking sales goals.
