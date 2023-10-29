"use server";

import { string } from "zod";
import { connectToDB } from "../mongoose";
import Thread from "../modles/thread.model";
import User from "../modles/user.model";
import { revalidatePath } from "next/cache";

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

// Create a new Thread
export async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectToDB();

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`);
  }
}

// Function for paginated post retrieval from a database.
export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  try {
    // Establish a connection to the database.
    connectToDB();

    // Calculate the number of posts to skip based on the requested page and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Query for top-level threads (posts with no parent) and sort them by creation date in descending order.
    const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createAt: "desc" })
      .skip(skipAmount) // Skip to the appropriate page
      .limit(pageSize) // Limit the number of posts per page
      .populate({ path: "author", model: User }) // Populate the author information
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image", // Select specific fields for the author
        },
      });

    // Retrieve the total count of top-level posts for pagination purposes.
    const totalPostsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    // Execute the query to fetch posts.
    const posts = await postsQuery.exec();

    // Check if there are more posts available for the next page.
    const isNext = totalPostsCount > skipAmount + posts.length;

    // Return the fetched posts and a flag indicating if there are more posts for the next page.
    return { posts, isNext };
  } catch (error: any) {
    throw new Error(`Error creating fetch posts: ${error.message}`);
  }
}
