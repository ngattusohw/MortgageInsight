import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/AuthContext";
import { Home, UserCircle, LogOut, TestTube2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Home className="h-5 w-5 text-primary mr-2" />
          <Link href="/">
            <span className="text-xl font-semibold text-neutral-800 cursor-pointer">MortgageSaver</span>
          </Link>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <Link href="/test">
              <span className={`flex items-center cursor-pointer ${location === '/test' ? 'text-primary-700' : 'text-primary-600 hover:text-primary-800'}`}>
                <TestTube2 className="h-5 w-5 mr-1" />
                <span>Test Page</span>
              </span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center">
                  <UserCircle className="h-5 w-5 mr-1" />
                  <span>{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>My Mortgages</DropdownMenuItem>
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}