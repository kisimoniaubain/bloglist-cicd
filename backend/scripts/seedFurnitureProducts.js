require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const furnitureProducts = [
  {
    name: 'Nordic Lounge Sofa',
    description:
      'Modern 3-seater fabric sofa with deep cushions, hardwood frame, and stain-resistant upholstery for daily comfort.',
    price: 74999,
    discountPrice: 68999,
    images: [
      'https://placehold.co/900x700/png?text=Nordic+Lounge+Sofa',
      'https://placehold.co/900x700/png?text=Sofa+Side+View',
    ],
    category: 'Furniture',
    subcategory: 'Living Room',
    brand: 'Soldy Home',
    stock: 14,
    sku: 'FUR-SOFA-001',
    isFeatured: true,
    tags: ['sofa', 'living room', 'fabric', 'modern'],
    deliveryDays: 4,
  },
  {
    name: 'OakCraft Dining Table Set (6-Seater)',
    description:
      'Solid oak dining table with six ergonomic chairs, matte protective finish, and reinforced joints for long-term durability.',
    price: 89999,
    discountPrice: 82999,
    images: [
      'https://placehold.co/900x700/png?text=OakCraft+Dining+Set',
      'https://placehold.co/900x700/png?text=Dining+Set+Top+View',
    ],
    category: 'Furniture',
    subcategory: 'Dining',
    brand: 'OakCraft',
    stock: 9,
    sku: 'FUR-DINE-002',
    isFeatured: true,
    tags: ['dining table', 'chairs', 'oak', 'family'],
    deliveryDays: 5,
  },
  {
    name: 'FlexiWork Adjustable Desk',
    description:
      'Height-adjustable work desk with cable management tray and scratch-resistant top for home office productivity.',
    price: 42999,
    discountPrice: 38999,
    images: [
      'https://placehold.co/900x700/png?text=FlexiWork+Desk',
      'https://placehold.co/900x700/png?text=Desk+Setup',
    ],
    category: 'Furniture',
    subcategory: 'Office',
    brand: 'FlexiWork',
    stock: 22,
    sku: 'FUR-DESK-003',
    isFeatured: false,
    tags: ['desk', 'office', 'adjustable', 'workspace'],
    deliveryDays: 3,
  },
  {
    name: 'CloudRest Queen Bed Frame',
    description:
      'Upholstered queen-size bed frame with padded headboard, center support rails, and noise-reducing slat design.',
    price: 59999,
    discountPrice: 54999,
    images: [
      'https://placehold.co/900x700/png?text=CloudRest+Bed+Frame',
      'https://placehold.co/900x700/png?text=Headboard+Detail',
    ],
    category: 'Furniture',
    subcategory: 'Bedroom',
    brand: 'CloudRest',
    stock: 11,
    sku: 'FUR-BED-004',
    isFeatured: true,
    tags: ['bed', 'bedroom', 'queen', 'upholstered'],
    deliveryDays: 4,
  },
  {
    name: 'UrbanShelf Bookcase',
    description:
      'Five-tier open shelf bookcase with powder-coated steel frame and engineered wood shelves for books and decor.',
    price: 21999,
    discountPrice: 18999,
    images: [
      'https://placehold.co/900x700/png?text=UrbanShelf+Bookcase',
      'https://placehold.co/900x700/png?text=Bookcase+Interior',
    ],
    category: 'Furniture',
    subcategory: 'Storage',
    brand: 'UrbanShelf',
    stock: 30,
    sku: 'FUR-SHELF-005',
    isFeatured: false,
    tags: ['bookcase', 'storage', 'shelf', 'decor'],
    deliveryDays: 3,
  },
];

async function seedFurniture() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MONGO_URI is missing. Set it in server/.env before seeding products.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for furniture seeding.');

    let created = 0;
    let updated = 0;

    for (const productData of furnitureProducts) {
      const existing = await Product.findOne({
        name: productData.name,
        category: productData.category,
      });

      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: productData });
        updated += 1;
      } else {
        await Product.create(productData);
        created += 1;
      }
    }

    const totalFurniture = await Product.countDocuments({ category: 'Furniture', isActive: true });
    console.log(`Furniture seed complete. Created: ${created}, Updated: ${updated}, Total Furniture Products: ${totalFurniture}`);
  } catch (error) {
    console.error('Furniture seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

seedFurniture();
