"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { ID, Client, Storage } from "appwrite";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { FileUpload } from "@/components/ui/file-upload";

// Appwrite Config using environment variables
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_PUBLIC_ENDPOINT || "")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "");
const storage = new Storage(client);

// Zod Schema
const formSchema = z.object({
  title: z.string().min(1, "Paper Title is required"),
  abstract: z.string().min(1, "Abstract is required"),
  keywords: z.string().min(1, "Keywords are required"),
  facultyAdvisors: z.array(z.string()).min(1, "At least one Faculty Advisor is required"),
  reviewer: z.string().min(1, "Reviewer is required"),
  students: z.array(z.string()).min(1, "At least one Student Contributor is required"),
  file: z.instanceof(File, { message: "A paper file is required" }).nullable(),
});

export default function MultiPagePaperUpload() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [facultyDetails, setFacultyDetails] = useState<any[]>([]);
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);
  const [openReviewer, setOpenReviewer] = useState(false);


  const fetchStudentDetails = async () => {
    try {
      const res = await axios.get("/api/user/getUser");
      if (res.status === 200) {
        const users = res.data.users; // extract users array
        const studentOnly = users.filter(
          (user: any) => user.userType === "STUDENT"
        );
        setStudentDetails(studentOnly);
        console.log("Filtered Student Details:", studentOnly);
      } else {
        console.error("Failed to fetch students:", res.statusText);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  const totalSteps = 4;

  const fetchFacultyDetails = async () => {
    try {
      const fetchData = await axios.get("/api/user/getUserDetailsData");
      if (fetchData.status === 200) {
        const facultyOnly = fetchData.data.filter(
          (user: any) => user.userType === "FACULTY"
        );
        setFacultyDetails(facultyOnly);
        console.log("Filtered Faculty Details:", facultyOnly);
      } else {
        console.error("Failed to fetch faculty details:", fetchData.statusText);
      }
    } catch (error) {
      console.error("Error fetching faculty details:", error);
    }
  };

  useEffect(() => {
    fetchFacultyDetails();
    fetchStudentDetails();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger, // Import trigger for manual validation
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      abstract: "",
      keywords: "",
      facultyAdvisors: [],
      reviewer: "",
      students: [],
      file: undefined,
    },
  });


  const watchFile = watch("file");

  const onSubmit = async (data: any) => {
    setLoading(true);
    console.log("Form Data Submitted:", data);
    try {
      const file = data.file;

      // Check if file exists
      if (file) {
        // Validate file type is PDF
        if (file.type !== "application/pdf") {
          toast.error("Only PDF files are allowed");
          setLoading(false);
          return;
        }

        // Validate file size < 10MB
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size exceeds 10MB limit");
          setLoading(false);
          return;
        }
      }

      // Prepare final data object
      const finalData: {
        title: string;
        abstract: string;
        keywords: string[];
        facultyAdvisors: string[];
        reviewerName: string;
        authorNames: string[];
        filePath: string | null; // Accepts string or null
      } = {
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords.split(",").map((k: string) => k.trim()),
        facultyAdvisors: data.facultyAdvisors, // Corrected to match schema field
        reviewerName: data.reviewer,
        authorNames: data.students,
        filePath: null, // Will set after upload if file exists
      };

      // Upload file if present
      if (file) {
        const fileId = await onSubmitFile(file);
        finalData.filePath = fileId;
      }

      console.log("Final Data to Submit:", finalData);

      const uploadApi = await axios.post("/api/paper/", finalData);
console.log("API Response:", uploadApi);
      if (uploadApi.status !== 201) {
        toast.error("Failed to submit form");
        setLoading(false);
        console.error("API Error:", uploadApi.data);
        return;
      }

      console.log("Form submitted successfully:", uploadApi.data);
      toast.success("Form submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setLoading(false);
      setStep(1); // Reset to first step after submission
      setValue("title", "");
      setValue("abstract", "");
      setValue("keywords", "");

      setValue("facultyAdvisors", []);
      setSelectedFaculties([]);

      setValue("reviewer", "");
      setSelectedReviewer(null);
      setValue("students", []);
      setSelectedStudents([]);
      setValue("file", null);
      setOpen(false);
      setOpenReviewer(false);
      setStudentDropdownOpen(false);

    }
  };

  const onSubmitFile = async (file: File): Promise<string | null> => {
    try {
      toast.loading("Uploading paper...");

      const fileRes = await storage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "",
        ID.unique(),
        file
      );
      console.log("File uploaded successfully:", fileRes);

      toast.dismiss();
      toast.success("Paper uploaded successfully!");
      return fileRes.$id; // return file ID to be used in form data
    } catch (error) {
      toast.dismiss();
      toast.error("Upload failed");
      console.error(error);
      return null;
    }
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["title", "abstract", "keywords"]);
    } else if (step === 2) {
      isValid = await trigger(["facultyAdvisors", "reviewer", "students"]);
    } else if (step === 3) {
      isValid = await trigger(["file"]);
    }

    if (isValid) {
      setStep((s) => Math.min(s + 1, totalSteps));
    } else {
      toast.error("Please fill in all required fields for this step.");
    }
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="w-full h-full md:p-9 p-4">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="text-white">Loading...</div>
        </div>
      )}
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Upload Research Paper</span>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter paper details"}
            {step === 2 && "Enter faculty and student details"}
            {step === 3 && "Upload your paper file"}
            {step === 4 && "Review your submission"}
          </CardDescription>
          <Progress value={(step / totalSteps) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Move the form tag to wrap the entire CardContent so the submit button can be inside */}
          <form onSubmit={handleSubmit(onSubmit)} className="grid w-full items-center gap-4">
            {step === 1 && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="title">Paper Title</Label>
                  <Input
                    id="title"
                    placeholder="Title of your Paper"
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-red-500">{errors.title.message}</p>
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="abstract">Abstract</Label>
                  <Textarea
                    id="abstract"
                    placeholder="Abstract of your Paper"
                    className="h-52"
                    {...register("abstract")}
                  />
                  {errors.abstract && (
                    <p className="text-red-500">{errors.abstract.message}</p>
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="Add keywords (, separated) - min 3, max 7"
                    {...register("keywords")}
                  />
                  {errors.keywords && (
                    <p className="text-red-500">{errors.keywords.message}</p>
                  )}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="flex flex-col space-y-1.5">
                  <Label>Faculty Members</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {selectedFaculties.length > 0
                          ? selectedFaculties.join(", ")
                          : "Select Faculty Members"}
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0">
                      <Command>
                        <CommandInput placeholder="Search faculty..." />
                        <CommandGroup>
                          {facultyDetails.map((faculty, index) => (
                            <CommandItem
                              key={index}
                              onSelect={() => {
                                setSelectedFaculties((prev) => {
                                  const updated = prev.includes(faculty.name)
                                    ? prev.filter((f) => f !== faculty.name)
                                    : [...prev, faculty.name];
                                  setValue("facultyAdvisors", updated); // sync with form
                                  return updated;
                                });
                                setOpen(false);
                              }}
                            >
                              <Checkbox
                                checked={selectedFaculties.includes(
                                  faculty.name
                                )}
                                className="mr-2"
                              />
                              {faculty.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.facultyAdvisors && (
                    <p className="text-red-500">
                      {errors.facultyAdvisors.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label>Reviewer</Label>
                  <Popover open={openReviewer} onOpenChange={setOpenReviewer}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {selectedReviewer || "Select Reviewer"}
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0">
                      <Command>
                        <CommandInput placeholder="Search reviewer..." />
                        <CommandGroup>
                          {facultyDetails.map((faculty, index) => (
                            <CommandItem
                              key={index}
                              onSelect={() => {
                                setSelectedReviewer(faculty.name);
                                setValue("reviewer", faculty.name);
                                setOpenReviewer(false);
                              }}
                            >
                              <Checkbox
                                checked={selectedReviewer === faculty.name}
                                className="mr-2"
                              />
                              {faculty.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.reviewer && (
                    <p className="text-red-500">
                      {errors.reviewer.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-1.5 mb-4">
                  <Label>Add Student Contributors</Label>
                  <Popover
                    open={studentDropdownOpen}
                    onOpenChange={setStudentDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedStudents.length > 0
                          ? `${selectedStudents.length} selected`
                          : "Select students"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search students..." />
                        <CommandGroup>
                          {facultyDetails.map((student) => ( // Corrected to use studentDetails
                            <CommandItem
                              key={student.id}
                              onSelect={() => {
                                setSelectedStudents((prev) => {
                                  const updated = prev.includes(student.name)
                                    ? prev.filter((s) => s !== student.name)
                                    : [...prev, student.name];
                                  setValue("students", updated); // sync with form
                                  return updated;
                                });
                                setStudentDropdownOpen(false);
                              }}
                            >
                              <Checkbox
                                checked={selectedStudents.includes(
                                  student.name
                                )}
                                className="mr-2"
                              />
                              <span>{student.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.students && (
                    <p className="text-red-500">
                      {errors.students.message}
                    </p>
                  )}
               
                </div>
              </>
            )}
            {step === 3 && (
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="file">
                  Upload Paper File (only pdf max-10mb)
                </Label>
                {watchFile ? (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {watchFile.name} (
                    {(watchFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No file selected
                  </p>
                )}
                {watchFile && (
                  <>
                    <p className="text-green-600 text-xs">
                      One file is selected already. If you upload another
                      file, the previous one will be replaced.
                    </p>
                    <FileUpload
                      onChange={(files: File[]) => setValue("file", files[0])}
                    />
                  </>
                )}

                {!watchFile && (
                  <FileUpload
                    onChange={(files: File[]) => setValue("file", files[0])}
                  />
                )}
                {errors.file && (
                  <p className="text-red-500">{errors.file.message}</p>
                )}
              </div>
            )}

            {step === 4 && (
              <>
                <div className="mt-4 max-w-full">
                  <h2 className="font-bold text-lg mb-2">
                    Review Submission
                  </h2>
                  <pre className="bg-muted p-2 rounded text-sm max-w-full overflow-x-auto whitespace-pre-wrap ">
                    {JSON.stringify(
                      {
                        title: watch("title"),
                        abstract: watch("abstract"),
                        keywords: watch("keywords"),
                        facultyAdvisors: watch("facultyAdvisors"), // Corrected to match schema field
                        reviewer: watch("reviewer"),
                        students: watch("students"),
                        fileName: watchFile?.name,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            type="button"
            disabled={step === 1}
          >
            Previous
          </Button>
          {step < totalSteps ? (
            <Button onClick={nextStep} type="button">
              Next
            </Button>
          ) : (
            <Button type="submit" formMethod="post" onClick={handleSubmit(onSubmit)}>Submit</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}