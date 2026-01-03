

import { z } from 'zod';

export type Branch = {
  id: string;
  name: string;
  dineInEnabled: boolean;
  takeAwayEnabled: boolean;
  orderPrefix: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  icon: string;
  stationId?: KitchenStation;
}

export type Addon = {
  id: string;
  name: string;
  price: number;
};

export type AddonCategory = {
    id: string;
    name: string;
}

export type KitchenStation = 'pizza' | 'pasta' | 'fried' | 'bar';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  availableAddonIds?: string[];
};

export type DealItem = {
    menuItemId: string;
    quantity: number;
};

export type Deal = {
  id:string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  items: DealItem[];
};

export type SelectedAddon = Addon & { quantity: number };

export type CartItem = Omit<MenuItem, 'price' | 'availableAddonIds'> & {
  cartItemId: string; // Unique ID for the cart instance of an item
  quantity: number;
  price: number; // Final price including addons (for one unit)
  basePrice: number; // Original item price
  selectedAddons: SelectedAddon[];
  isDealComponent?: boolean; // Flag to identify items added as part of a deal
  parentDealId?: string; // ID of the parent deal item in the cart
  dealName?: string;
};


export type OrderType = 'Dine-In' | 'Take-Away';

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

export type Order = {
    id: string; // Will be a client-generated UUID
    orderNumber: string;
    branchId: string;
    orderDate: string; // ISO string
    completionDate?: string; // ISO string, set when order moves to 'Ready'
    orderType: OrderType;
    status: OrderStatus;
    totalAmount: number;
    items: OrderItem[];
    paymentMethod: string;
    instructions?: string;
    // New fields for dine-in orders
    floorId?: string;
    tableId?: string;
    // Tax fields
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    cancellationReason?: string;
    // Discount and Complementary Fields
    isComplementary?: boolean;
    complementaryReason?: string;
    discountType?: 'percentage' | 'amount';
    discountValue?: number;
    discountAmount?: number;
    originalTotalAmount?: number;
};

export type OrderItem = {
    id: string; // Will be a client-generated UUID
    orderId: string;
    menuItemId: string;
    quantity: number;
    itemPrice: number; // Price of the item including addons at time of order
    baseItemPrice: number; // Base price of the item without addons
    name: string;
    selectedAddons: { name: string; price: number; quantity: number }[];
    stationId?: KitchenStation; // Denormalized from MenuCategory for KDS
    isPrepared?: boolean; // For KDS tracking
    dealName?: string;
};

export type PlacedOrder = {
    orderId: string;
    orderNumber: string;
    total: number;
    branchName: string;
    orderType: OrderType;
    tableName?: string;
    floorName?: string;
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
    taxRate?: number;
}

// --- Auth Types ---
export type UserRole = 'root' | 'admin' | 'cashier' | 'marketing';

export type User = {
    id: string;
    username: string;
    password?: string; // Optional because we don't store it client-side for non-root users
    role: UserRole;
    branchId?: string; // Assigned branch for admins and cashiers
};

// --- Role Management Types ---
export type Role = {
  id: UserRole | string;
  name: string;
  permissions: string[];
};


// --- Activity Log Types ---
export type ActivityLogCategory = 'Order' | 'User' | 'Settings' | 'Deal' | 'Menu' | 'System';

export type ActivityLog = {
    id: string;
    timestamp: string; // ISO string
    user: string; // username
    message: string;
    category: ActivityLogCategory;
};

// --- Rating Type ---
export type Rating = {
    id: string;
    timestamp: string; // ISO string
    rating: number; // 1-5
    comment: string;
};


// --- Reporting Types ---
export interface ItemSale {
  id: string;
  name: string;
  quantity: number;
  totalRevenue: number;
}

export interface DealSale extends ItemSale {}

export interface CategorySale {
  id: string;
  name: string;
  sales: number;
  fill: string;
}

// --- Types for External System Sync ---

const OrderItemAddonSyncSchema = z.object({
  name: z.string().describe('The name of the add-on.'),
  price: z.number().describe('The price of the add-on.'),
  quantity: z.number().describe('The quantity of the add-on.'),
});

// Defines the schema for a single item within the order for external sync.
const OrderItemSyncSchema = z.object({
  menuItemId: z.string().describe('The unique identifier for the menu item.'),
  name: z.string().describe('The name of the menu item.'),
  quantity: z.number().describe('The quantity of this item ordered.'),
  itemPrice: z.number().describe('The final price of a single unit of this item, including add-ons.'),
  baseItemPrice: z.number().describe('The base price of the item, excluding add-ons.'),
  selectedAddons: z.array(OrderItemAddonSyncSchema).describe('An array of selected add-ons for this item.'),
});

// Defines the schema for the entire order to be sent to the external system.
export const SyncOrderInputSchema = z.object({
  id: z.string().describe('The unique identifier for the order.'),
  branchId: z.string().describe('The identifier for the branch where the order was placed.'),
  orderDate: z.string().describe('The ISO 8601 timestamp when the order was placed.'),
  orderType: z.enum(['Dine-In', 'Take-Away']).describe('The type of order.'),
  status: z.string().describe('The current status of the order (e.g., "Pending").'),
  totalAmount: z.number().describe('The total cost of the order.'),
  orderNumber: z.string().describe('The human-readable order number.'),
  items: z.array(OrderItemSyncSchema).describe('An array of items included in the order.'),
  instructions: z.string().optional().describe('Special preparation instructions for the entire order.'),
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

    
