import { User } from "@/models/User";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate required fields
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    if (!password?.length || password.length < 5) {
      return Response.json(
        { error: "Password must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    await mongoose.connect(process.env.MONGO_URL);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password and create user
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const createdUser = await User.create({
      email,
      password: hashedPassword,
    });

    return Response.json({
      success: true,
      user: {
        id: createdUser._id.toString(),
        email: createdUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
