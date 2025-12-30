
# State Management with React Context

The application's state is managed through a series of React Contexts. This approach avoids the need for external state management libraries and keeps state logic organized and co-located with its domain. All providers are initialized in `src/app/AppLayout.tsx`.

Data is persisted in the browser's `localStorage` (for data that should persist across browser sessions) or `sessionStorage` (for data relevant only to the current session).

---

### `src/context/AuthContext.tsx`

-   **Hook:** `useAuth()`
-   **Purpose:** Manages user authentication, sessions, and user account data.
-   **State:**
    -   `user`: The currently logged-in `User` object, or `null`.
    -   `users`: An array of all `User` objects in the system.
-   **Key Functions:**
    -   `login(username, password)`: Validates credentials against the `users` array and sets the current user.
    -   `logout()`: Clears the current user session.
    -   `addUser()`, `updateUser()`, `deleteUser()`: CRUD operations for managing user accounts.
-   **Persistence:** `localStorage` for the list of users, `sessionStorage` for the current user's session.

---

### `src/context/SettingsContext.tsx`

-   **Hook:** `useSettings()`
-   **Purpose:** Manages all core configuration and environmental settings for the restaurant.
-   **State (`settings` object):**
    -   `companyName`: The name of the restaurant.
    -   `branches`: Array of `Branch` objects.
    -   `floors`, `tables`: Arrays defining the physical layout.
    -   `paymentMethods`: Array of accepted `PaymentMethod` objects, including tax rates.
    -   `roles`: Array of `Role` objects defining permissions for different user types.
    -   `autoPrintReceipts`: A boolean to control automatic printing.
    -   `occupiedTableIds`: A derived array of table IDs that are currently in use by active orders.
-   **Key Functions:** Provides a comprehensive set of functions for updating all aspects of the settings (e.g., `addFloor`, `updateBranch`, `addRole`).
-   **Persistence:** `localStorage`.

---

### `src/context/OrderContext.tsx`

-   **Hook:** `useOrders()`
-   **Purpose:** Manages the global list of all orders placed in the application.
-   **State:**
    -   `orders`: An array of all `Order` objects.
-   **Key Functions:**
    -   `addOrder(order)`: Adds a new, completed order to the state.
    -   `updateOrderStatus(orderId, status)`: Changes the status of an existing order.
    -   `applyDiscountOrComplementary(...)`: Modifies an order to apply a discount or mark it as free.
-   **Persistence:** `sessionStorage`. This is chosen to ensure that the order list is fresh for each new browser session, preventing old orders from cluttering the view.

---

### `src/context/CartContext.tsx`

-   **Hook:** `useCart()`
-   **Purpose:** Manages the state of the customer's current shopping cart.
-   **State:**
    -   `items`: An array of `CartItem` objects in the cart.
    -   `branchId`, `orderType`, `tableId`, `floorId`: Details about the current order context.
    -   `isCartOpen`: A boolean to control the visibility of the cart sheet.
-   **Key Functions:**
    -   `addItem(item, options)`: Adds a `MenuItem` to the cart, handling customizations.
    -   `updateQuantity(cartItemId, quantity)`: Updates the quantity of an item or removes it if quantity is zero.
    -   `clearCart()`: Empties the cart.
    -   `setOrderDetails(details)`: Sets the branch and order type, clearing the cart if they change.
-   **Persistence:** `sessionStorage`.

---

### `src/context/MenuContext.tsx`

-   **Hook:** `useMenu()`
-   **Purpose:** Manages the restaurant's entire menu structure.
-   **State (`menu` object):**
    -   `items`: An array of all `MenuItem` objects.
    -   `categories`: An array of all `MenuCategory` objects.
    -   `addons`: An array of all available `Addon` objects.
-   **Key Functions:** Provides CRUD functions for all three state arrays (`addItem`, `updateCategory`, `deleteAddon`, etc.).
-   **Persistence:** `localStorage`.

---

### `src/context/DealsContext.tsx`

-   **Hook:** `useDeals()`
-   **Purpose:** Manages the list of promotional deals shown on the homepage.
-   **State:**
    -   `deals`: An array of `Deal` objects.
-   **Key Functions:** `addDeal`, `updateDeal`, `deleteDeal`.
-   **Persistence:** `localStorage`.

---

### `src/context/RatingContext.tsx`

-   **Hook:** `useRating()`
-   **Purpose:** Collects and stores customer feedback.
-   **State:**
    -   `ratings`: An array of `Rating` objects.
-   **Key Functions:** `addRating(rating)`, `clearRatings()`.
-   **Persistence:** `localStorage`.

---

### `src/context/ActivityLogContext.tsx`

-   **Hook:** `useActivityLog()`
-   **Purpose:** Records significant events that occur within the application for auditing and debugging.
-   **State:**
    -   `logs`: An array of `ActivityLog` objects.
-   **Key Functions:**
    -   `logActivity(message, user, category)`: Adds a new entry to the log.
-   **Persistence:** `localStorage`.
