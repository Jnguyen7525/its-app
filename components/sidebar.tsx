import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import React from "react";

function sidebar() {
  return (
    <div className="w-[250px] ">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>john nguyen</div>
          </div>

          <div className="flex items-center rounded-md bg-zinc-800 px-2 py-1 transition-colors duration-200 hover:bg-zinc-700">
            <Search className="text-zinc-500" size={18} />
            <input
              placeholder="Search..."
              type="text"
              className="ml-1 flex h-full w-full bg-transparent outline-hidden placeholder:text-zinc-500"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="cursor-pointer hover:text-purple-500">Profile</div>
          <div className="cursor-pointer hover:text-purple-500">All Boards</div>
          <div className="cursor-pointer hover:text-purple-500">Inbox</div>
          <div className="cursor-pointer hover:text-purple-500">Chat</div>
        </div>
      </div>
    </div>
  );
}

export default sidebar;
