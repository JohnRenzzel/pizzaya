import NextAuth from "next-auth";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Ensure MongoDB connection
mongoose.connect(process.env.MONGO_URL);

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
