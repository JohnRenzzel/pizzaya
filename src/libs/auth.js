import clientPromise from "@/libs/mongoConnect";
import bcrypt from "bcrypt";
import * as mongoose from "mongoose";
import { User } from "@/models/User";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";

export const authOptions = {
  secret: process.env.SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        username: {
          label: "Email",
          type: "email",
          placeholder: "test@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email;
        const password = credentials?.password;

        mongoose.connect(process.env.MONGO_URL);
        const user = await User.findOne({ email });
        const passwordOk = user && bcrypt.compareSync(password, user.password);

        if (passwordOk) {
          return user;
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await mongoose.connect(process.env.MONGO_URL);

        if (account.provider === "google") {
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user for Google sign-in with explicit default values
            existingUser = await User.create({
              email: user.email,
              name: user.name || profile.name,
              image: user.image,
              googleAuth: true,
              password: "",
              // Explicitly set admin flags to false
              isAdmin: false,
              superAdmin: false,
              isStaff: false,
            });
          } else {
            // If user exists, only update Google-related fields
            await User.findOneAndUpdate(
              { email: user.email },
              {
                $set: {
                  googleAuth: true,
                  name: user.name || profile.name,
                  image: user.image,
                },
              }
            );
          }

          // Add user ID to the profile
          user.id = existingUser._id.toString();
          return true;
        }

        // For credentials login
        if (account.provider === "credentials") {
          const existingUser = await User.findOne({ email: user.email });
          if (existingUser?.googleAuth) {
            return false;
          }
        }

        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.userId = user.id;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        const user = await User.findById(token.userId);
        if (user) {
          session.user.id = user._id.toString();
          session.user.superAdmin = user.superAdmin;
          session.user.isAdmin = user.isAdmin;
          session.user.isStaff = user.isStaff;
          session.user.branchId = user.branchId?.toString();
          session.user.provider = token.provider;
        }
      }
      return session;
    },
  },
};
