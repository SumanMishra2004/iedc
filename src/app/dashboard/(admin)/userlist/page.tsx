"use client";

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
import axios from "axios";
import toast from "react-hot-toast";
import { User } from "@prisma/client";
import { useState, useEffect } from "react";

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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ChevronDown,
  Delete,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
} from "lucide-react";

export default function UserList() {
  const [data, setData] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/user/getUser?page=${page}&limit=${limit}`);
      setData(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Effect to refetch users when page or limit changes
  useEffect(() => {
    fetchUsers();
  }, [page, limit]);

  // Update user data (userType or name or position)
  const updateUserData = async (
    email: string,
    updatePayload: { userType?: string; name?: string; position?: string }
  ) => {
    setLoading(true);
    try {
      await axios.post(
        "/api/user/updateUser",
        { email, ...updatePayload },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Updated successfully");
    } catch (error) {
      console.error("Failed to update data:", error);
      toast.error("Failed to update data");
    } finally {
      fetchUsers();
      setLoading(false);
    }
  };

  // Columns definition for the table
  const columns: ColumnDef<User>[] = [
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
      cell: ({ row }) => <div className="lowercase">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: () => <div className="text-left">Name</div>,
      cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "position",
      header: () => <div className="text-left">Position</div>,
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("position") || "-"}</div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "userType",
      header: () => <div className="text-right">UserType</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium uppercase">
          {row.getValue("userType")}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
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
              <DropdownMenuItem className="p-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between px-2">
                      Update UserType <ArrowDownWideNarrow className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {["STUDENT", "FACULTY", "ADMIN"].map((userType) => (
                      <DropdownMenuItem
                        key={userType}
                        onClick={() => updateUserData(row.original.email, { userType })}
                      >
                        {userType}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </DropdownMenuItem>
              <UpdateNameDialog
                email={row.original.email}
                currentName={row.original.name}
                onUpdate={(email, name) => updateUserData(email, { name })}
              />
              <UpdatePositionDialog
                email={row.original.email}
                currentPosition={row.original.position || ""}
                onUpdate={(email, position) => updateUserData(email, { position })}
              />
            
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Initialize react-table
  const table = useReactTable({
    data,
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

  return (
    <div className="w-full flex flex-col gap-4 md:px-6 px-1">
      <p className="md:text-4xl text-3xl font-bold text-black dark:text-white py-3 border-b border-black dark:border-white w-full text-center">
        User Data Table
      </p>

      <div className="flex items-center flex-wrap h-auto flex-row py-4 justify-around gap-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          {loading ? "Loading..." : "Refresh"}
        </Button>

        {/* Page selection dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="md:w-[10%] h-10 min-w-[22rem] md:min-w-[16rem] justify-between"
            >
              {page === 1 && totalPages === 1 ? "Page 1" : `Page ${page}`}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full max-h-[20rem] overflow-y-scroll">
            {Array.from({ length: totalPages }, (_, index) => (
              <DropdownMenuItem key={index} onClick={() => setPage(index + 1)}>
                {index + 1}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Limit selection dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="md:w-[10%] h-10 min-w-[22rem] md:min-w-[16rem] justify-between"
            >
              Limit {limit}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full max-h-[20rem]">
            {[5, 10, 15].map((num) => (
              <DropdownMenuItem key={num} onClick={() => setLimit(num)}>
                {num}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Column visibility dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
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
       
      </div>
    </div>
  );
}

// Dialog component for updating user's name
function UpdateNameDialog({
  email,
  currentName,
  onUpdate,
}: {
  email: string;
  currentName: string;
  onUpdate: (email: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {" "}
          {/* Prevent dropdown from closing */}
          <Button variant="ghost" className="w-full justify-start p-2">
            Edit Name
          </Button>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Name</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter new name"
        />
        <DialogFooter>
          <Button
            onClick={() => {
              onUpdate(email, name);
              setOpen(false);
            }}
            disabled={!name.trim()}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// New Dialog component for updating user's position
function UpdatePositionDialog({
  email,
  currentPosition,
  onUpdate,
}: {
  email: string;
  currentPosition: string;
  onUpdate: (email: string, position: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(currentPosition);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Button variant="ghost" className="w-full justify-start p-2">
            Edit Position
          </Button>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Position</DialogTitle>
        </DialogHeader>
        <Input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Enter new position"
        />
        <DialogFooter>
          <Button
            onClick={() => {
              onUpdate(email, position);
              setOpen(false);
            }}
            disabled={!position.trim()}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}