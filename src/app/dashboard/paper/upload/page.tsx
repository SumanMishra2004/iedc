"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";

import { Client, Storage } from "appwrite";

// Initialize Appwrite Client & Storage
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

const storage = new Storage(client);

// Combined Zod schema with optional fields and conditional validation
const combinedSchema = z.object({
  title: z.string().min(3, "Title is required"),
  abstract: z.string().min(10, "Abstract must be at least 10 characters"),
  keywords: z.string().min(3, "Enter at least one keyword"),
  authorIds: z.string().min(1, "Provide at least one author name "),
  reviewerId: z.string().min(1, "Provide reviewer name").max(1,"provide only one reviewer name"),
  file: z
    .any()
    .refine((files) => files?.length === 1, "File is required")
    .optional(),
facultyAdvisors: z.string().min(1, "Provide reviewer name").max(10,"faculty advisor name should be less than 10"),
});

function getSchemaByStep(step: number) {
  return combinedSchema.superRefine((data, ctx) => {
    if (step === 1) {
      if (!data.title) ctx.addIssue({ code: "custom", message: "Title is required", path: ["title"] });
      if (!data.abstract) ctx.addIssue({ code: "custom", message: "Abstract is required", path: ["abstract"] });
      if (!data.keywords) ctx.addIssue({ code: "custom", message: "Keywords are required", path: ["keywords"] });
    } else if (step === 2) {
  if (!data.authorIds || data.authorIds.length === 0)
    ctx.addIssue({ code: "custom", message: "Select at least one author", path: ["authorIds"] });

  if (!data.reviewerId)
    ctx.addIssue({ code: "custom", message: "Reviewer ID required", path: ["reviewerId"] });
}
else if (step === 3) {
      if (!data.file || data.file.length !== 1) {
        ctx.addIssue({ code: "custom", message: "File is required", path: ["file"] });
      }
    }
  });
}

// Typescript type inferred from combined schema
type FormData = z.infer<typeof combinedSchema>;

export default function MultiStepPaperUpload() {
    
const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);

useEffect(() => {
  async function fetchUsers() {
    try {
      const res = await axios.get("/api/user/getUser"); // You create this endpoint
      const allUsers = res.data;

      setStudents(allUsers.filter((u: any) => u.usertype === "student"));
      setFaculties(allUsers.filter((u: any) => u.usertype === "faculty"));
    } catch (error) {
      toast.error("Failed to fetch users");
    }
  }

  fetchUsers();
}, []);
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onTouched",
    resolver: zodResolver(getSchemaByStep(step)),
  });

  const watchFile = watch("file");

  async function uploadFile(file: File) {
    try {
      // Upload file to Appwrite Storage
      const response = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
        "unique()", // auto generated id
        file
      );
      return response.$id; // Return file ID
    } catch (error) {
      throw new Error("File upload failed");
    }
  }

  const onSubmit = async (data: FormData) => {
    if (step < 3) {
      const valid = await trigger();
      if (!valid) return;

      setStep((s) => s + 1);
      return;
    }

    // Step 3 submission
    if (!data.file || data.file.length !== 1) {
      toast.error("File is required");
      return;
    }

    try {
      toast.loading("Uploading file...");
      const fileId = await uploadFile(data.file[0]);
      toast.dismiss();

      toast.loading("Submitting paper data...");
      // Now submit form data to your backend API
      await axios.post("/api/paper/create", {
        title: data.title,
        abstract: data.abstract,
        keywords: (data.keywords ?? "").split(",").map((k) => k.trim()),
        authorIds: data.authorIds,
reviewerId: data.reviewerId,
        fileId,
      });
      toast.dismiss();
      toast.success("Paper uploaded successfully!");
      setStep(1);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Submission failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto p-4 space-y-6">
      {step === 1 && (
        <>
          <div>
            <label className="block font-semibold">Title</label>
            <input
              type="text"
              {...register("title")}
              className="input input-bordered w-full"
              placeholder="Enter paper title"
            />
            {errors.title && <p className="text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-semibold">Abstract</label>
            <textarea
              {...register("abstract")}
              className="textarea textarea-bordered w-full"
              placeholder="Enter abstract"
              rows={5}
            />
            {errors.abstract && <p className="text-red-600">{errors.abstract.message}</p>}
          </div>

          <div>
            <label className="block font-semibold">Keywords (comma separated)</label>
            <input
              type="text"
              {...register("keywords")}
              className="input input-bordered w-full"
              placeholder="keyword1, keyword2, keyword3"
            />
            {errors.keywords && <p className="text-red-600">{errors.keywords.message}</p>}
          </div>
        </>
      )}

    {step === 2 && (
  <>
    <div>
      <label className="block font-semibold">Select Authors (Students)</label>
      <select
        multiple
        {...register("authorIds")}
        className="select select-bordered w-full"
      >
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>
      {errors.authorIds && <p className="text-red-600">{errors.authorIds.message}</p>}
    </div>

    <div>
      <label className="block font-semibold">Select Reviewer (Faculty)</label>
      <select
        {...register("reviewerId")}
        className="select select-bordered w-full"
      >
        <option value="">Select reviewer</option>
        {faculties.map((faculty) => (
          <option key={faculty.id} value={faculty.id}>
            {faculty.name}
          </option>
        ))}
      </select>
      {errors.reviewerId && <p className="text-red-600">{errors.reviewerId.message}</p>}
    </div>
  </>
)}


      {step === 3 && (
        <>
          <div>
            <label className="block font-semibold">Upload File (PDF)</label>
            <input
              type="file"
              {...register("file")}
              accept="application/pdf"
              className="file-input file-input-bordered w-full"
            />
            {errors.file && typeof errors.file.message === "string" && (
              <p className="text-red-600">{errors.file.message}</p>
            )}
            {watchFile && watchFile.length > 0 && (
              <p className="mt-2 text-sm text-green-600">{watchFile[0].name} selected</p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-between mt-6">
        {step > 1 && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={isSubmitting}
          >
            Back
          </button>
        )}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {step === 3 ? (isSubmitting ? "Submitting..." : "Submit") : "Next"}
        </button>
      </div>
    </form>
  );
}
