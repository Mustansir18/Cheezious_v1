
/**
 * @fileoverview This file defines the conceptual database schema for the Cheezious Kiosk application.
 * It is intended to be a blueprint for creating tables in a SQL database like SQL Server.
 * The Next.js app itself does not connect to the database directly; this schema is for
 * the backend API that would need to be built.
 */

/**
 * Users Table
 * Stores user accounts for cashiers, branch admins, and root admins.
 * Passwords should be hashed before being stored.
 */
export const UsersSchema = {
    id: 'string (UUID, Primary Key)',
    username: 'string (unique)',
    passwordHash: 'string',
    role: "enum('root', 'admin', 'cashier')",
    branchId: 'string (Foreign Key to Branches.id, nullable)',
    createdAt: 'datetime (default: now())',
    updatedAt: 'datetime (default: now())',
};

/**
 * Branches Table
 * Stores information about each restaurant branch.
 */
export const BranchesSchema = {
    id: 'string (Primary Key)',
    name: 'string',
    location: 'string',
};

/**
 * MenuCategories Table
 * Defines the categories for menu items (e.g., Pizzas, Starters).
 */
export const MenuCategoriesSchema = {
    id: 'string (UUID, Primary Key)',
    name: 'string (unique)',
    icon: 'string', // Name of the lucide-react icon
};

/**
 * MenuItems Table
 * Stores all individual menu items.
 */
export const MenuItemsSchema = {
    id: 'string (UUID, Primary Key)',
    name: 'string',
    description: 'text',
    price: 'decimal',
    imageUrl: 'string',
    categoryId: 'string (Foreign Key to MenuCategories.id)',
};

/**
 * Deals Table
 * Stores promotional deals and discounts.
 */
export const DealsSchema = {
    id: 'string (UUID, Primary Key)',
    name: 'string',
    description: 'text',
    price: 'decimal',
    imageUrl: 'string',
};

/**
 * Orders Table
 * Stores the main record for each order placed.
 */
export const OrdersSchema = {
    id: 'string (UUID, Primary Key)',
    orderNumber: 'string (unique)',
    branchId: 'string (Foreign Key to Branches.id)',
    orderDate: 'datetime',
    orderType: "enum('Dine-In', 'Take-Away')",
    status: "enum('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled')",
    subtotal: 'decimal',
    taxRate: 'decimal',
    taxAmount: 'decimal',
    totalAmount: 'decimal',
    paymentMethodId: 'string (Foreign Key to PaymentMethods.id)',
    floorId: 'string (Foreign Key to Floors.id, nullable)',
    tableId: 'string (Foreign Key to Tables.id, nullable)',
};

/**
 * OrderItems Table
 * A join table that stores the individual items within each order.
 */
export const OrderItemsSchema = {
    id: 'string (UUID, Primary Key)',
    orderId: 'string (Foreign Key to Orders.id)',
    menuItemId: 'string (Foreign Key to MenuItems.id)',
    quantity: 'integer',
    itemPrice: 'decimal', // Price at the time of order
    name: 'string', // Name at the time of order
};


/**
 * Floors Table
 * Stores the different floors in a restaurant branch.
 */
export const FloorsSchema = {
    id: 'string (UUID, Primary Key)',
    name: 'string',
    // branchId: 'string (Foreign Key to Branches.id)' // If floors are per-branch
};

/**
 * Tables Table
 * Stores the individual tables and links them to a floor.
 */
export const TablesSchema = {
    id: 'string (UUID, Primary Key)',
    name: 'string',
    floorId: 'string (Foreign Key to Floors.id)',
};

/**
 * PaymentMethods Table
 * Stores the accepted payment methods.
 */
export const PaymentMethodsSchema = {
    id: 'string (UUID, Primary Key)',
    name: 'string (unique)',
};

