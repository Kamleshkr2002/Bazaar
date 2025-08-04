import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navbar from "@/components/navigation/navbar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, MapPin, Eye, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ["/api/items", id],
  });

  const { data: wishlistCheck } = useQuery({
    queryKey: ["/api/wishlist/check", id],
    enabled: !!user,
  });

  const wishlistMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      if (action === 'add') {
        return apiRequest("POST", `/api/wishlist/${id}`);
      } else {
        return apiRequest("DELETE", `/api/wishlist/${id}`);
      }
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist/check", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: action === 'add' ? "Added to wishlist" : "Removed from wishlist",
        description: action === 'add' ? "Item saved to your wishlist" : "Item removed from your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    },
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'like_new': return 'bg-green-100 text-green-800';
      case 'excellent': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCondition = (condition: string) => {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
            <p className="text-gray-600 mb-4">The item you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/browse">Browse Items</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.seller?.id;
  const isInWishlist = wishlistCheck?.isInWishlist;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/browse">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <img 
                src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop'}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            {item.images && item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <img 
                      src={image}
                      alt={`${item.title} ${index + 2}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-75 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                  <p className="text-3xl font-bold text-primary">${item.price}</p>
                </div>
                {!isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => wishlistMutation.mutate(isInWishlist ? 'remove' : 'add')}
                    disabled={wishlistMutation.isPending}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {item.views} views
                </div>
                <Badge className={getConditionColor(item.condition)}>
                  {formatCondition(item.condition)}
                </Badge>
                {item.category && (
                  <Badge variant="outline">
                    {item.category.emoji} {item.category.name}
                  </Badge>
                )}
              </div>

              {item.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
                </div>
              )}

              <div className="space-y-2 text-sm">
                {item.allowNegotiation && (
                  <div className="flex items-center text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Price negotiable
                  </div>
                )}
                {item.pickupOnly && (
                  <div className="flex items-center text-blue-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    Pickup only
                  </div>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.seller?.profileImageUrl} />
                    <AvatarFallback>
                      {item.seller?.firstName?.[0]}{item.seller?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {item.seller?.firstName} {item.seller?.lastName}
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 ml-1">4.9 (27 reviews)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!isOwner && (
              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Ask a Question
                </Button>
              </div>
            )}

            {isOwner && (
              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  Edit Listing
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Mark as Sold
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Item Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Posted:</span>
                  <p className="text-gray-600">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Condition:</span>
                  <p className="text-gray-600">{formatCondition(item.condition)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Category:</span>
                  <p className="text-gray-600">{item.category?.name || 'Other'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Views:</span>
                  <p className="text-gray-600">{item.views}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
