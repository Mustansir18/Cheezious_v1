

import type { MenuCategory, MenuItem, Addon, Deal } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const menuCategories: MenuCategory[] = [
    { id: 'C-00001', name: 'Deals', icon: 'Tag', subCategories: [
      { id: 'SC-00001', name: 'Amazing Deals' },
    ]},
    { id: 'C-00002', name: 'Pizzas', icon: 'Pizza', stationId: 'pizza', subCategories: [
        { id: 'SC-00002', name: 'Classic Flavors' },
        { id: 'SC-00003', name: 'Favorite Flavors' },
        { id: 'SC-00004', name: 'Premium Flavors' },
        { id: 'SC-00005', name: 'Super Loaded Pizzas' },
        { id: 'SC-00006', name: 'Half N Half' },
    ]},
    { id: 'C-00003', name: 'Pizza Rolls', icon: 'RollerCoaster', stationId: 'pizza', subCategories: [
        { id: 'SC-00007', name: 'All Pizza Rolls' },
    ]},
    { id: 'C-00004', name: 'Chicken', icon: 'Drumstick', stationId: 'fried', subCategories: [
        { id: 'SC-00008', name: 'Fried Chicken' },
        { id: 'SC-00009', name: 'Wings' },
    ]},
    { id: 'C-00005', name: 'Sides', icon: 'CupSoda', stationId: 'fried', subCategories: [
        { id: 'SC-00010', name: 'Fries & Nuggets' },
        { id: 'SC-00011', name: 'Pastas' },
        { id: 'SC-00012', name: 'Platters' },
    ]},
    { id: 'C-00006', name: 'My Box', icon: 'Box', stationId: 'fried', subCategories: [
        { id: 'SC-00013', name: 'Value Boxes' },
    ]},
    { id: 'C-00007', name: 'Meltz', icon: 'Sandwich', stationId: 'fried', subCategories: [
        { id: 'SC-00014', name: 'All Meltz' },
    ]},
    { id: 'C-00008', name: 'Desserts', icon: 'Cake', stationId: 'bar', subCategories: [
        { id: 'SC-00015', name: 'Sweet Treats' },
    ]},
    { id: 'C-00009', name: 'Dips', icon: 'Container', stationId: 'bar', subCategories: [
        { id: 'SC-00016', name: 'All Dips' },
    ]},
    { id: 'C-00010', name: 'Drinks', icon: 'GlassWater', stationId: 'bar', subCategories: [
        { id: 'SC-00017', name: 'Beverages' },
    ]},
];

export const addons: Addon[] = [
    { id: 'A-00001', name: 'Extra Cheese', price: 50 },
    { id: 'A-00002', name: 'Olives', price: 30 },
    { id: 'A-00003', name: 'Jalapenos', price: 30 },
    { id: 'A-00004', name: 'Mushrooms', price: 30 },
    { id: 'A-00005', name: 'Dip Sauce', price: 20 },
    { id: 'A-00006', name: 'Spicy Mayo Sauce', price: 25 },
];

const getImage = (id: string) => PlaceHolderImages.find(i => i.id === id)?.imageUrl || `https://picsum.photos/seed/${id}/400/300`;

