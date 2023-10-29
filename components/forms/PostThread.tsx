"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { ThreadValidation } from "@/lib/validations/thread";

// Define a TypeScript interface for the component's props
interface Props {
  user: {
    id: string;
    objectId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
  };
  btnTitle: string;
}

const PostThread = ({ userId }: { userId: string }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Initialize the form using react-hook-form
  const form = useForm({
    resolver: zodResolver(ThreadValidation), // Use Zod schema for form validation
    defaultValues: {
      thread: "",
      accountId: userId,
    },
  });

  return (
    <div>
      <h1>PostThread</h1>
    </div>
  );
};

export default PostThread;
