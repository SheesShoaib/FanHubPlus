function rateLimit({ windowMs = 60 * 1000, max = 30, message = "Too many requests, please slow down." } = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ msg: message });
    }

    next();
  };
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many attempts. Try again in a few minutes." });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: "Too many submissions. Please wait a bit." });
const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

module.exports = { rateLimit, authLimiter, chatLimiter, formLimiter, trackLimiter };
