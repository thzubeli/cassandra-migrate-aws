
const migration1489710992 = {
  up: function (db, handler) {
    return Promise.resolve()
      .then(() => {
        console.log(1)
        return db.execute('CREATE TABLE IF NOT EXISTS user (id uuid PRIMARY KEY);')
      })
      .then(() => {
        handler(null, 'Done')
      })
      .catch(err => {
        console.error(err)
        handler(err)
      })
  },

  down: function (db, handler) {
    handler(null, 'Done')
  }
}

module.exports = migration1489710992
