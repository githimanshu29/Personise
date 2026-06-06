import "dotenv/config";
import app from "./app.js";
import { connectMongo } from "./db/mongo.js";
import { connectRedis } from "./db/redis.js";

const port = process.env.PORT || 3001;

await connectMongo();
await connectRedis();

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