const baseMenuItems: MenuItem[] = [
  // --- NEW PIZZA STRUCTURE ---
  {
    id: 'I-P-001', name: 'Chicken Tikka Pizza',
    description: 'Made with pizza sauce, cheese mix, topped with tasty tikka and onions for a delightful taste experience.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00002', imageUrl: getImage('chicken-tikka'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
      { name: 'Small', price: 200 },
      { name: 'Regular', price: 390 },
    ]
  },
  {
    id: 'I-P-002', name: 'Chicken Fajita Pizza',
    description: 'An authentic taste of Fajita marinated chicken, onions, cheese, pizza sauce, and bell peppers.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00002', imageUrl: getImage('chicken-fajita'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
      { name: 'Small', price: 200 },
      { name: 'Regular', price: 390 },
    ]
  },
  {
    id: 'I-P-003', name: 'Chicken Supreme Pizza',
    description: 'Featuring smoky chicken tikka, fajita, onions, capsicums, mushrooms, pizza sauce, black olives, and cheese mix.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00003', imageUrl: getImage('chicken-supreme'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
      { name: 'Small', price: 200 },
      { name: 'Regular', price: 390 },
    ]
  },
   {
    id: 'I-P-004', name: 'Behari Kebab Pizza',
    description: 'Loaded with cheese mix, onions, jalapenos, sauce, garnish, tikka, and juicy seekh kebab topping.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00003', imageUrl: getImage('behari-kebab'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
        { name: 'Small', price: 657 },
        { name: 'Regular', price: 1476 },
        { name: 'Large', price: 1952 },
        { name: 'Party', price: 3048 },
    ]
  },
  {
    id: 'I-P-005', name: 'Crown Crust Pizza',
    description: 'A flavorful blend of special sauce, cheese & mughlai tikka, all crowned with capsicums, onions and black olives on top.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00004', imageUrl: getImage('crown-crust'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
        { name: 'Small', price: 657 },
        { name: 'Regular', price: 1476 },
        { name: 'Large', price: 1952 },
        { name: 'Party', price: 3048 },
    ]
  },
  {
    id: 'I-P-006', name: 'Stuffed Crust Pizza',
    description: 'Special sauce, kebab dip, cheese Mix with onions, capsicums, mushrooms, green olives & three mouth watering flavours of topping.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00004', imageUrl: getImage('stuff-crust'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
        { name: 'Small', price: 657 },
        { name: 'Regular', price: 1524 },
        { name: 'Large', price: 2333 },
        { name: 'Party', price: 3381 },
    ]
  },
   {
    id: 'I-P-007', name: 'Cheezious Special Pizza',
    description: 'Cheeziness overload with onions, capsicums, mushrooms, black olives, sauce, cheese mix with four combination of topping.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00005', imageUrl: getImage('cheezious-special'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
        { name: 'Small', price: 657 },
        { name: 'Regular', price: 1476 },
        { name: 'Large', price: 1952 },
        { name: 'Party', price: 3048 },
    ]
  },
  {
    id: 'I-P-008', name: 'Chicken Extreme Pizza',
    description: 'A pizza for extreme chicken lovers, loaded with chicken and cheese.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00005', imageUrl: getImage('chicken-supreme'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
        { name: 'Small', price: 657 },
        { name: 'Regular', price: 1476 },
        { name: 'Large', price: 1952 },
        { name: 'Party', price: 3048 },
    ]
  },
    {
    id: 'I-P-009', name: 'Peri Peri / Malai Tikka Pizza',
    description: 'A spicy and creamy delight with your choice of Peri Peri or Malai Tikka chicken.',
    price: 0, categoryId: 'C-00002', subCategoryId: 'SC-00005', imageUrl: getImage('chicken-tikka'),
    availableAddonIds: ['A-00001', 'A-00002', 'A-00003', 'A-00004'],
    variants: [
        { name: 'Small', price: 657 },
        { name: 'Regular', price: 1524 },
        { name: 'Large', price: 2333 },
    ]
  },

  // --- OTHER MENU ITEMS ---
  // Pizza Rolls
  { id: 'I-00007', name: 'Cheezious Rolls', description: '4 pcs rolls stuffed with yummiest mix served with dip sauce.', price: 200, categoryId: 'C-00003', subCategoryId: 'SC-00007', imageUrl: getImage('cheezious-rolls'), availableAddonIds: ['A-00005'] },
  
  // Chicken
  { id: 'I-00031', name: 'Fried Chicken (3pcs)', description: '3 pieces of crispy fried chicken.', price: 220, categoryId: 'C-00004', subCategoryId: 'SC-00008', imageUrl: getImage('fried-chicken'), availableAddonIds: [] },
  { id: 'I-00032', name: 'Fried Chicken (1pc)', description: '1 piece of crispy fried chicken.', price: 90, categoryId: 'C-00004', subCategoryId: 'SC-00008', imageUrl: getImage('fried-chicken-single'), availableAddonIds: [] },
  { id: 'I-00003', name: 'Oven Baked Wings (6pcs)', description: 'Fresh oven baked wings served with dip sauce.', price: 170, categoryId: 'C-00004', subCategoryId: 'SC-00009', imageUrl: getImage('baked-wings'), availableAddonIds: ['A-00005'] },
  { id: 'I-00004', name: 'Oven Baked Wings (12pcs)', description: 'Fresh oven baked wings served with dip sauce.', price: 340, categoryId: 'C-00004', subCategoryId: 'SC-00009', imageUrl: getImage('baked-wings'), availableAddonIds: ['A-00005'] },
  { id: 'I-00005', name: 'Flaming Wings (6pcs)', description: 'Fresh oven baked wings tossed in hot peri peri sauce & served with dip sauce.', price: 190, categoryId: 'C-00004', subCategoryId: 'SC-00009', imageUrl: getImage('flaming-wings'), availableAddonIds: ['A-00005'] },
  { id: 'I-00006', name: 'Flaming Wings (12pcs)', description: 'Fresh oven baked wings tossed in hot peri peri sauce & served with dip sauce.', price: 370, categoryId: 'C-00004', subCategoryId: 'SC-00009', imageUrl: getImage('flaming-wings'), availableAddonIds: ['A-00005'] },

  // Sides
  { id: 'I-00033', name: 'Chicken Nuggets', description: '5 pieces of chicken nuggets.', price: 130, categoryId: 'C-00005', subCategoryId: 'SC-00010', imageUrl: getImage('nuggets'), availableAddonIds: ['A-00005'] },
  { id: 'I-00034', name: 'Fries (Large)', description: 'A large serving of crispy french fries.', price: 100, categoryId: 'C-00005', subCategoryId: 'SC-00010', imageUrl: getImage('fries'), availableAddonIds: ['A-00005'] },
  { id: 'I-00035', name: 'Fries (Regular)', description: 'A regular serving of crispy french fries.', price: 70, categoryId: 'C-00005', subCategoryId: 'SC-00010', imageUrl: getImage('fries'), availableAddonIds: ['A-00005'] },
  { id: 'I-00021', name: 'Fettuccine Alfredo Pasta', description: 'Fettuccine pasta tossed in creamy white sauce with mushrooms and chicken chunks.', price: 310, categoryId: 'C-00005', subCategoryId: 'SC-00011', imageUrl: getImage('fettuccine-alfredo'), availableAddonIds: ['A-00001', 'A-00004'] },
  { id: 'I-00022', name: 'Crunchy Chicken Pasta', description: 'Yummiest macaroni pasta in white sauce topped with crispy chicken & cheese.', price: 280, categoryId: 'C-00005', subCategoryId: 'SC-00011', imageUrl: getImage('crunchy-pasta'), availableAddonIds: ['A-00001'] },
  { id: 'I-00023', name: 'Special Roasted Platter', description: '4 pcs behari rolls, 6 pcs wings with fries & dip sauce.', price: 350, categoryId: 'C-00005', subCategoryId: 'SC-00012', imageUrl: getImage('roasted-platter'), availableAddonIds: ['A-00005'] },
  { id: 'I-00024', name: 'Classic Roll Platter', description: '4 pcs behari rolls, 4 pcs arabic rolls served with fries & dip sauce.', price: 350, categoryId: 'C-00005', subCategoryId: 'SC-00012', imageUrl: getImage('roll-platter'), availableAddonIds: ['A-00005'] },
  
  // My Box
  { id: 'I-00028', name: 'Reggy Burger', description: 'Classic Reggy burger.', price: 120, categoryId: 'C-00006', subCategoryId: 'SC-00013', imageUrl: getImage('reggy-burger'), availableAddonIds: ['A-00001', 'A-00006'] },
  { id: 'I-00029', name: 'Bazinga Burger', description: 'A large crispy chicken zinger burger.', price: 250, categoryId: 'C-00006', subCategoryId: 'SC-00013', imageUrl: getImage('bazinga-burger'), availableAddonIds: ['A-00001', 'A-00006'] },

  // Meltz
  { id: 'I-00025', name: 'Euro Sandwich', description: 'Chicken tikka with special sauce, cheese, lettuce, and pineapples in soft and crispy buns, served with fries.', price: 280, categoryId: 'C-00007', subCategoryId: 'SC-00014', imageUrl: getImage('euro-sandwich'), availableAddonIds: ['A-00001', 'A-00006'] },
  { id: 'I-00026', name: 'Mexican Sandwich', description: 'Black pepper chicken with fresh tomatoes, cucumbers, sweet corn, lettuce, and our special dip sauce, all in soft, crispy buns served with fries.', price: 280, categoryId: 'C-00007', subCategoryId: 'SC-00014', imageUrl: getImage('mexican-sandwich'), availableAddonIds: ['A-00001', 'A-00006'] },
  { id: 'I-00027', name: 'Pizza Stacker', description: 'A unique blend of delicious sauce, crispy chicken and pizza crust.', price: 280, categoryId: 'C-00007', subCategoryId: 'SC-00014', imageUrl: getImage('pizza-stacker'), availableAddonIds: ['A-00001', 'A-00006'] },
  
  // Dips
  { id: 'I-00041', name: 'Garlic Mayo Dip', description: 'Creamy garlic mayo dip.', price: 40, categoryId: 'C-00009', subCategoryId: 'SC-00016', imageUrl: getImage('fries'), availableAddonIds: [] },

  // Drinks
  { id: 'I-00036', name: 'Regular Soft Drink', description: 'A regular-sized soft drink (345ml).', price: 30, categoryId: 'C-00010', subCategoryId: 'SC-00017', imageUrl: getImage('drink-1'), availableAddonIds: [] },
  { id: 'I-00037', name: '1 Liter Soft Drink', description: '1 Liter soft drink bottle.', price: 60, categoryId: 'C-00010', subCategoryId: 'SC-00017', imageUrl: getImage('drink-liter'), availableAddonIds: [] },
  { id: 'I-00038', name: '1.5 Liter Soft Drink', description: '1.5 Liter soft drink bottle.', price: 70, categoryId: 'C-00010', subCategoryId: 'SC-00017', imageUrl: getImage('drink-1.5-liter'), availableAddonIds: [] },
  { id: 'I-00039', name: 'Small Water Bottle', description: 'A small bottle of mineral water.', price: 30, categoryId: 'C-00010', subCategoryId: 'SC-00017', imageUrl: getImage('drink-2'), availableAddonIds: [] },
  { id: 'I-00040', name: 'Small Juice', description: 'A small carton of juice.', price: 30, categoryId: 'C-00010', subCategoryId: 'SC-00017', imageUrl: getImage('juice-small'), availableAddonIds: [] },
];


