import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Bell, MessageCircle, Menu, User, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/browse?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navLinks = [
    { href: "/", label: "Home", active: location === "/" },
    { href: "/browse", label: "Browse", active: location.startsWith("/browse") },
    { href: "/dashboard", label: "Dashboard", active: location.startsWith("/dashboard") },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary cursor-pointer">Campus Bazaar</h1>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute inset-y-0 left-0 ml-3 h-4 w-4 text-gray-400 top-1/2 transform -translate-y-1/2" />
                <Input
                  className="pl-10"
                  placeholder="Search for books, electronics, furniture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className={`font-medium cursor-pointer ${
                  link.active ? "text-primary" : "text-gray-700 hover:text-primary"
                }`}>
                  {link.label}
                </span>
              </Link>
            ))}
            
            <Button asChild>
              <Link href="/dashboard">
                <Plus className="h-4 w-4 mr-2" />
                List Item
              </Link>
            </Button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">3</Badge>
              </Button>
              
              <Button variant="ghost" size="sm" className="relative">
                <MessageCircle className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-secondary">2</Badge>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {/* Mobile Search */}
            <div className="mb-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute inset-y-0 left-0 ml-3 h-4 w-4 text-gray-400 top-1/2 transform -translate-y-1/2" />
                  <Input
                    className="pl-10"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                    link.active 
                      ? "bg-primary text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}>
                    {link.label}
                  </div>
                </Link>
              ))}
              <div className="pt-2">
                <Button className="w-full" asChild>
                  <Link href="/dashboard">
                    <Plus className="h-4 w-4 mr-2" />
                    List Item
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
