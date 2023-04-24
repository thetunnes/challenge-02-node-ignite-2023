import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  await knex.schema.createTable("meals", (table) => {
    table.uuid("id").primary();
    table.text("dish").notNullable();
    table.text("description").notNullable();
    table.uuid("user_id").references('users.id').notNullable();
    table.text("diet").notNullable();
    table.timestamp("date_time").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
  })
}


export async function down(knex: Knex): Promise<void> {

  await knex.schema.dropTable("meals")
}

