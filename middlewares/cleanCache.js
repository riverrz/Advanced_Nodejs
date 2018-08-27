const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  // Clear cache only after route handler function is complete
  await next(); // lets the route handler run first, then run the middle ware
  clearHash(req.user.id);
};