export const initialDeals: MenuItem[] = [
  { 
    id: 'D-00001', 
    name: 'Somewhat Amazing 1', 
    description: '2 Bazinga burgers, Reg. fries, 2 reg. drinks.', 
    price: 370, 
    imageUrl: getImage('deal-1'), 
    categoryId: 'C-00001', 
    subCategoryId: 'SC-00001',
    dealItems: [
      { menuItemId: 'I-00029', quantity: 2 },
      { menuItemId: 'I-00035', quantity: 1 },
      { menuItemId: 'I-00036', quantity: 2 },
    ]
  },
  { 
    id: 'D-00002', 
    name: 'Somewhat Amazing 2', 
    description: '2 Bazinga burgers, 2 pcs chicken, Large fries, 2 reg. drinks.', 
    price: 510, 
    imageUrl: getImage('deal-2'), 
    categoryId: 'C-00001', 
    subCategoryId: 'SC-00001',
    dealItems: [
      { menuItemId: 'I-00029', quantity: 2 },
      { menuItemId: 'I-00032', quantity: 2 },
      { menuItemId: 'I-00034', quantity: 1 },
      { menuItemId: 'I-00036', quantity: 2 },
    ]
  },
  { 
    id: 'D-00003', 
    name: 'Somewhat Amazing 3', 
    description: '3 Bazinga burgers, Large fries, 1 liter drink.', 
    price: 560, 
    imageUrl: getImage('deal-3'), 
    categoryId: 'C-00001', 
    subCategoryId: 'SC-00001',
    dealItems: [
      { menuItemId: 'I-00029', quantity: 3 },
      { menuItemId: 'I-00034', quantity: 1 },
      { menuItemId: 'I-00037', quantity: 1 },
    ]
  },
  { 
    id: 'D-00004', 
    name: 'Somewhat Amazing 4', 
    description: '3 Bazinga burgers, 3 pcs chicken, 1 liter drink.', 
    price: 640, 
    imageUrl: getImage('deal-4'), 
    categoryId: 'C-00001', 
    subCategoryId: 'SC-00001',
    dealItems: [
      { menuItemId: 'I-00029', quantity: 3 },
      { menuItemId: 'I-00032', quantity: 3 },
      { menuItemId: 'I-00037', quantity: 1 },
    ]
  },
  { 
    id: 'D-00005', 
    name: 'Small Pizza Deal', 
    description: '6" small pizza, 1 reg. Drink (345 ml).', 
    price: 230, 
    imageUrl: getImage('pizza-deal-sm'), 
    categoryId: 'C-00001', 
    subCategoryId: 'SC-00001',
    dealItems: [
      { menuItemId: 'I-P-001', quantity: 1 },
      { menuItemId: 'I-00036', quantity: 1 },
  ]},
];

// Add deals to the menu items list
export const menuItems: MenuItem[] = [
  ...baseMenuItems,
  ...initialDeals
];
