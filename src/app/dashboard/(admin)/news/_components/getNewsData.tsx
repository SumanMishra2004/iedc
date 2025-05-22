// components/Adminlist.tsx
"use client";
import { useEffect, useState } from "react";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  DeleteIcon,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Upload, // Keep Upload icon for the dialog trigger
} from "lucide-react";
interface UpdateNewsDialogProps {
  newsItem: LatestNews;
  onUpdate: (
    newsId: string,
    updatePayload: {
      title?: string;
      content?: string;
      HomePageVisibility?: boolean;
    }
  ) => void;
}

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import toast from "react-hot-toast";

// Import the new dialog components
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Define LatestNews type here if not already defined globally or in a shared types file
type LatestNews = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  HomePageVisibility: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function Adminlist() {
  const [news, setNews] = React.useState<LatestNews[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get<LatestNews[]>("/api/user/news");
      setNews(response.data);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to load news.");
      toast.error("Failed to load news.");
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async (newsId?: string | string[]) => {
    setLoading(true);
    let idsToDelete: string[];

    if (newsId) {
      idsToDelete = Array.isArray(newsId) ? newsId : [newsId];
    } else {
      idsToDelete = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original.id);
    }

    if (idsToDelete.length === 0) {
      toast.error("No news selected for deletion.");
      setLoading(false);
      return;
    }

    try {
      await axios.delete("/api/user/news", {
        data: { id: idsToDelete },
      });
      toast.success("Deleted successfully");
      table.toggleAllRowsSelected(false);
    } catch (error) {
      console.error("Failed to delete data:", error);
      toast.error("Failed to delete data");
    } finally {
      fetchNews();
      setLoading(false);
    }
  };

  // Modified updateData to match the payload expected by UpdateNewsDialog
  const updateData = async (
    newsId: string,
    updatePayload: {
      title?: string;
      content?: string;
      HomePageVisibility?: boolean;
    }
  ) => {
    setLoading(true);
    try {
      const payload = {
      id: newsId,
      ...updatePayload,
    };

      await axios.put(`/api/user/news/`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("News updated successfully!");
    } catch (error) {
      console.error("Failed to update data:", error);
      toast.error("Failed to update data");
    } finally {
      fetchNews(); // Refetch news after update
      setLoading(false);
    }
  };

  const columns: ColumnDef<LatestNews>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: () => <div className="text-left">ID</div>,
      cell: ({ row }) => (
        <div className="lowercase text-left">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "title",
      header: () => <div className="text-left">News Title</div>,
      cell: ({ row }) => (
        <div className="lowercase text-left truncate max-w-[7rem]">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "content",
      header: () => <div className="text-left">Content</div>,
      cell: ({ row }) => {
        return (
          <div className="text-left font-medium uppercase truncate max-w-[10rem]">
            {row.getValue("content")}
          </div>
        );
      },
    },
    {
      accessorKey: "tags",
      header: () => <div className="text-left">Tags Number</div>,
      cell: ({ row }) => {
        return (
          <div className="text-left font-medium uppercase">
            {(row.getValue("tags") as string[]).length}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0" // Remove horizontal padding
          >
            Post date & Time
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-left font-medium uppercase">
            {(() => {
              const dateobj = new Date(row.getValue("createdAt"));
              const date = dateobj.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const time = dateobj.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return `${date} ${time}`;
            })()}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "homePageVisibility",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0" // Remove horizontal padding
          >
            Home Page Visibility
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="text-left font-medium uppercase">
            {row.getValue("homePageVisibility") ? "Visible" : "Hidden"}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const newsItem = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Integrate the UpdateNewsDialog here */}
              <UpdateNewsDialog
                newsItem={newsItem}
                onUpdate={updateData} // Pass the updateData function
              />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={() => deleteData(newsItem.id)}
              >
                <DeleteIcon className="mr-2 h-4 w-4" /> Delete News
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: news,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (loading && news.length === 0) return <p className="text-center py-8">Loading news...</p>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;

  return (
    <div className="w-full p-4"> {/* Added padding for better spacing */}
      <div className="flex items-center flex-wrap justify-between gap-4 py-4"> {/* Adjusted justify */}
        <Input
          placeholder="Filter title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2"> {/* Group refresh and columns buttons */}
          <Button variant="outline" onClick={() => fetchNews()} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            {loading ? "Loading" : "Refresh"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        {loading && news.length === 0 ? ( // Show loader only if initial data is loading
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button
            variant={"destructive"}
            size={"sm"}
            onClick={() => deleteData()}
            disabled={loading}
          >
            <DeleteIcon className="mr-2 h-4 w-4" />
            Delete selected row ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}

        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- UpdateNewsDialog component (place this at the bottom of Adminlist.tsx or in its own file) ---
function UpdateNewsDialog({ newsItem, onUpdate }: UpdateNewsDialogProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(newsItem.title);
    const [content, setContent] = useState(newsItem.content);
    const [homePageVisibility, setHomePageVisibility] = useState(newsItem.HomePageVisibility);

    // Reset form fields when dialog opens/closes or newsItem changes
    useEffect(() => {
        if (open) {
            setTitle(newsItem.title);
            setContent(newsItem.content);
            setHomePageVisibility(newsItem.HomePageVisibility);
        }
    }, [open, newsItem]);

    const handleUpdate = () => {
        // Only send fields that have potentially changed
        const payload: {
            title?: string;
            content?: string;
            HomePageVisibility?: boolean;
        } = {};

        if (title !== newsItem.title) {
            payload.title = title;
        }
        if (content !== newsItem.content) {
            payload.content = content;
        }
        if (homePageVisibility !== newsItem.HomePageVisibility) {
            payload.HomePageVisibility = homePageVisibility;
        }

        // Only proceed if there's actually something to update
        if (Object.keys(payload).length > 0) {
            onUpdate(newsItem.id, payload);
            setOpen(false); // Close dialog on successful update attempt
        } else {
            toast.success("No changes detected to update.");
            setOpen(false); // Close dialog even if no changes
        }
    };
//todo:add pagination
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Button variant="ghost" className="w-full justify-start p-2">
                        <Upload className="mr-2 h-4 w-4" /> Update News
                    </Button>
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="h-[80vh] w-[80vw] overflow-y-scroll">
                <DialogHeader>
                    <DialogTitle>Update News</DialogTitle>
                </DialogHeader>
               <div className="flex flex-col gap-4 py-4">
          {/* Title Input */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content Textarea */}
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
            />
          </div>

          {/* Home Page Visibility Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="homepage-visibility"
              checked={homePageVisibility}
              onCheckedChange={(checked: boolean) => setHomePageVisibility(checked)}
            />
            <Label htmlFor="homepage-visibility">Show on Homepage</Label>
          </div>
        </div>
                <DialogFooter>
                    <Button onClick={handleUpdate} disabled={!title.trim() || !content.trim()} className="bg-blue-500 text-white hover:bg-blue-600 w-full">
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}