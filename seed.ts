import { Client } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

async function main() {
  console.log('Start seeding...')

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // Clean up existing data to allow re-running
    await client.query('DELETE FROM "Review"');
    await client.query('DELETE FROM "OrderItem"');
    await client.query('DELETE FROM "Order"');
    await client.query('DELETE FROM "Listing"');
    await client.query('DELETE FROM "Seller"');
    await client.query('DELETE FROM "Buyer"');

    // 1. Create 2 Buyers
    const b1Res = await client.query('INSERT INTO "Buyer" (id, name, email, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING *', [uuidv4(), 'Alice Johnson', 'alice@example.com']);
    const buyer1 = b1Res.rows[0];

    const b2Res = await client.query('INSERT INTO "Buyer" (id, name, email, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING *', [uuidv4(), 'Bob Smith', 'bob@example.com']);
    const buyer2 = b2Res.rows[0];

    // 2. Create 2 Sellers
    const s1Res = await client.query('INSERT INTO "Seller" (id, name, email, store_name, updated_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *', [uuidv4(), 'Charlie Artisan', 'charlie@example.com', 'Charlie Crafts']);
    const seller1 = s1Res.rows[0];

    const s2Res = await client.query('INSERT INTO "Seller" (id, name, email, store_name, updated_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *', [uuidv4(), 'Diana Tailor', 'diana@example.com', 'Diana Designs']);
    const seller2 = s2Res.rows[0];

    // 3. Create 4 Listings
    const l1Res = await client.query('INSERT INTO "Listing" (id, seller_id, title, description, price_minor, currency, quantity_available, category, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *', [uuidv4(), seller1.id, 'Handmade Scarf', 'Warm winter scarf', 2500, 'USD', 10, 'Accessories']);
    const listing1 = l1Res.rows[0];

    const l2Res = await client.query('INSERT INTO "Listing" (id, seller_id, title, description, price_minor, currency, quantity_available, category, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *', [uuidv4(), seller1.id, 'Knitted Beanie', 'Cozy beanie hat', 1500, 'USD', 5, 'Accessories']);
    const listing2 = l2Res.rows[0];

    const l3Res = await client.query('INSERT INTO "Listing" (id, seller_id, title, description, price_minor, currency, quantity_available, category, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *', [uuidv4(), seller2.id, 'Custom Denim Jacket', 'Vintage denim jacket with patches', 12000, 'USD', 2, 'Outerwear']);
    const listing3 = l3Res.rows[0];

    const l4Res = await client.query('INSERT INTO "Listing" (id, seller_id, title, description, price_minor, currency, quantity_available, category, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *', [uuidv4(), seller2.id, 'Hand-sewn Cotton Dress', 'Summer dress', 6500, 'USD', 3, 'Dresses']);
    const listing4 = l4Res.rows[0];

    // 4. Create 2 Orders with OrderItems
    const o1Res = await client.query('INSERT INTO "Order" (id, buyer_id, status, total_amount_minor, currency, idempotency_key, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *', [uuidv4(), buyer1.id, 'DELIVERED', 4000, 'USD', uuidv4()]);
    const order1 = o1Res.rows[0];
    
    await client.query('INSERT INTO "OrderItem" (id, order_id, listing_id, quantity, price_at_purchase_minor, currency, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())', [uuidv4(), order1.id, listing1.id, 1, 2500, 'USD']);
    await client.query('INSERT INTO "OrderItem" (id, order_id, listing_id, quantity, price_at_purchase_minor, currency, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())', [uuidv4(), order1.id, listing2.id, 1, 1500, 'USD']);

    const o2Res = await client.query('INSERT INTO "Order" (id, buyer_id, status, total_amount_minor, currency, idempotency_key, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *', [uuidv4(), buyer2.id, 'PENDING', 12000, 'USD', uuidv4()]);
    const order2 = o2Res.rows[0];
    
    await client.query('INSERT INTO "OrderItem" (id, order_id, listing_id, quantity, price_at_purchase_minor, currency, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())', [uuidv4(), order2.id, listing3.id, 1, 12000, 'USD']);

    // 5. Create 1-2 Reviews
    await client.query('INSERT INTO "Review" (id, buyer_id, listing_id, rating, comment, updated_at) VALUES ($1, $2, $3, $4, $5, NOW())', [uuidv4(), buyer1.id, listing1.id, 5, 'Absolutely love this scarf!']);

    console.log('Seeding finished.')
  } finally {
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
