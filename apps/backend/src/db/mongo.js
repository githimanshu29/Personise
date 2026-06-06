import mongoose from "mongoose";

let connected = false;

export async function connectMongo() {
  if (connected) return;
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    throw new Error("MONGODB_URI and MONGODB_DB_NAME are required");
  }
  await mongoose.connect(uri, { dbName });
  connected = true;
}

export async function disconnectMongo() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
