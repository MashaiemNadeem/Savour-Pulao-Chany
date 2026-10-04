import { StoreSettings, Category, Product } from './types.ts';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  is_open: true,
  opening_hours: '11:00 AM – 01:30 AM Daily',
  announcement:
    'Welcome to Savour Pulao & Chany! Savor our world-famous fragrant Basmati chicken pulao with crispy shami kababs, special Lahori chany, and fresh mint raita.',
  phone: '+92 51 2801122',
  address:
    'Jinnah Avenue Blue Area Islamabad • Gordon College Road Rawalpindi • Shadman Lahore',
  flat_delivery_fee: 120,
  tax_rate: 0.05,
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: 'Savour Signature Pulao', icon: 'Soup' },
  { id: 2, name: 'Lahori Desi Chany', icon: 'Flame' },
  { id: 3, name: 'Shami Kababs & Roast Chicken', icon: 'UtensilsCrossed' },
  { id: 4, name: 'Savour Burgers & Street Bites', icon: 'Beef' },
  { id: 5, name: 'Kheer, Raita & Sides', icon: 'Cookie' },
  { id: 6, name: 'Family Platters & Value Deals', icon: 'Sparkles' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    category_id: 1,
    title: 'Savour Special Chicken Pulao (Single)',
    description:
      'The national legend: Fragrant aged Basmati rice cooked in slow-boiled chicken yakhni, served with 1 golden roast chicken piece, 1 crispy Shami Kabab, spiced Lahori chany gravy, mint raita & kachumber salad.',
    price: 490.0,
    image_url:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    status: 'available',
    available_add_ons: [
      { id: 'addon_1', name: 'Fresh Zeera & Mint Raita', price: 60.0 },
      { id: 'addon_2', name: 'Crispy Savour Shami Kabab', price: 110.0 },
      { id: 'addon_3', name: 'Extra Bowl of Lahori Chany', price: 120.0 },
      { id: 'addon_4', name: 'Extra Golden Roast Chicken Piece', price: 260.0 },
      { id: 'addon_5', name: 'Fresh Kachumber Onion Salad', price: 50.0 },
      { id: 'addon_6', name: 'Chilled Cold Drink (Can 250ml)', price: 120.0 },
    ],
  },
  {
    id: 2,
    category_id: 1,
    title: 'Savour Double Chicken Pulao Platter',
    description:
      'Generous feast of aromatic pulao, 2 golden roasted chicken pieces, 2 crispy beef Shami Kababs, hearty bowl of spiced chany, cooling zeera raita and crispy salad.',
    price: 850.0,
    image_url:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 3,
    category_id: 1,
    title: 'Savour Pulao with Shami Kababs (No Chicken)',
    description:
      'Steaming plate of aromatic spiced pulao rice paired with 2 crispy beef Shami Kababs, fresh Lahori chany, mint raita & salad.',
    price: 380.0,
    image_url:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 5,
    category_id: 2,
    title: 'Special Savour Lahori Murgh Chany',
    description:
      'Slow-simmered tender chicken pieces cooked in thick peppery chickpea gravy seasoned with black cumin, clove, and desi spices.',
    price: 420.0,
    image_url:
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 6,
    category_id: 2,
    title: 'Desi Ghee Lahori Chany (Generous Bowl)',
    description:
      'The iconic Lahore street recipe: Melt-in-mouth chickpeas stewed in pure desi ghee, crushed black pepper, and secret aromatic masala.',
    price: 240.0,
    image_url:
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 8,
    category_id: 3,
    title: 'Crispy Beef Shami Kabab (Plate of 2)',
    description:
      'Coarsely pounded beef & chana daal infused with secret spices and fried in an egg-coat lace until crisp outside and melt-in-mouth inside.',
    price: 220.0,
    image_url:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 9,
    category_id: 3,
    title: 'Golden Roast Chicken Quarter (Leg / Breast)',
    description:
      'Steam-tenderized and flash-roasted chicken portion seasoned with salt, black pepper, and subtle lemon notes.',
    price: 290.0,
    image_url:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 11,
    category_id: 4,
    title: 'Legendary Savour Shami Bun Kabab',
    description:
      'Crispy toasted burger bun, freshly pan-fried beef shami patty, fried egg omelet lace, sliced onions, and savory spicy-sour mint chutney.',
    price: 220.0,
    image_url:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 13,
    category_id: 5,
    title: 'Traditional Matka Zafrani Kheer',
    description:
      'Slow-cooked whole milk rice pudding infused with fragrant saffron threads, cardamoms, and crushed pistachios & almonds.',
    price: 180.0,
    image_url:
      'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
  {
    id: 15,
    category_id: 6,
    title: 'Savour Family Feast Box (4-5 Persons)',
    description:
      'Giant family platter: 4 portions Basmati chicken pulao, 4 golden roasted chicken pieces, 4 crispy beef Shami Kababs, 2 large bowls of Lahori Chany, 2 zeera raitas, 2 kachumber salads, and 1.5L soft drink bottle.',
    price: 2650.0,
    image_url:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    status: 'available',
  },
];
