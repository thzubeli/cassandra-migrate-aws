# Cassandra-migrate-AWS

cassandra-migrate-aws is an incremental migration tool for Cassandra, compatible with AWS Keyspaces.

## Purpose
This tool is an improvement of the [cassandra-migrate](https://github.com/TimBailey-pnk/cassandra-migrate_orig) package.

It handles [AWS Keyspaces for Cassandra](https://aws.amazon.com/fr/keyspaces) specificities: [asynchronous table creation](https://docs.aws.amazon.com/keyspaces/latest/devguide/working-with-tables.html), [no prepared statement for DDL operations](https://docs.aws.amazon.com/keyspaces/latest/devguide/functional-differences.html), etc.

## Features
- Uses the node cassandra-driver to run incremental migrations on Cassandra database.
- Uses Cassandra keyspace mentioned in commandline to keep track of ran migrations.
- Automatically builds and run UP or DOWN until any migration number.
- Creates a new incremental migration template by a single command.
- Uses the given folder for migration files
- Allow to skip AWS Keyspaces specificities to be compatible with basic Cassandra installation (eg: for local tests)

## Installation

Install [node.js](http://nodejs.org/) and [cassandra](http://cassandra.apache.org/). Then:

```
npm install -D cassandra-migrate-aws
```
or
```
yarn add -D cassandra-migrate-aws
```

## Overview

### Basic Usage

Creates a new migration with a timestamped migration number ( Used for tracking migrations ).

```
cassandra-migrate-aws create <title>
```

Runs all migrations available in current directory.

```
cassandra-migrate-aws up -k <keyspace>
```

Rolls back all migrations in the migrations table.

```
cassandra-migrate-aws down -k <keyspace>
```

Goes back/forward to a particular migration automatically.

```
cassandra-migrate-aws <up/down> -k <keyspace> -n <migration-number>
```

Skips a particular migration (either adds or removes the migration from the table without running any scripts.

```
cassandra-migrate-aws <up/down> -k <keyspace> -s <migration-number>
```

Define host, username, and password. By default connects to [localhost] and default cassandra port [9042].

```
cassandra-migrate-aws -H [10.10.10.1] -u username -p password
```

Cassandra connection details can also be specified in environmental variables
```
    DBHOST : sets hostname
    DBKEYSPACE : sets keyspace
    DBUSER : sets username
    DBPASSWORD : sets password;
```

Connection details can also be specified in a configuration file. You can point to the file's relative path with:
```
cassandra-migrate-aws -o <path/to/file.js>
```

More help.

```
cassandra-migrate-aws --help
```

## License

cassandra-migrate-aws is distributed under the [MIT license](http://opensource.org/licenses/MIT).

## Contributions

Feel free to join in and support the project!

Check the [Issue tracker](https://github.com/thzubeli/cassandra-migrate-aws/issues)
