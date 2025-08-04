import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Laptop, Car, Shirt, Dumbbell, Package } from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

interface CategoryGridProps {
  categories: Category[];
}

const iconMap = {
  '📚': BookOpen,
  '💻': Laptop,
  '🪑': Car,
  '👕': Shirt,
  '⚽': Dumbbell,
  '📦': Package,
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const getIcon = (emoji: string) => {
    return iconMap[emoji as keyof typeof iconMap] || Package;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {categories.map((category) => {
        const IconComponent = getIcon(category.emoji || '📦');
        
        return (
          <Link key={category.id} href={`/browse?categoryId=${category.id}`}>
            <Card className="group cursor-pointer hover:shadow-md transition-all hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-3">{category.emoji}</div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Browse items</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
