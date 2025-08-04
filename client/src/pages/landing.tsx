import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Laptop, Car, Shirt, Dumbbell, Package } from "lucide-react";

export default function Landing() {
  const categories = [
    { name: 'Books', icon: BookOpen, count: '120+' },
    { name: 'Electronics', icon: Laptop, count: '85+' },
    { name: 'Furniture', icon: Car, count: '45+' },
    { name: 'Clothing', icon: Shirt, count: '92+' },
    { name: 'Sports', icon: Dumbbell, count: '38+' },
    { name: 'More', icon: Package, count: 'View All' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Campus Bazaar</h1>
            </div>
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute inset-y-0 left-0 ml-3 h-4 w-4 text-gray-400 top-1/2 transform -translate-y-1/2" />
                <Input 
                  className="pl-10" 
                  placeholder="Search for books, electronics, furniture..."
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <a href="/auth">Sign In</a>
              </Button>
              <Button asChild>
                <a href="/auth">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Buy & Sell with Fellow Students
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Connect with students in your college to buy and sell textbooks, electronics, 
                furniture, and more at great prices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <a href="/auth">Start Shopping</a>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                  <a href="/auth">List Your Items</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop" 
                alt="College students with books and laptop" 
                className="rounded-xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Categories</h2>
            <p className="text-lg text-gray-600">Find exactly what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Card key={category.name} className="group cursor-pointer hover:shadow-md transition-all hover:scale-105">
                <CardContent className="p-6 text-center">
                  <category.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{category.count} items</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Campus Bazaar?</h2>
            <p className="text-lg text-gray-600">Safe, convenient, and student-focused</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Find</h3>
              <p className="text-gray-600">Search by category, price, condition, and location to find exactly what you need.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-success bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Student Verified</h3>
              <p className="text-gray-600">All users are verified college students, ensuring a safe and trusted community.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Laptop className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Great Deals</h3>
              <p className="text-gray-600">Find textbooks, electronics, and more at prices that fit your student budget.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of students already using Campus Bazaar</p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/auth">Join Campus Bazaar</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Campus Bazaar</h3>
              <p className="text-gray-400 mb-4">Connecting college students to buy and sell items safely and conveniently.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Marketplace</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Items</a></li>
                <li><a href="#" className="hover:text-white">Sell Your Items</a></li>
                <li><a href="#" className="hover:text-white">Popular Categories</a></li>
                <li><a href="#" className="hover:text-white">Safety Tips</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Report an Issue</a></li>
                <li><a href="#" className="hover:text-white">Community Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Campus Bazaar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
