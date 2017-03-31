'use strict';

/**
 * A method to create incremental new migrations
 * on create migration command.
 * e.g. cassandra-migration create
 * @param path
 */

class Create {

  constructor(fs, templateFile, migrationsFolder) {
    this.fs = fs;
    this.dateString = Math.floor(Date.now() / 1000) + '';
    this.migrationsFolder = migrationsFolder || process.cwd()

    var template = `
var migration${this.dateString} = {
  up: function (db, handler) {
    return Promise.resolve()
      .then(() => {
        console.log(1)
        return db.execute('')
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
  }
}

module.exports = migration${this.dateString}`;

    if (templateFile) {
      template = this.fs.readFileSync(templateFile);
      let tpl = new Function("return `" + template + "`;");
      template = tpl.call(this);
    }
    this.template = template;
  }

  newMigration(title) {
    var reTitle = /^[a-z0-9\_]*$/i;
    if (!reTitle.test(title)) {
      console.log("Invalid title. Only alphanumeric and '_' title is accepted.");
      process.exit(1);
    }

    var fileName = `${this.dateString}_${title}.js`;
    this.fs.writeFileSync(`${this.migrationsFolder}/${fileName}`, this.template);
    console.log(`Created a new migration file with name ${fileName}`);
  }
}

module.exports = Create;
