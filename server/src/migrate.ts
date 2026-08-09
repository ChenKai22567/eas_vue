import type { Knex } from 'knex'

export async function migrate(db: Knex) {
  if (!(await db.schema.hasTable('roles'))) {
    await db.schema.createTable('roles', table => {
      table.increments('id').primary()
      table.string('role_name', 80).notNullable().unique()
      table.string('role_desc', 255).notNullable().defaultTo('')
      table.timestamps(true, true)
    })
  }

  if (!(await db.schema.hasTable('rights'))) {
    await db.schema.createTable('rights', table => {
      table.integer('id').primary()
      table.string('auth_name', 80).notNullable()
      table.string('path', 120).notNullable().defaultTo('')
      table.integer('level').notNullable()
      table.integer('pid').notNullable().defaultTo(0)
      table.string('permission_code', 100).notNullable().unique()
    })
  }

  if (!(await db.schema.hasTable('role_rights'))) {
    await db.schema.createTable('role_rights', table => {
      table.integer('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table.integer('right_id').notNullable().references('id').inTable('rights').onDelete('CASCADE')
      table.primary(['role_id', 'right_id'])
    })
  }

  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', table => {
      table.increments('id').primary()
      table.string('username', 50).notNullable().unique()
      table.string('password_hash', 255).notNullable()
      table.string('email', 160).notNullable().defaultTo('')
      table.string('mobile', 32).notNullable().defaultTo('')
      table.boolean('state').notNullable().defaultTo(true)
      table.integer('role_id').notNullable().references('id').inTable('roles').onDelete('RESTRICT')
      table.boolean('force_password_change').notNullable().defaultTo(false)
      table.integer('token_version').notNullable().defaultTo(0)
      table.timestamps(true, true)
    })
  }

  if (!(await db.schema.hasTable('categories'))) {
    await db.schema.createTable('categories', table => {
      table.increments('id').primary()
      table.string('name', 120).notNullable()
      table.integer('pid').notNullable().defaultTo(0)
      table.integer('level').notNullable().defaultTo(0)
      table.boolean('deleted').notNullable().defaultTo(false)
      table.unique(['pid', 'name'])
    })
  }

  if (!(await db.schema.hasTable('category_attributes'))) {
    await db.schema.createTable('category_attributes', table => {
      table.increments('id').primary()
      table.integer('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE')
      table.string('name', 120).notNullable()
      table.string('attr_sel', 12).notNullable()
      table.text('attr_vals').notNullable().defaultTo('')
      table.unique(['category_id', 'name', 'attr_sel'])
    })
  }

  if (!(await db.schema.hasTable('goods'))) {
    await db.schema.createTable('goods', table => {
      table.increments('id').primary()
      table.string('name', 180).notNullable().unique()
      table.decimal('price', 12, 2).notNullable().defaultTo(0)
      table.integer('number').notNullable().defaultTo(1)
      table.decimal('weight', 12, 2).notNullable().defaultTo(0)
      table.integer('state').notNullable().defaultTo(2)
      table.integer('category_id').nullable().references('id').inTable('categories').onDelete('SET NULL')
      table.string('goods_cat', 80).notNullable().defaultTo('')
      table.text('introduce').notNullable().defaultTo('')
      table.timestamps(true, true)
    })
  }

  if (!(await db.schema.hasTable('goods_pictures'))) {
    await db.schema.createTable('goods_pictures', table => {
      table.increments('id').primary()
      table.integer('goods_id').notNullable().references('id').inTable('goods').onDelete('CASCADE')
      table.string('path', 255).notNullable()
      table.string('url', 255).notNullable()
    })
  }

  if (!(await db.schema.hasTable('goods_attributes'))) {
    await db.schema.createTable('goods_attributes', table => {
      table.increments('id').primary()
      table.integer('goods_id').notNullable().references('id').inTable('goods').onDelete('CASCADE')
      table.integer('attribute_id').notNullable().references('id').inTable('category_attributes').onDelete('CASCADE')
      table.text('value').notNullable().defaultTo('')
      table.unique(['goods_id', 'attribute_id'])
    })
  }

  if (!(await db.schema.hasTable('orders'))) {
    await db.schema.createTable('orders', table => {
      table.increments('id').primary()
      table.string('order_number', 64).notNullable().unique()
      table.string('invoice_title', 120).notNullable().defaultTo('')
      table.integer('pay_status').notNullable().defaultTo(0)
      table.string('is_send', 20).notNullable().defaultTo('否')
      table.string('consignee_addr', 255).notNullable().defaultTo('')
      table.string('status', 24).notNullable().defaultTo('待执行')
      table.integer('goods_id').nullable().references('id').inTable('goods').onDelete('SET NULL')
      table.timestamps(true, true)
    })
  }

  if (!(await db.schema.hasTable('order_events'))) {
    await db.schema.createTable('order_events', table => {
      table.increments('id').primary()
      table.integer('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.dateTime('event_time').notNullable()
      table.string('context', 255).notNullable()
      table.string('location', 180).notNullable().defaultTo('')
    })
  }
}
