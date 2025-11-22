
import { z } from 'zod';

export type Branch = {
  id: string;
  name: string;
  location: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  icon: string;
}

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
};

export type Deal = {
  id:string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

export type CartItem = MenuItem & {
  quantity: number;
};

export type OrderType = 'Dine-In' | 'Take Away';

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

export type Order = {
    id: string; // Will be a client-generated UUID
    orderNumber: string;
    branchId: string;
    orderDate: string; // ISO string
    orderType: OrderType;
    status: OrderStatus;
    totalAmount: number;
    items: OrderItem[];
    paymentMethod: string;
    // New fields for dine-in orders
    floorId?: string;
    tableId?: string;
    // Tax fields
    subtotal: number;
    taxRate: number;
    taxAmount: number;
};

export type OrderItem = {
    id: string; // Will be a client-generated UUID
    orderId: string;
    menuItemId: string;
    quantity: number;
    itemPrice: number;
    name: string;
};

export type PlacedOrder = {
    orderId: string;
    orderNumber: string;
    total: number;
    branchName: string;
    orderType: OrderType;
    tableName?: string;
};


// --- Admin Settings Types ---
export type Floor = {
    id: string;
    name: string;
}

export type Table = {
    id: string;
    name: string;
    floorId: string;
}

export type PaymentMethod = {
    id: string;
    name: string;
}

// --- Auth Types ---
export type UserRole = 'root' | 'admin' | 'cashier';

export type User = {
    id: string;
    username: string;
    password?: string; // Optional because we don't store it client-side for non-root users
    role: UserRole;
    branchId?: string; // Assigned branch for admins and cashiers
};

// --- Types for External System Sync ---

// Defines the schema for a single item within the order for external sync.
const OrderItemSyncSchema = z.object({
  menuItemId: z.string().describe('The unique identifier for the menu item.'),
  name: z.string().describe('The name of the menu item.'),
  quantity: z.number().describe('The quantity of this item ordered.'),
  itemPrice: z.number().describe('The price of a single unit of this item.'),
});

// Defines the schema for the entire order to be sent to the external system.
export const SyncOrderInputSchema = z.object({
  id: z.string().describe('The unique identifier for the order.'),
  branchId: z.string().describe('The identifier for the branch where the order was placed.'),
  orderDate: z.string().describe('The ISO 8601 timestamp when the order was placed.'),
  orderType: z.enum(['Dine-In', 'Take Away']).describe('The type of order.'),
  status: z.string().describe('The current status of the order (e.g., "Pending").'),
  totalAmount: z.number().describe('The total cost of the order.'),
  orderNumber: z.string().describe('The human-readable order number.'),
  items: z.array(OrderItemSyncSchema).describe('An array of items included in the order.'),
  // Optional fields for dine-in
  floorId: z.string().optional().describe('The identifier for the floor.'),
  tableId: z.string().optional().describe('The identifier for the table.'),
  paymentMethod: z.string().optional().describe('The selected payment method.'),
});
export type SyncOrderInput = z.infer<typeof SyncOrderInputSchema>;

// Defines the schema for the response after attempting to sync the order.
export const SyncOrderOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the synchronization was successful.'),
  externalId: z.string().optional().describe('The identifier for the order in the external system, if successful.'),
  message: z.string().describe('A message detailing the result of the operation.'),
});
export type SyncOrderOutput = z.infer<typeof SyncOrderOutputSchema>;
