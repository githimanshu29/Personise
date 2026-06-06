export function authGuard(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "").trim();
  if (!token || token !== process.env.INGEST_API_KEY) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  next();
}
