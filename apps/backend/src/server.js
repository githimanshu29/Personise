import "dotenv/config";
import { connectMongo } from "./db/mongo.js";
import { connectRedis } from "./db/redis.js";

const port = process.env.PORT || 3001;

await connectMongo();
await connectRedis();

const { default: app } = await import("./app.js");

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
