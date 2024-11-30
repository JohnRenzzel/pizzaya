import NextAuth from "next-auth";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

const handler = NextAuth(authOptions);
mongoose.connect(process.env.MONGO_URL);
export { handler as GET, handler as POST };
