'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { storage, ID } from '@/lib/appwrite';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

type FormData = {
  file: FileList;
};

type FileItem = {
  $id: string;
  name: string;
  mimeType: string;
  $createdAt: string; // Add $createdAt to the type for sorting
};

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '';
const FILE_LIMIT = 20;

export default function UploadForm() {
  const { register, handleSubmit, reset } = useForm<FormData>();
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);

  // Fetch files
  const fetchFiles = async () => {
    try {
      const res = await storage.listFiles(BUCKET_ID);

      // 1. Sort files by creation date in descending order (newest first)
      const sortedFiles = (res.files as FileItem[]).sort(
        (a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      );

      // 2. Keep the latest FILE_LIMIT files for display
      const filesToKeep = sortedFiles.slice(0, FILE_LIMIT);
      setFiles(filesToKeep);

      // 3. Identify and delete files beyond the limit (these will be the oldest ones)
      const filesToDelete = sortedFiles.slice(FILE_LIMIT);
      for (const file of filesToDelete) {
        await storage.deleteFile(BUCKET_ID, file.$id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch files');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Upload
  const onSubmit = async (data: FormData) => {
    const file = data.file?.[0];
    if (!file) return toast.error('Please select a file');

    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return toast.error(`File must be smaller than ${maxSizeMB}MB`);
    }

    toast.loading('Uploading...');
    try {
      const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
      const fileUrl = storage.getFileView(BUCKET_ID, uploaded.$id);

      toast.dismiss();
      toast.success('File uploaded!');
      setUrl(fileUrl);
      reset();
      await fetchFiles(); // Re-fetch to apply sorting and potential deletion
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  // Delete
  const handleDelete = async (fileId: string) => {
    toast.loading('Deleting...');
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      toast.dismiss();
      toast.success('Deleted');
      await fetchFiles();
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center h-full border-t border-white space-y-8 p-6">
      {/* Upload Form Card */}
      <Card className="w-[400px] max-w-[97vw]">
        <CardHeader>
          <CardTitle>Upload Images for Home Page</CardTitle>
          <CardDescription>Upload images or PDFs (max 5MB).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input type="file" accept="image/*,.pdf" {...register('file')} />
            <Button type="submit" className="w-full bg-blue-500 text-white font-bold hover:bg-blue-600">
              Upload File
            </Button>
          </form>
        </CardContent>
        {url && (
          <CardFooter>
            <div className="text-sm break-words w-full">
              <p className="font-semibold mb-1">Public URL:</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 transition-colors duration-200">
                {url}
              </a>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Display uploaded images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        {files.map((file) => {
          const fileUrl = storage.getFileView(BUCKET_ID, file.$id);
          const isImage = file.mimeType.startsWith('image/');

          return (
            <Card key={file.$id} className="relative group overflow-hidden">
              <button
                onClick={() => handleDelete(file.$id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-80 hover:opacity-100 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <CardContent className="p-4">
                {isImage ? (
                  <img src={fileUrl} alt={file.name} className="w-full h-40 object-cover rounded" />
                ) : (
                  <a href={fileUrl} target="_blank" className="text-blue-500 underline">
                    {file.name}
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}