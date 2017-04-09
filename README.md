# Cassandra-migrate

Cassandra-migrate is a incremental migration tool for Cassandra.

## Version 1.3.0 update
- Allow migrations folder to be specified using the `--migrations` command-line switch.
- Refactored code to StandardJS.
- Replaced classes with factory functions.
- Allow keyspace to be created when using the `up` command with the `--create` command-line switch.

## Version 1.2.0 update
Just added support for more robust Cassandra client configuration, now you can provide a path to a configuration file that can specify a Cassandra client option object directly as javascript.
Cassandra client options configuration can found [here](http://docs.datastax.com/en/latest-nodejs-driver-api/global.html#ClientOptions). A user
can override the client options file using either the command line flags, or environment variables

## Version 1.1.2 update
the format of the migration table has changed, to facilitate the change over I've included an example migration file (0000000000_updateMigrationTable.js)
that should nondestructivly update the migration table to the new format, just copy it into your migrations folder and run it before running any other migrations

## Features
- Uses the node cassandra-driver  to run incremental migrations on Cassandra database.
- Uses Cassandra keyspace mentioned in commandline to keep track of ran migrations.
- Automatically builds and run UP or DOWN until any migration number.
- Creates a new incremental migration template by a single command.


## Installation

Install [node.js](http://nodejs.org/) and [cassandra](http://cassandra.apache.org/) and [cassandra-driver](https://www.npmjs.com/package/cassandra-driver). Then:

```
npm install cassandra-migrate
```

## Overview

### Basic Usage

Creates a new migration with a timestamped migration number ( Used for tracking migrations ).

```
    cassandra-migrate create <title>
```

Runs all migrations available in current directory.

```
    cassandra-migrate up -k <keyspace>
```

Rolls back all migrations in the migrations table.

```
    cassandra-migrate down -k <keyspace>
```


Goes back/forward to a particular migration automatically.

```
    cassandra-migrate <up/down> -k <keyspace> -n <migration-number>
```

Skips a particular migration (either adds or removes the migration from the table without running any scripts.

```
    cassandra-migrate <up/down> -k <keyspace> -s <migration-number>
```

Define host, username, and password. By default connects to [localhost] and default cassandra port [9042].

```
    cassandra-migrate -H [10.10.10.1] -u username -p password
```

Cassandra connection details can also be specified in environmental variables
```
    DBHOST : sets hostname
    DBKEYSPACE : sets keyspace
    DBUSER : sets username
    DBPASSWORD : sets password;
```

As of 1.2.0 Cassandra connection details can now also be specified in configuration file [example](https://github.com/rleenders/cassandra-migrate/blob/options-file-flag/examples/sampleOptionFile.js) you can point to the file's relative path with:
```
  cassandra-migrate -o <path/to/file.js>
```

More help.

```
    cassandra-migrate --help
```

## License

cassandra-migrate is distributed under the [MIT license](http://opensource.org/licenses/MIT).

## Contributions

Feel free to join in and support the project!

Check the [Issue tracker](https://github.com/rleenders/cassandra-migrate/issues)
