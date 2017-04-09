const migration1456515707 = {
  up: function (db, handler) {
    db.execute(
      `CREATE TABLE IF NOT EXISTS user_by_email_1 (
                          email TEXT,
                          alternate_email MAP<TEXT, TEXT>,
                          userid TIMEUUID,
                          username TEXT,
                         PRIMARY KEY (email)
                     );`,
      null,
      {
        prepare: true
      },
      function (err) {
        handler(err, null)
      })
  },
  down: function (db, handler) {
    db.execute(
      `DROP TABLE user_by_email_1;`,
      null,
      {
        prepare: true
      },
      function (err) {
        handler(err, null)
      })
  }
}
module.exports = migration1456515707
