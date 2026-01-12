

import { z } from 'zod';

export type DeliveryMode = {
  id: string;
  name: string;
}

export type Branch = {
  id: string;
  name: string;
  dineInEnabled: boolean;
  takeAwayEnabled: boolean;
  deliveryEnabled: boolean;
  orderPrefix: string;
};

export type SubCategory = {
  id: string;
  name: string;
}

export type MenuCategory = {
  id: string;
  name: string;
  icon: string;
  stationId?: KitchenStation;
  subCategories?: SubCategory[];
}

export type Addon = {
  id: string;
  name: string;
  price?: number; // For simple, fixed-price addons
  prices?: { [size: string]: number }; // For size-based pricing
  type?: 'topping' | 'standard'; // To differentiate logic
};


export type AddonCategory = {
    id: string;
    name: string;
}

export type KitchenStation = 'pizza' | 'pasta' | 'fried' | 'bar';

export type MenuItemVariant = {
  id: string;
  name: string; // e.g., "Small", "Regular", "Large"
  price: number;
};

export type DealItem = {
    menuItemId: string;
    quantity: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // Base price, can be overridden by variants
  categoryId: string;
  subCategoryId?: string;
  imageUrl: string;
  availableAddonIds?: string[];
  variants?: MenuItemVariant[]; // For items with multiple sizes like pizzas
  dealItems?: DealItem[]; // For bundle items
};


export type Deal = {
  id:string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  items: DealItem[];
};

export type SelectedAddon = Addon & { quantity: number; selectedPrice: number };


export type CartItem = Omit<MenuItem, 'price' | 'availableAddonIds'> & {
  cartItemId: string;
  uniqueVariationId?: string;
  quantity: number;
  price: number; // Final price including addons and variant (for one unit)
  basePrice: number;
  selectedAddons: SelectedAddon[];
  selectedVariant?: MenuItemVariant;
  isDealComponent?: boolean;
  parentDealCartItemId?: string;
  dealName?: string;
  instructions?: string;
  stationId?: KitchenStation;
};


export type OrderType = 'Dine-In' | 'Take-Away' | 'Delivery';

export type OrderStatus = 'Pending' | 'Preparing' | 'Partial Ready' | 'Ready' | 'Completed' | 'Cancelled';

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
    instructions?: string; // Overall order instructions
    // New fields for dine-in orders
    floorId?: string;
    tableId?: string;
    deliveryMode?: string;
    // New fields for delivery orders
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
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
    // Audit fields
    placedBy?: string; // userId of user who placed the order, or 'Customer'
    completedBy?: string; // userId of user who marked as completed
};

export type OrderItem = {
    id: string; // Will be a client-generated UUID, unique for each line item instance
    orderId: string;
    menuItemId: string;
    quantity: number;
    itemPrice: number; // Price of the item including addons and variant at time of order
    baseItemPrice: number; // Base price of the item without addons/variant
    name: string;
    selectedAddons: { name: string; price: number; quantity: number }[];
    selectedVariant?: { name: string; price: number }; // The chosen size/variant
    stationId?: KitchenStation; // Denormalized from MenuCategory for KDS
    isPrepared?: boolean; // For KDS tracking
    preparedAt?: string; // ISO string timestamp for when it was marked as prepared
    isDispatched?: boolean; // For Dispatch station tracking
    dealName?: string;
    order?: Order;
    instructions?: string; // Special instructions for this specific item
    isDealComponent?: boolean; // Is this item part of a deal bundle?
    parentDealCartItemId?: string; // Correct: Which cart-item-level ID is the parent deal?
};

export type PlacedOrder = {
    orderId: string;
    orderNumber: string;
    total: number;
    branchName: string;
    orderType: OrderType;
    deliveryMode?: string;
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
export type UserRole = 'root' | 'admin' | 'cashier' | 'marketing' | 'kds' | 'make-station' | 'pasta-station' | 'fried-station' | 'bar-station' | 'cutt-station';

export type User = {
    id: string;
    username: string;
    password?: string; // Optional because we don't store it client-side for non-root users
    role: UserRole;
    branchId?: string; // Assigned branch for admins and cashiers
    stationName?: string; // Assigned station for KDS users
    balance?: number; // Cashier balance
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

// --- Cashier Log Types ---
export type CashierLogEntry = {
    id: string;
    timestamp: string; // ISO string
    type: 'bleed' | 'deposit';
    amount: number;
    cashierId: string;
    cashierName: string;
    adminId: string;
    adminName: string;
    notes?: string;
};

// --- Rating Type ---
export type Rating = {
    id: string;
    timestamp: string; // ISO string
    rating: number; // 1-5
    comment: string;
};

// --- Promotion Settings ---
export type PromotionSettings = {
    isEnabled: boolean;
    itemId: string | null;
    imageUrl: string;
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
  orderType: z.enum(['Dine-In', 'Take-Away', 'Delivery']).describe('The type of order.'),
  status: z.string().describe('The current status of the order (e.g., "Pending").'),
  totalAmount: z.number().describe('The total cost of the order.'),
  orderNumber: z.string().describe('The human-readable order number.'),
  items: z.array(OrderItemSyncSchema).describe('An array of items included in the order.'),
  instructions: z.string().optional().describe('Special preparation instructions for the entire order.'),
  // Optional fields for dine-in
  floorId: z.string().optional().describe('The identifier for the floor.'),
  tableId: z.string().optional().describe('The identifier for the table.'),
  deliveryMode: z.string().optional().describe('The source of the delivery order (e.g. Website, App, Call Centre).'),
   // Optional fields for delivery
  customerName: z.string().optional().describe("The customer's full name for delivery."),
  customerPhone: z.string().optional().describe("The customer's phone number for delivery."),
  customerAddress: z.string().optional().describe("The customer's full address for delivery."),
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

// Cart Types for Database
export type Cart = {
    Id: string; // GUID
    SessionId: string;
    BranchId?: string;
    OrderType?: OrderType;
    FloorId?: string;
    TableId?: string;
    DeliveryMode?: string;
    CustomerName?: string;
    CustomerPhone?: string;
    CustomerAddress?: string;
    UpdatedAt: string; // ISO Date
};

// The client-side CartItem is mostly compatible, but we need to map names
// e.g. cartItemId -> Id (or generate new one on save)
// This type is for what's stored in the DB
export type DbCartItem = {
    Id: string; // GUID
    CartId: string; // GUID
    MenuItemId: string;
    Quantity: number;
    Price: number;
    BasePrice: number;
    Name: string;
    SelectedAddons: string; // JSON string
    SelectedVariant: string; // JSON string
    StationId?: KitchenStation;
    IsDealComponent?: boolean;
    ParentDealCartItemId?: string; // GUID
    Instructions?: string;
};

// Added for context migration
export interface Settings {
    floors: Floor[];
    tables: Table[];
    paymentMethods: PaymentMethod[];
    autoPrintReceipts: boolean;
    companyName: string;
    companyLogo?: string;
    branches: Branch[];
    defaultBranchId: string | null;
    businessDayStart: string;
    businessDayEnd: string;
    roles: Role[];
    deliveryModes: DeliveryMode[];
    promotion: PromotionSettings;
}

export interface MenuData {
    items: MenuItem[];
    categories: MenuCategory[];
    addons: Addon[];
}
