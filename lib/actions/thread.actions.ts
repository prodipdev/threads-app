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

// Create a new thread in the database
export async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    // Connect to the database
    connectToDB();

    // Create a new thread with provided text and author, assigning null to the community
    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    // Update the User model to link the created thread with the author
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    // Revalidate the provided path
    revalidatePath(path);
  } catch (error: any) {
    // Handle and report any errors
    throw new Error(`Error creating thread: ${error.message}`);
  }
}

// Fetch a paginated list of posts from the database
export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  try {
    // Connect to the database
    connectToDB();

    // Calculate the number of posts to skip for the requested page
    const skipAmount = (pageNumber - 1) * pageSize;

    // Query top-level threads, sort them by creation date, and apply pagination
    const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({ createAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User })
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image",
        },
      });

    // Retrieve the total count of top-level posts for pagination
    const totalPostsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    // Execute the query to fetch posts and determine if more are available
    const posts = await postsQuery.exec();
    const isNext = totalPostsCount > skipAmount + posts.length;

    // Return the fetched posts and a flag indicating if more posts are available
    return { posts, isNext };
  } catch (error: any) {
    // Handle and report any errors
    throw new Error(`Error fetching posts: ${error.message}`);
  }
}

// Get a thread by its unique identifier
export async function fetchThreadById(id: string) {
  try {
    // Connect to the database
    connectToDB();

    // Fetch the thread by its unique ID and populate related data
    const thread = await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          {
            path: "author",
            model: User,
            select: "_id id name parentId image",
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      })
      .exec();

    // Return the fetched thread
    return thread;
  } catch (error: any) {
    // Handle and report any errors
    throw new Error(`Error fetching thread by id: ${error.message}`);
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  connectToDB();

  try {
    // Find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId, // Set the parentId to the original thread's ID
    });
    console.log(commentText, userId, threadId);
    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    // Save the updated original thread to the database
    await originalThread.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}
