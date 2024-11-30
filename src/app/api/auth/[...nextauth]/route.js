import clientPromise from "@/libs/mongoConnect";
import { UserInfo } from "@/models/UserInfo";
import bcrypt from "bcrypt";
import * as mongoose from "mongoose";
import { User } from "@/models/User";
import NextAuth, { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";

const authOptions = {
  secret: process.env.SECRET,
  adapter: MongoDBAdapter(clientPromise),
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
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        const user = await User.findOne({ email: session.user.email });
        if (user) {
          session.user.superAdmin = user.superAdmin;
          session.user.isAdmin = user.isAdmin;
          session.user.isStaff = user.isStaff;
          session.user.branchId = user.branchId?.toString();
        }
      }
      return session;
    },
  },
};

// Helper functions (not exported)
async function isAdmin(branchId) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return false;
  }
  return (
    user.superAdmin || (user.isAdmin && user.branchId?.toString() === branchId)
  );
}

async function isSuperAdmin() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  return user?.superAdmin || false;
}

async function canManageBranch(branchId) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return false;
  }
  return (
    user.superAdmin || (user.isAdmin && user.branchId.toString() === branchId)
  );
}

async function isStaffOrAdmin(branchId) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return false;
  }
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return false;
  }
  return (
    user.superAdmin ||
    ((user.isAdmin || user.isStaff) && user.branchId?.toString() === branchId)
  );
}

const handler = NextAuth(authOptions);

// Only export the route handlers
export { handler as GET, handler as POST };
