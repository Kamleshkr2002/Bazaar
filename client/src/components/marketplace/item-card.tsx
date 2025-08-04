import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { ItemWithDetails } from "@shared/schema";

interface ItemCardProps {
  item: ItemWithDetails;
}

export default function ItemCard({ item }: ItemCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/wishlist/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to wishlist",
        description: "Item saved to your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to wishlist",
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

  const isOwner = user?.id === item.seller?.id;

  return (
    <Card className="group cursor-pointer hover:shadow-md transition-all border border-gray-100 overflow-hidden">
      <Link href={`/item/${item.id}`}>
        <div className="relative">
          <img 
            src={item.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop'}
            alt={item.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute top-3 left-3">
            <Badge className={getConditionColor(item.condition)}>
              {formatCondition(item.condition)}
            </Badge>
          </div>
          {!isOwner && (
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  wishlistMutation.mutate();
                }}
                disabled={wishlistMutation.isPending}
              >
                <Heart className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/item/${item.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer">
            {item.title}
          </h3>
          <p className="text-2xl font-bold text-primary mb-2">${item.price}</p>
          {item.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {item.description}
            </p>
          )}
          
          {/* Seller info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-6 w-6">
                <AvatarImage src={item.seller?.profileImageUrl} />
                <AvatarFallback className="text-xs">
                  {item.seller?.firstName?.[0]}{item.seller?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="ml-2 text-sm text-gray-600">
                {item.seller?.firstName} {item.seller?.lastName?.[0]}.
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span>2.1 km</span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
