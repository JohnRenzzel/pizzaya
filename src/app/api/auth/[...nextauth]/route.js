import NextAuth from "next-auth";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Ensure MongoDB connection before handling auth requests
const connectDB = async () => {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGO_URL);
      console.log("MongoDB connected successfully");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};

const handler = async (req, res) => {
  await connectDB();
  return NextAuth(authOptions)(req, res);
};

export { handler as GET, handler as POST };
