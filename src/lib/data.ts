
import type { Branch, MenuCategory, MenuItem } from './types';
import branchesData from '@/config/branches.json';

export const branches: Branch[] = branchesData.branches;

export const menuCategories: MenuCategory[] = [
    { id: 'deals', name: 'Deals', icon: 'Tag' },
    { id: 'starters', name: 'Starters', icon: 'Star' },
    { id: 'pizzas', name: 'Pizzas', icon: 'Pizza' },
    { id: 'cheezy-crispy', name: 'Cheezy & Crispy', icon: 'Sandwich' },
    { id: 'bazinga', name: 'Bazinga!', icon: 'Sparkles' },
    { id: 'side-orders', name: 'Side Orders', icon: 'Drumstick' },
    { id: 'drinks', name: 'Drinks', icon: 'GlassWater' },
];

export const menuItems: MenuItem[] = [
  // Deals
  { id: 'dl-01', name: 'Somewhat Amazing 1', description: '2 Bazinga burgers, Reg. fries, 2 reg. drinks.', price: 1250, categoryId: 'deals', imageId: 'deal-1' },
  { id: 'dl-02', name: 'Somewhat Amazing 2', description: '2 Bazinga burgers, 2 pcs chicken, Large fries, 2 reg. drinks.', price: 1750, categoryId: 'deals', imageId: 'deal-2' },
  { id: 'dl-03', name: 'Somewhat Amazing 3', description: '3 Bazinga burgers, Large fries, 1 liter drink.', price: 1890, categoryId: 'deals', imageId: 'deal-3' },
  { id: 'dl-04', name: 'Somewhat Amazing 4', description: '3 Bazinga burgers, 3 pcs chicken, 1 liter drink.', price: 2150, categoryId: 'deals', imageId: 'deal-4' },
  { id: 'dl-05', name: 'Small Pizza Deal', description: '6" small pizza, 1 reg. Drink (345 ml).', price: 750, categoryId: 'deals', imageId: 'pizza-deal-sm' },
  { id: 'dl-06', name: 'Regular Pizza Deal', description: '9" regular pizza, 2 reg. Drinks (345 ml).', price: 1450, categoryId: 'deals', imageId: 'pizza-deal-reg' },
  { id: 'dl-07', name: 'Large Pizza Deal', description: '12" large pizza, 1 liter drink.', price: 1990, categoryId: 'deals', imageId: 'pizza-deal-lg' },
  
  // Starters
  { id: 'st-01', name: 'Cheezy Sticks', description: 'Freshly baked bread filled with the yummiest cheese blend to satisfy your cravings served with sauce.', price: 630, categoryId: 'starters', imageId: 'cheezy-sticks' },
  { id: 'st-02', name: 'Calzone Chunks', description: '4 pcs stuffed calzone chunks served with sauce & fries.', price: 1150, categoryId: 'starters', imageId: 'calzone-chunks' },
  { id: 'st-03', name: 'Oven Baked Wings (6pcs)', description: 'Fresh oven baked wings served with dip sauce.', price: 600, categoryId: 'starters', imageId: 'baked-wings' },
  { id: 'st-04', name: 'Oven Baked Wings (12pcs)', description: 'Fresh oven baked wings served with dip sauce.', price: 1150, categoryId: 'starters', imageId: 'baked-wings' },
  { id: 'st-05', name: 'Flaming Wings (6pcs)', description: 'Fresh oven baked wings tossed in hot peri peri sauce & served with dip sauce.', price: 650, categoryId: 'starters', imageId: 'flaming-wings' },
  { id: 'st-06', name: 'Flaming Wings (12pcs)', description: 'Fresh oven baked wings tossed in hot peri peri sauce & served with dip sauce.', price: 1250, categoryId: 'starters', imageId: 'flaming-wings' },
  { id: 'st-07', name: 'Cheezious Rolls', description: '4 pcs rolls stuffed with yummiest mix served with dip sauce.', price: 690, categoryId: 'starters', imageId: 'cheezious-rolls' },

  // Pizzas
  { id: 'pz-01', name: 'Crown Crust Pizza (Regular)', description: 'A flavorful blend of special sauce, cheese & mughlai tikka, all crowned with capsicums, onions and black olives on top.', price: 1550, categoryId: 'pizzas', imageId: 'crown-crust' },
  { id: 'pz-02', name: 'Crown Crust Pizza (Large)', description: 'A flavorful blend of special sauce, cheese & mughlai tikka, all crowned with capsicums, onions and black olives on top.', price: 2050, categoryId: 'pizzas', imageId: 'crown-crust' },
  { id: 'pz-03', name: 'Stuff Crust Pizza (Regular)', description: 'Special sauce, kebab dip, cheese Mix with onions, capsicums, mushrooms, green olives & three mouth watering flavours of topping.', price: 1600, categoryId: 'pizzas', imageId: 'stuff-crust' },
  { id: 'pz-04', name: 'Stuff Crust Pizza (Large)', description: 'Special sauce, kebab dip, cheese Mix with onions, capsicums, mushrooms, green olives & three mouth watering flavours of topping.', price: 2450, categoryId: 'pizzas', imageId: 'stuff-crust' },
  { id: 'pz-05', name: 'Cheezious Special (Regular)', description: 'Cheeziness overload with onions, capsicums, mushrooms, black olives, sauce, cheese mix with four combination of topping.', price: 1550, categoryId: 'pizzas', imageId: 'cheezious-special' },
  { id: 'pz-06', name: 'Cheezious Special (Large)', description: 'Cheeziness overload with onions, capsicums, mushrooms, black olives, sauce, cheese mix with four combination of topping.', price: 2050, categoryId: 'pizzas', imageId: 'cheezious-special' },
  { id: 'pz-07', name: 'Chicken Tikka Pizza (Small)', description: 'Made with pizza sauce, cheese mix, topped with tasty tikka and onions for a delightful taste experience.', price: 690, categoryId: 'pizzas', imageId: 'chicken-tikka' },
  { id: 'pz-08', name: 'Chicken Tikka Pizza (Regular)', description: 'Made with pizza sauce, cheese mix, topped with tasty tikka and onions for a delightful taste experience.', price: 1350, categoryId: 'pizzas', imageId: 'chicken-tikka' },
  { id: 'pz-09', name: 'Chicken Fajita Pizza (Small)', description: 'An authentic taste of Fajita marinated chicken, onions, cheese, pizza sauce, and bell peppers.', price: 690, categoryId: 'pizzas', imageId: 'chicken-fajita' },
  { id: 'pz-10', name: 'Chicken Fajita Pizza (Regular)', description: 'An authentic taste of Fajita marinated chicken, onions, cheese, pizza sauce, and bell peppers.', price: 1350, categoryId: 'pizzas', imageId: 'chicken-fajita' },
  { id: 'pz-11', name: 'Chicken Supreme Pizza (Small)', description: 'Featuring smoky chicken tikka, fajita, onions, capsicums, mushrooms, pizza sauce, black olives, and cheese mix.', price: 690, categoryId: 'pizzas', imageId: 'chicken-supreme' },
  { id: 'pz-12', name: 'Chicken Supreme Pizza (Regular)', description: 'Featuring smoky chicken tikka, fajita, onions, capsicums, mushrooms, pizza sauce, black olives, and cheese mix.', price: 1350, categoryId: 'pizzas', imageId: 'chicken-supreme' },
  { id: 'pz-13', name: 'Behari Kebab Pizza (Regular)', description: 'Loaded with cheese mix, onions, jalapenos, sauce, garnish, tikka, and juicy seekh kebab topping.', price: 1550, categoryId: 'pizzas', imageId: 'behari-kebab' },

  // Cheezy & Crispy
  { id: 'cc-01', name: 'Fettuccine Alfredo Pasta', description: 'Fettuccine pasta tossed in creamy white sauce with mushrooms and chicken chunks.', price: 1050, categoryId: 'cheezy-crispy', imageId: 'fettuccine-alfredo' },
  { id: 'cc-02', name: 'Crunchy Chicken Pasta', description: 'Yummiest macaroni pasta in white sauce topped with crispy chicken & cheese.', price: 950, categoryId: 'cheezy-crispy', imageId: 'crunchy-pasta' },
  { id: 'cc-03', name: 'Special Roasted Platter', description: '4 pcs behari rolls, 6 pcs wings with fries & dip sauce.', price: 1200, categoryId: 'cheezy-crispy', imageId: 'roasted-platter' },
  { id: 'cc-04', name: 'Classic Roll Platter', description: '4 pcs behari rolls, 4 pcs arabic rolls served with fries & dip sauce.', price: 1200, categoryId: 'cheezy-crispy', imageId: 'roll-platter' },
  { id: 'cc-05', name: 'Euro Sandwich', description: 'Chicken tikka with special sauce, cheese, lettuce, and pineapples in soft and crispy buns, served with fries.', price: 920, categoryId: 'cheezy-crispy', imageId: 'euro-sandwich' },
  { id: 'cc-06', name: 'Mexican Sandwich', description: 'Black pepper chicken with fresh tomatoes, cucumbers, sweet corn, lettuce, and our special dip sauce, all in soft, crispy buns served with fries.', price: 920, categoryId: 'cheezy-crispy', imageId: 'mexican-sandwich' },
  { id: 'cc-07', name: 'Pizza Stacker', description: 'A unique blend of delicious sauce, crispy chicken and pizza crust.', price: 920, categoryId: 'cheezy-crispy', imageId: 'pizza-stacker' },
  
  // Bazinga
  { id: 'bz-01', name: 'Reggy Burger', description: 'Classic Reggy burger.', price: 390, categoryId: 'bazinga', imageId: 'reggy-burger' },
  { id: 'bz-02', name: 'Bazinga Burger', description: 'The signature Bazinga burger.', price: 560, categoryId: 'bazinga', imageId: 'bazinga-burger' },
  { id: 'bz-03', name: 'Bazinga Combo', description: 'A Bazinga burger with fries and a drink.', price: 820, categoryId: 'bazinga', imageId: 'bazinga-combo' },

  // Side Orders
  { id: 'so-01', name: 'Fried Chicken (3pcs)', description: '3 pieces of crispy fried chicken.', price: 740, categoryId: 'side-orders', imageId: 'fried-chicken' },
  { id: 'so-02', name: 'Fried Chicken (1pc)', description: '1 piece of crispy fried chicken.', price: 300, categoryId: 'side-orders', imageId: 'fried-chicken-single' },
  { id: 'so-03', name: 'Chicken Nuggets', description: '5 pieces of chicken nuggets.', price: 450, categoryId: 'side-orders', imageId: 'nuggets' },
  { id: 'so-04', name: 'Fries (Large)', description: 'A large serving of crispy french fries.', price: 350, categoryId: 'side-orders', imageId: 'fries' },
  { id: 'so-05', 'name': 'Fries (Regular)', description: 'A regular serving of crispy french fries.', price: 220, categoryId: 'side-orders', imageId: 'fries' },

  // Drinks
  { id: 'd1', name: 'Regular Soft Drink', description: 'A regular-sized soft drink (345ml).', price: 100, categoryId: 'drinks', imageId: 'drink-1' },
  { id: 'd2', name: '1 Liter Soft Drink', description: '1 Liter soft drink bottle.', price: 190, categoryId: 'drinks', imageId: 'drink-liter' },
  { id: 'd3', name: '1.5 Liter Soft Drink', description: '1.5 Liter soft drink bottle.', price: 220, categoryId: 'drinks', imageId: 'drink-liter' },
  { id: 'd4', name: 'Small Water Bottle', description: 'A small bottle of mineral water.', price: 60, categoryId: 'drinks', imageId: 'drink-2' },
  { id: 'd5', name: 'Small Juice', description: 'A small carton of juice.', price: 60, categoryId: 'drinks', imageId: 'juice-small' },
];
