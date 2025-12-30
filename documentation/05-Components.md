
# Component Library

This document provides an overview of the key reusable components in the `src/components` directory.

## `src/components/ui/` - ShadCN UI

This directory contains the foundational UI components from the **ShadCN UI** library. These are the building blocks for the entire application's interface. They are unstyled primitives that are then styled using Tailwind CSS.

**Examples:**

-   `Button`: The standard button component.
-   `Card`: Used for creating content containers with headers, content, and footers.
-   `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`: Form elements.
-   `Dialog`, `AlertDialog`, `Sheet`: Modal and overlay components.
-   `Table`: For displaying tabular data.
-   `Carousel`: Used on the homepage for the deals carousel.

For a full list and API reference, visit the [ShadCN UI Documentation](https://ui.shadcn.com/docs/components).

## Application Components

These are custom components built for specific features of the Cheezious Connect application.

### `src/components/auth/` - Authentication

-   **`AdminRouteGuard.tsx`**: A higher-order component that wraps the admin layout. It checks if the logged-in user has the necessary permissions to view the requested admin page. If not, it redirects them.
-   **`CashierRouteGuard.tsx`**: Similar to the admin guard, but protects the `/cashier` route.
-   **`MarketingRouteGuard.tsx`**: Protects the `/marketing` routes.

### `src/components/cart/` - Shopping Cart

-   **`CartSheet.tsx`**: The slide-out panel that displays the contents of the user's shopping cart. It shows the items, total price, and a button to proceed to checkout.
-   **`UpdateQuantity.tsx`**: A small component used both in the cart and on the menu to increment, decrement, or remove an item.

### `src/components/cashier/` - Cashier & Order Display

-   **`OrderCard.tsx`**: This is a critical component used to display a single order. It shows the order number, items, total price, and status. It also contains the buttons for updating the order status (e.g., "Accept & Prepare", "Mark as Ready"). Its behavior can change based on the `workflow` prop (`cashier` or `kds`).
-   **`OrderReceipt.tsx`**: A component that formats an order's data into a traditional, printable receipt layout. This is used for both on-screen previews and for printing.

### `src/components/layout/` - Global Layout

-   **`Header.tsx`**: The main application header. It displays the company logo and name. Its content changes based on the context: on the menu page, it shows the cart button; on the homepage, it shows a "Check Order Status" button.

### `src/components/menu/` - Menu Interface

-   **`MenuItemCard.tsx`**: Displays a single menu item with its image, name, description, and price. It contains the logic for adding an item to the cart. If the item has customizations (add-ons), it opens a dialog (`AddToCartDialog`) for the user to make selections.

### `src/components/reporting/` - Sales Reports

This directory contains various components used to build the comprehensive sales reporting dashboard.

-   **`HourlySalesReport.tsx` / `DailySalesReport.tsx`**: Chart components that display sales trends over time using bar and line charts, respectively.
-   **`TopSellingItems.tsx` / `TopSellingDeals.tsx`**: Table components that list the best-selling items and deals, ranked by quantity.
-   **`CategorySalesTable.tsx`**: Shows a breakdown of revenue by menu category, displayed as both a pie chart and a table.
-   **`PaymentMethodBreakdown.tsx`**: A pie chart showing the distribution of sales across different payment methods.
-   **`OrderTypeSummary.tsx`**: A pie chart and summary cards breaking down sales and order count by "Dine-In" vs. "Take-Away".
-   **`CompletionTimeReport.tsx`**: A card that calculates and displays the average, minimum, and maximum time it takes to complete an order.
-   **`OrderAdjustmentsSummary.tsx`**: Displays counts of discounted, complementary, or cancelled orders.
