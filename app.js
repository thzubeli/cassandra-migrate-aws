#!/usr/bin/env node
'use strict'

const program = require('commander')
const Common = require('./util/common')
const fs = require('fs')
const db = require('./util/database')
const path = require('path')
const keyspace = require('./util/keyspace')

/**
 * Usage information.
 */

const usage = [
  '',
  '  example : ',
  '',
  '  cassandra-migrate <command> [options]',
  '',
  '  cassandra-migrate up -k <keyspace> (Runs All pending cassandra migrations)',
  '',
  '  cassandra-migrate down -k <keyspace> (Rolls back a single cassandra migration)',
  '',
  '  cassandra-migrate <up/down> -n <migration_number>. (Runs cassandra migrations UP or DOWN to a particular migration number).',
  '',
  '  cassandra-migrate <up/down> -k <keyspace> -s <migration_number> (skips a migration, either adds or removes the migration from the migration table)',
  '',
  '  cassandra-migrate <up/down> -smtc (skips the check after asynchronous migration table creation on AWS, when you work locally with standard Cassandra for example)',
  '',
  '  cassandra-migrate create <migration_name>. (Creates a new cassandra migration)',
  '',
  '  cassandra-migrate create <migration_name> -t <template> (Creates a new cassandra migrate but uses a specified template instead of default).',
  ''

].join('\n')

program.on('--help', function () {
  console.log(usage)
})

program
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version)
  .option('-k, --keyspace "<keyspace>"', 'The name of the keyspace to use.')
  .option('-H, --hosts "<host,host>"', 'Comma seperated host addresses. Default is ["localhost"].')
  .option('-u, --username "<username>"', 'database username')
  .option('-p, --password "<password>"', 'database password')
  .option('-o, --optionFile "<pathToFile>"', 'pass in a javascript option file for the cassandra driver, note that certain option file values can be overridden by provided flags')
  .option('-m, --migrations "<pathToFolder>"', 'pass in folder to use for migration files')

program.name = 'cassandra-migrate-aws'

program
  .command('create <title>')
  .description('initialize a new migration file with title.')
  .option('-t, --template "<template>"', 'sets the template for create')
  .action((title, options) => {
    let Create = require('./commands/create')
    let create = Create(options.template, options.parent.migrations)
    create.newMigration(title)
    process.exit(0)
  })

program
  .command('up')
  .description('run pending migrations')
  .option('-n, --num "<number>"', 'run migrations up to a specified migration number')
  .option('-s, --skip "<number>"', 'adds the specified migration to the migration table without actually running it', false)
  .option('-c, --create', 'Create the keyspace if it doesn\'t exist.')
  .option('--skipMigrationTableCheck', 'skips the check after asynchronous migration table creation on AWS, when you work locally with plain Cassandra for example')
  .action((options) => {
    const dbConnection = db.getConnection(program)
    const common = Common(dbConnection)

    // Parallelize Cassandra prep and scanning for migration files to save time.
    Promise.all([
      keyspace.checkKeyspace(program, options.create)
        .then(() => common.createMigrationTable(dbConnection.keyspace, options.skipMigrationTableCheck))
        .then(() => common.getMigrations()),
      common.getMigrationFiles(options.parent.migrations || process.cwd())
    ])
      .then(migrationInfo => common.getMigrationSet(migrationInfo, 'up', options.num))
      .then((migrationLists) => {
        const Up = require('./commands/up')
        const up = Up(dbConnection, migrationLists)
        if (!options.skip) {
          console.log('processing migration lists')
          console.log(migrationLists)
        }
        up.runPending(options.skip)
          .then(result => {
            console.log(result)
            process.exit(0)
          }, error => {
            console.log(error)
            process.exit(1)
          })
      })
      .catch(error => {
        console.log(error)
        process.exit(1)
      })
  })

program
  .command('down')
  .description('roll back already run migrations')
  .option('-n, --num "<number>"', 'rollback migrations down to a specified migration number')
  .option('-s, --skip "<number>"', 'removes the specified migration from the migration table without actually running it', false)
  .option('-smtc, --skipMigrationTableCheck', 'skips the check after asynchronous migration table creation on AWS, when you work locally with plain Cassandra for example')
  .action((options) => {
    const dbConnection = db.getConnection(program)
    const common = Common(dbConnection)

    // Parallelize Cassandra prep and scanning for migration files to save time.
    Promise.all([
      common.createMigrationTable(dbConnection.keyspace, options.skipMigrationTableCheck)
        .then(() => common.getMigrations()),
      common.getMigrationFiles(options.parent.migrations || process.cwd())
    ])
      .then(migrationInfo => common.getMigrationSet(migrationInfo, 'down', options.num))
      .then((migrationLists) => {
        console.log('processing migration lists')
        const Down = require('./commands/down')
        const down = Down(dbConnection, migrationLists)
        if (!options.skip) {
          console.log('processing migration lists')
          console.log(migrationLists)
        }
        down.runPending(options.skip)
          .then(result => {
            console.log(result)
            process.exit(0)
          }, error => {
            console.log(error)
            process.exit(1)
          })
      })
      .catch(error => {
        console.log(error)
        process.exit(1)
      })
  })

program.parse(process.argv)
