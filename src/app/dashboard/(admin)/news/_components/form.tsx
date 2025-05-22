// components/LatestNewsForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { z } from "zod";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const latestNewsSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    tags: z.string().min(1, "At least one tag is required"),
    HomePageVisibility: z.boolean(),
});

type LatestNewsInput = z.infer<typeof latestNewsSchema>;

export default function LatestNewsForm() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const usertype = session?.user?.userType;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<LatestNewsInput>({
        resolver: zodResolver(latestNewsSchema),
        defaultValues: {
            HomePageVisibility: false,
        },
    });

    if (usertype !== "ADMIN") {
        return (
            <div className="flex justify-center items-center h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center text-red-500">Unauthorized</CardTitle>
                        <CardDescription className="text-center">
                            You are not authorized to add news.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const onSubmit = async (data: LatestNewsInput) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                tags: data.tags.split(",").map((tag: string) => tag.trim()),
            };
            await axios.post("/api/user/news", payload);
            toast.success("News added successfully!");
            reset();
        } catch (error) {
            toast.error("Failed to upload news.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className=" w-full h-auto">
            <Card className="w-full ">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Add Latest News</CardTitle>
                    <CardDescription className="text-center">
                        Fill out the form to add a new news article.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter news title"
                                {...register("title")}
                                className={cn(
                                    errors.title && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                placeholder="Write the news content here..."
                                {...register("content")}
                                rows={6}
                                className={cn(
                                    errors.content && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            {errors.content && (
                                <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                                id="tags"
                                placeholder="e.g., event, announcement, update"
                                {...register("tags")}
                                className={cn(
                                    errors.tags && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            {errors.tags && (
                                <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="homepage-visibility"
                                checked={watch("HomePageVisibility")}
                                onCheckedChange={(checked) => {
                                    // Manually set the value using the onChange handler from register
                                    register("HomePageVisibility").onChange({
                                        target: {
                                            name: "HomePageVisibility",
                                            value: checked,
                                        },
                                    });
                                }}
                            />
                            <Label htmlFor="homepage-visibility">Show on Homepage</Label>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Submitting..." : "Add News"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

