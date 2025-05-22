"use client";

import * as React from "react";
import { ChevronsUpDown, GraduationCap, Plus, ShieldUser, UserCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { User } from "@/types/userType";
import Image from "next/image";

type UserType = "ADMIN" | "STUDENT" | "FACULTY";

interface UserTypeOption {
  value: UserType;
  label: string;
}
const iconMap = {
  ADMIN: ShieldUser,
  FACULTY: UserCheck,
  STUDENT: GraduationCap,
};
export function UserTypeSwitcher(user: User) {
  const { isMobile } = useSidebar();

  function getUserTypeSwitchOptions(currentType: UserType): UserTypeOption[] {
    const allTypes: UserType[] = ["ADMIN", "STUDENT", "FACULTY"];

    const labels: Record<UserType, string> = {
      ADMIN: "Be an Admin",
      STUDENT: "Be a Student",
      FACULTY: "Be a Faculty",
    };

    return allTypes
      .filter((type) => type !== currentType)
      .map((type) => ({
        value: type,
        label: labels[type],
      }));
  }
  const options = getUserTypeSwitchOptions(user.userType as UserType);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Image
                src={user.profileImage || ""}
                alt={user.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.userType}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              User Type
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
           {options.map((option, index) => {
        const Icon = iconMap[option.value];

        return (
          <div key={option.value}>
            <DropdownMenuItem
              className="flex items-center justify-start gap-4 h-8 cursor-pointer p-2"
              onClick={() => console.log('Switch to:', option.value)} // replace with your switch logic
            >
              <Icon className="dark:text-white text-blue h-full w-auto size-2.5 border-r-2 dark:border-white border-black pr-5" />
              <p className="font-medium text-lg dark:text-white text-black">
                {option.label}
              </p>
            </DropdownMenuItem>
            {index !== options.length - 1 && <DropdownMenuSeparator />}
          </div>
        );
      })}
          
            {/* {user.userType.map((userType, index) => (
              <DropdownMenuItem
                key={userType.name}
                onClick={() => setActiveUserType(userType)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <userType.logo className="size-3.5 shrink-0" />
                </div>
                {userType.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))} */}

            {/* {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))} */}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
