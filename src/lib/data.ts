import type { Branch, MenuItem } from './types';
import branchesData from '@/config/branches.json';

export const branches: Branch[] = branchesData.branches;

export const menuItems: MenuItem[] = [
  {
    id: 'p1',
    name: 'Crown Crust Pizza',
    description: 'A royal pizza with a crust stuffed with cheese and toppings fit for a king.',
    price: 12.99,
    category: 'Pizzas',
    imageId: 'pizza-1',
  },
  {
    id: 'p2',
    name: 'Pepperoni Passion',
    description: 'Classic pepperoni pizza with a rich tomato sauce and mozzarella cheese.',
    price: 10.99,
    category: 'Pizzas',
    imageId: 'pizza-2',
  },
  {
    id: 'p3',
    name: 'Veggie Delight',
    description: 'A garden-fresh pizza with bell peppers, onions, olives, and mushrooms.',
    price: 11.99,
    category: 'Pizzas',
    imageId: 'pizza-3',
  },
  {
    id: 'b1',
    name: 'The Cheezious Classic',
    description: 'Our signature beef burger with special sauce, lettuce, cheese, pickles, onions on a sesame seed bun.',
    price: 8.99,
    category: 'Burgers',
    imageId: 'burger-1',
  },
  {
    id: 'b2',
    name: 'Zesty Chicken Burger',
    description: 'Crispy chicken fillet with a zesty mayo, lettuce, and tomato.',
    price: 7.99,
    category: 'Burgers',
    imageId: 'burger-2',
  },
  {
    id: 's1',
    name: 'Golden Fries',
    description: 'Perfectly crispy and salted french fries.',
    price: 3.49,
    category: 'Sides',
    imageId: 'side-1',
  },
  {
    id: 'd1',
    name: 'Fizzy Cola',
    description: 'An ice-cold glass of refreshing cola.',
    price: 1.99,
    category: 'Drinks',
    imageId: 'drink-1',
  },
  {
    id: 'd2',
    name: 'Mineral Water',
    description: 'Pure and simple bottled water.',
    price: 1.0,
    category: 'Drinks',
    imageId: 'drink-2',
  },
];
