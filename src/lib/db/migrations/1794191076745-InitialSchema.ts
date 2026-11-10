import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1794191076745 implements MigrationInterface {
  name = "InitialSchema1794191076745";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopify_customer_id" bigint NOT NULL, "email" text, "first_name" text, "last_name" text, "phone" text, "tags" text array, "lifetime_value" numeric, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_a5277c1e143cf5c38634f99f461" UNIQUE ("shopify_customer_id"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "shopify_inventory_item_id" bigint NOT NULL, "shopify_location_id" bigint NOT NULL, "location_name" text, "available" integer NOT NULL, "on_hand" integer NOT NULL, "committed" integer NOT NULL, "low_stock_threshold" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e193dd8b8e89ca37252a783a8c3" UNIQUE ("product_id", "shopify_location_id"), CONSTRAINT "PK_7d6c5977afc35996c6a42830d05" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'converted', 'lost')`,
    );
    await queryRunner.query(
      `CREATE TABLE "leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text, "first_name" text, "last_name" text, "phone" text, "city" text, "state" text, "company" text, "source" text, "status" "public"."lead_status" NOT NULL DEFAULT 'new', "tags" text array, "notes" text, "customer_id" uuid, "linked_at" TIMESTAMP WITH TIME ZONE, "link_source" text, "import_batch_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b3eea7add0e16594dba102716c5" UNIQUE ("email"), CONSTRAINT "REL_16d9cef47004d4053b548d3017" UNIQUE ("customer_id"), CONSTRAINT "CHK_39f59c35b257046ecd66f0797a" CHECK (("customer_id" IS NULL) = ("linked_at" IS NULL)), CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_12c6b151cbd7f9724ef3df2aa4" ON "leads"  ("customer_id") WHERE "customer_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopify_order_id" bigint NOT NULL, "customer_id" uuid NOT NULL, "total_price" numeric, "financial_status" text, "fulfillment_status" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_3670ff07e072128e2149f0bd010" UNIQUE ("shopify_order_id"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "body" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "customer_id" uuid, "order_id" uuid, "inventory_id" uuid, CONSTRAINT "CHK_0c3ec3c7bed68867b8f2b799f2" CHECK (num_nonnulls("customer_id", "order_id", "inventory_id") = 1), CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ed637f48c2338acb4ceac169e" ON "notes"  ("customer_id") WHERE "customer_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c71bf31a6963045930abdfc6c0" ON "notes"  ("order_id") WHERE "order_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_544a0284962560398cba1f9856" ON "notes"  ("inventory_id") WHERE "inventory_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."product_status" AS ENUM('active', 'draft', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopify_product_id" bigint NOT NULL, "shopify_variant_id" bigint NOT NULL, "title" text, "vendor" text, "product_type" text, "status" "public"."product_status", "image_url" text, "sku" text, "price" numeric, "tracks_inventory" boolean, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_0aa8b1eb1d96757a451f0c5b815" UNIQUE ("shopify_variant_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f16f24f1b961af087fe188b54" ON "products"  ("shopify_product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopify_line_item_id" bigint NOT NULL, "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "shopify_variant_id" bigint, "title" text, "sku" text, "quantity" integer NOT NULL, "unit_price" numeric NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_076bd67fa09fb30664571f7f214" UNIQUE ("shopify_line_item_id"), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."outbox_entity" AS ENUM('customers', 'orders', 'leads', 'products', 'inventory')`,
    );
    await queryRunner.query(
      `CREATE TABLE "outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity" "public"."outbox_entity" NOT NULL, "entity_id" uuid NOT NULL, "operation" text NOT NULL, "status" text NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "last_error" text, "idempotency_key" text NOT NULL, "shopify_id" bigint, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0a4005b6a3155709204b10740a9" UNIQUE ("idempotency_key"), CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_levels" ADD CONSTRAINT "FK_7792c1963178f365bb15aeb8631" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_16d9cef47004d4053b548d3017a" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_e04c36c14bc9f01f84cd7655b68" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_8379244139d5bd1aa28bc382c86" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_c28ce309692c016c04fc41872d5" FOREIGN KEY ("inventory_id") REFERENCES "inventory_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_c28ce309692c016c04fc41872d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_8379244139d5bd1aa28bc382c86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_e04c36c14bc9f01f84cd7655b68"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" DROP CONSTRAINT "FK_16d9cef47004d4053b548d3017a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_levels" DROP CONSTRAINT "FK_7792c1963178f365bb15aeb8631"`,
    );
    await queryRunner.query(`DROP TABLE "outbox"`);
    await queryRunner.query(`DROP TYPE "public"."outbox_entity"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f16f24f1b961af087fe188b54"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."product_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_544a0284962560398cba1f9856"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c71bf31a6963045930abdfc6c0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9ed637f48c2338acb4ceac169e"`,
    );
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12c6b151cbd7f9724ef3df2aa4"`,
    );
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TYPE "public"."lead_status"`);
    await queryRunner.query(`DROP TABLE "inventory_levels"`);
    await queryRunner.query(`DROP TABLE "customers"`);
  }
}
