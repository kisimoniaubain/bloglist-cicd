require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const parseBool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
};

const toValidIdStrings = (values) => {
  const unique = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const id = String(value || '').trim();
    if (mongoose.Types.ObjectId.isValid(id)) {
      unique.add(id);
    }
  }
  return [...unique];
};

const run = async () => {
  const dryRunFlag = process.argv.includes('--dry-run');
  const dryRun = dryRunFlag || parseBool(process.env.DRY_RUN, false);

  await connectDB();

  const wishlists = await Wishlist.collection.find({}).toArray();

  let scanned = 0;
  let changed = 0;
  let removedInvalid = 0;
  let removedMissing = 0;

  for (const wishlist of wishlists) {
    scanned += 1;

    const originalProducts = Array.isArray(wishlist.products) ? wishlist.products : [];
    const originalValidIdStrings = toValidIdStrings(originalProducts);

    const existingProducts = await Product.find({ _id: { $in: originalValidIdStrings } })
      .select('_id')
      .lean();

    const existingIdSet = new Set(existingProducts.map((p) => String(p._id)));
    const cleanedIdStrings = originalValidIdStrings.filter((id) => existingIdSet.has(id));

    removedInvalid += Math.max(0, originalProducts.length - originalValidIdStrings.length);
    removedMissing += Math.max(0, originalValidIdStrings.length - cleanedIdStrings.length);

    const hasChanged = cleanedIdStrings.length !== originalProducts.length;
    if (!hasChanged) continue;

    changed += 1;

    if (!dryRun) {
      await Wishlist.collection.updateOne(
        { _id: wishlist._id },
        {
          $set: {
            products: cleanedIdStrings.map((id) => new mongoose.Types.ObjectId(id)),
          },
        }
      );
    }
  }

  const mode = dryRun ? 'DRY RUN' : 'APPLY';
  console.log(`\nWishlist cleanup (${mode})`);
  console.log(`Scanned wishlists: ${scanned}`);
  console.log(`Wishlists changed: ${changed}`);
  console.log(`Removed invalid IDs: ${removedInvalid}`);
  console.log(`Removed missing products: ${removedMissing}`);
  console.log('Done.\n');

  await mongoose.connection.close();
};

if (require.main === module) {
  run().catch(async (error) => {
    console.error(`\nWishlist cleanup failed: ${error.message}\n`);
    try {
      await mongoose.connection.close();
    } catch {
      // ignore close errors
    }
    process.exit(1);
  });
}

module.exports = { run };
