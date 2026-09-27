#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5a3e234946d6eee302eb658750cecab590483b8fa06822da92a1499fa673777c/contract';
import endContract from '../../snapshots/5a3e234946d6eee302eb658750cecab590483b8fa06822da92a1499fa673777c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'OrderStatus',
        members: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      }),
      this.createTable({
        schema: 'public',
        table: 'Buyer',
        columns: [
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('deleted_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('gen_random_uuid()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Listing',
        columns: [
          col('category', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('currency', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('deleted_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('gen_random_uuid()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('price_minor', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('quantity_available', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('seller_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Order',
        columns: [
          col('buyer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('currency', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('gen_random_uuid()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('idempotency_key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"OrderStatus"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'OrderStatus' } },
          }),
          col('total_amount_minor', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'OrderItem',
        columns: [
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('currency', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('gen_random_uuid()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('listing_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('price_at_purchase_minor', 'int4', {
            notNull: true,
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Review',
        columns: [
          col('buyer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('deleted_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('gen_random_uuid()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('listing_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('rating', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Seller',
        columns: [
          col('created_at', 'timestamp(3)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('deleted_at', 'timestamp(3)', {
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn('gen_random_uuid()'),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('store_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-temporal@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Buyer',
        index: 'Buyer_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Listing',
        index: 'Listing_category_created_at_idx',
        columns: ['category', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Listing',
        index: 'Listing_seller_id_idx',
        columns: ['seller_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_buyer_id_created_at_idx',
        columns: ['buyer_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_idempotency_key_key',
        columns: ['idempotency_key'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrderItem',
        index: 'OrderItem_order_id_listing_id_idx',
        columns: ['order_id', 'listing_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Review',
        index: 'Review_buyer_id_listing_id_key',
        columns: ['buyer_id', 'listing_id'],
        extras: { unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'Seller',
        index: 'Seller_email_key',
        columns: ['email'],
        extras: { unique: true },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Listing',
        foreignKey: {
          name: 'Listing_seller_id_fkey',
          columns: ['seller_id'],
          references: { schema: 'public', table: 'Seller', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Order',
        foreignKey: {
          name: 'Order_buyer_id_fkey',
          columns: ['buyer_id'],
          references: { schema: 'public', table: 'Buyer', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrderItem',
        foreignKey: {
          name: 'OrderItem_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'Order', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrderItem',
        foreignKey: {
          name: 'OrderItem_listing_id_fkey',
          columns: ['listing_id'],
          references: { schema: 'public', table: 'Listing', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Review',
        foreignKey: {
          name: 'Review_buyer_id_fkey',
          columns: ['buyer_id'],
          references: { schema: 'public', table: 'Buyer', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Review',
        foreignKey: {
          name: 'Review_listing_id_fkey',
          columns: ['listing_id'],
          references: { schema: 'public', table: 'Listing', columns: ['id'] },
          onDelete: 'restrict',
          onUpdate: 'cascade',
        },
      }),
      this.addCheckConstraint({ schema: 'public', table: 'Listing', constraint: 'listing_price_minor_positive', expression: 'price_minor > 0' }),
      this.addCheckConstraint({ schema: 'public', table: 'Listing', constraint: 'listing_quantity_available_nonnegative', expression: 'quantity_available >= 0' }),
      this.addCheckConstraint({ schema: 'public', table: 'OrderItem', constraint: 'order_item_quantity_positive', expression: 'quantity > 0' }),
      this.addCheckConstraint({ schema: 'public', table: 'OrderItem', constraint: 'order_item_price_minor_positive', expression: 'price_at_purchase_minor > 0' }),
      this.addCheckConstraint({ schema: 'public', table: 'Review', constraint: 'review_rating_valid', expression: 'rating >= 1 AND rating <= 5' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
