const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const client = redis.createClient("redis://127.0.0.1:6379");

client.get = util.promisify(client.get);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function() {
  this.useCache = true;
  return this; // to make it chainable after .cache()
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // checking if key exists in redis and return result
  const cacheValue = await client.get(key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map(blog => new this.model(blog))
      : new this.model(doc);
  }
  // else, issue query and store result in redis

  const result = await exec.apply(this, arguments);
  client.set(key, JSON.stringify(result));
  return result;
};
