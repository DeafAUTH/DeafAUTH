import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('email').unique();
    table.string('name');
    table.string('password_hash').nullable();
    table.string('external_provider').nullable();
    table.string('external_id').nullable();
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').nullable();
    table.timestamp('last_login').nullable();
    
    table.index(['email']);
    table.index(['external_provider', 'external_id']);
  });

  // Tenants table
  await knex.schema.createTable('tenants', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.enum('type', ['organization', 'company', 'startup', 'individual']).notNullable();
    table.enum('plan', ['free', 'starter', 'business', 'enterprise']).notNullable();
    table.string('domain').nullable();
    table.integer('user_limit').notNullable();
    table.integer('current_users').defaultTo(0);
    table.boolean('active').defaultTo(true);
    table.timestamp('created_at').notNullable();
    
    table.index(['domain']);
    table.index(['type']);
  });

  // Tenant users association
  await knex.schema.createTable('tenant_users', (table) => {
    table.string('tenant_id').notNullable();
    table.string('user_id').notNullable();
    table.enum('role', ['owner', 'admin', 'member', 'guest']).notNullable();
    table.timestamp('joined_at').notNullable();
    table.boolean('active').defaultTo(true);
    
    table.primary(['tenant_id', 'user_id']);
    table.foreign('tenant_id').references('tenants.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    table.index(['user_id']);
  });

  // Refresh tokens
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('tenant_id').nullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('expires_at').notNullable();
    
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('tenant_id').references('tenants.id').onDelete('SET NULL');
    
    table.index(['user_id']);
    table.index(['expires_at']);
  });

  // User preferences (accessibility settings)
  await knex.schema.createTable('user_preferences', (table) => {
    table.string('user_id').primary();
    table.jsonb('preferences').notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
    
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  });

  // Consents (signed consent becomes key for PinkSync)
  await knex.schema.createTable('consents', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('partner_id').notNullable();
    table.string('tenant_id').nullable();
    table.jsonb('scope').notNullable();
    table.jsonb('preferences').notNullable();
    table.enum('status', ['active', 'revoked', 'expired']).notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at').nullable();
    
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('tenant_id').references('tenants.id').onDelete('SET NULL');
    
    table.index(['user_id']);
    table.index(['partner_id']);
    table.index(['status']);
    table.index(['expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('consents');
  await knex.schema.dropTableIfExists('user_preferences');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('tenant_users');
  await knex.schema.dropTableIfExists('tenants');
  await knex.schema.dropTableIfExists('users');
}
