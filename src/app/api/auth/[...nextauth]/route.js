import NextAuth from "next-auth";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Ensure MongoDB connection before handling auth requests
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("Please define the MONGO_URL environment variable");
    }

    if (mongoose.connections[0].readyState) {
      return; // Already connected
    }

    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Don't throw here, let auth continue even if DB connection fails
    console.warn(
      "Proceeding with authentication despite DB connection failure"
    );
  }
};

const handler = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // Continue with auth even if DB connection fails
  }
  return NextAuth(authOptions)(req, res);
};

export { handler as GET, handler as POST };
