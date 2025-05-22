import { Client, Storage, ID } from 'appwrite';

const client = new Client();

if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT) {
  throw new Error('Appwrite environment variables are not defined');
}
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) // Replace with your Appwrite endpoint
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!); // Replace with your project ID

const storage = new Storage(client);

export { storage, ID };
