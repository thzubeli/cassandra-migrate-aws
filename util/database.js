'use strict'

const cassandra = require('cassandra-driver')

class Database {
  constructor (settings) {
    if (settings.optionFile) {
      this.driverOptions = require(`${process.cwd()}/${settings.optionFile}`)
    } else {
      this.driverOptions = {}
    }
    settings.hosts = (settings.hosts) ? settings.hosts.split(',') : undefined
    let envHosts = (process.env.DBHOST) ? process.env.DBHOST.split(',') : undefined
    let hosts = settings.hosts || envHosts

    this.driverOptions.contactPoints = hosts || this.driverOptions.contactPoints || [ 'localhost' ]
    this.driverOptions.keyspace = settings.keyspace || process.env.DBKEYSPACE || this.driverOptions.keyspace

    const username = settings.username || process.env.DBUSER
    const password = settings.password || process.env.DBPASSWORD

    if (username && password) {
      this.driverOptions.authProvider = new cassandra.auth.PlainTextAuthProvider(username, password)
    }

    let client = new cassandra.Client(this.driverOptions)

    // client.on('log', function (level, className, message, furtherInfo) {
    //  console.log('log event: %s -- %s', level, message);
    // });

    return client
  }
}

module.exports = Database
