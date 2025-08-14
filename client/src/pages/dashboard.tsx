import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navigation/navbar";
import CreateListingModal from "@/components/marketplace/create-listing-modal";
import ItemCard from "@/components/marketplace/item-card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, ShoppingBag, MessageCircle, Heart, Settings, Star } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: myItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["/api/my-items"],
  });

  const { data: wishlist = [], isLoading: loadingWishlist } = useQuery({
    queryKey: ["/api/wishlist"],
  });

  const activeItems = Array.isArray(myItems) ? myItems.filter((item: any) => item.isActive) : [];
  const soldItems = Array.isArray(myItems) ? myItems.filter((item: any) => !item.isActive) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your listings and account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={(user as any)?.profileImageUrl} />
                    <AvatarFallback>
                      {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{(user as any)?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                      <p className="text-3xl font-bold text-primary">{activeItems.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                      <p className="text-3xl font-bold text-success">{soldItems.length}</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Wishlist Items</p>
                      <p className="text-3xl font-bold text-secondary">{Array.isArray(wishlist) ? wishlist.length : 0}</p>
                    </div>
                    <Heart className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="listings" className="space-y-6">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="listings">My Listings</TabsTrigger>
                  <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Listing
                </Button>
              </div>

              <TabsContent value="listings" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">My Listings</h3>
                    </div>

                    {loadingItems ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                            <div className="h-48 bg-gray-200"></div>
                            <div className="p-4 space-y-3">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : Array.isArray(myItems) && myItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                        <p className="text-gray-600 mb-4">Start selling by creating your first listing.</p>
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Listing
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Array.isArray(myItems) && myItems.map((item: any) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <img 
                                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop'} 
                                  alt={item.title} 
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="ml-4">
                                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                  <p className="text-primary font-bold">${item.price}</p>
                                  <div className="flex items-center mt-1">
                                    <Badge variant={item.isActive ? "default" : "secondary"}>
                                      {item.isActive ? "Active" : "Sold"}
                                    </Badge>
                                    <span className="text-sm text-gray-600 ml-2">
                                      {item.views} views
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wishlist" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">My Wishlist</h3>
                    
                    {loadingWishlist ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                            <div className="h-48 bg-gray-200"></div>
                            <div className="p-4 space-y-3">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : Array.isArray(wishlist) && wishlist.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No items in wishlist</h3>
                        <p className="text-gray-600">Items you save will appear here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.isArray(wishlist) && wishlist.map((item: any) => (
                          <ItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Messages</h3>
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                      <p className="text-gray-600">Your conversations with other users will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <CreateListingModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
