"use server";

import { revalidatePath } from "next/cache";
import User from "../modles/user.model";
import { connectToDB } from "../mongoose";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

// Update a user information
export async function updateUser({
  userId,
  username,
  name,
  bio,
  image,
  path,
}: Params): Promise<void> {
  try {
    // Establish a connection to the database
    connectToDB();
    // Attempt to find the user by their ID and update their information
    await User.findOneAndUpdate(
      { id: userId }, // Find user by ID
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true } // If user not found, create a new one
    );

    // Check if the provided path is "/profile/edit" and revalidate it
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    // Handle errors by throwing a custom error message
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

// Fetch specific user
export async function fetchUser(userId: string) {
  try {
    connectToDB();

    return await User.findOne({ id: userId });
    // .populate({
    //   path: "communities",
    //   model: Commynity
    // })
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}
