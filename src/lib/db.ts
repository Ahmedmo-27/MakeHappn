import mongoose from "mongoose";

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & { mongooseCache?: Cache };

function cache(): Cache {
  if (!globalCache.mongooseCache) {
    globalCache.mongooseCache = { conn: null, promise: null };
  }
  return globalCache.mongooseCache;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const state = cache();
  if (state.conn) return state.conn;
  if (!state.promise) {
    state.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  state.conn = await state.promise;
  return state.conn;
}
