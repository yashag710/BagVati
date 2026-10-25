// Express 4 ignores rejected promises from async handlers (Node then exits);
// forward them to the error handler in app.js instead.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
