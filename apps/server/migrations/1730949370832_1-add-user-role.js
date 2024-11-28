/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable('User', {
        id: {
          type: 'string',
          primaryKey: true,
        },
      });
      pgm.createTable('Role', {
        id: 'id',
        name: {
          type: 'string',
        },
        daoId: {
          type: 'string',
        },
      });
      pgm.createTable('UserRole', {
        id: 'id',
        userId: {
          type: 'string',
          notNull: true,
          references: '"User"',
          onDelete: 'cascade',
        },
        roleId: {
          type: 'integer',
          notNull: true,
          references: '"Role"',
          onDelete: 'cascade',
        },
      });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {};
