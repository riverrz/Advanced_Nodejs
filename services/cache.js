const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const client = redis.createClient("redis://127.0.0.1:6379");

client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.hashKey = JSON.stringify(options.key || "");
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
  const cacheValue = await client.hget(this.hashKey, key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map(blog => new this.model(blog))
      : new this.model(doc);
  }
  // else, issue query and store result in redis

  const result = await exec.apply(this, arguments);
  client.hset(this.hashKey, key, JSON.stringify(result), "EX", 10);
  return result;
};
