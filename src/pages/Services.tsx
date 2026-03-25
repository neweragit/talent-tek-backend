import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign,
  Code,
  Palette,
  PenTool,
  Camera,
  Megaphone,
  TrendingUp,
  FileText,
  Languages,
  Music,
  Video,
  Smartphone,
  Globe,
  Heart,
  Briefcase,
  Users,
  ChevronRight,
  Award
} from "lucide-react";

const Services = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  // Mock services data
  const servicesData = [
    {
      id: 1,
      title: "Full-Stack Web Development",
      category: "Development",
      description: "Custom web applications using React, Node.js, and modern technologies. From concept to deployment.",
      provider: "Anonymous",
      rating: 4.9,
      reviews: 127,
      startingPrice: 150,
      deliveryTime: "7 days",
      location: "Remote",
      tags: ["React", "Node.js", "MongoDB", "AWS"],
      featured: true,
      verified: true,
      icon: Code,
    },
    {
      id: 2,
      title: "Brand Identity & Logo Design",
      category: "Design",
      description: "Complete brand identity package including logo, color palette, typography, and brand guidelines.",
      provider: "Anonymous",
      rating: 4.8,
      reviews: 89,
      startingPrice: 89,
      deliveryTime: "5 days",
      location: "Algeria",
      tags: ["Logo Design", "Branding", "Illustrator", "Figma"],
      featured: false,
      verified: true,
      icon: Palette,
    },
    {
      id: 3,
      title: "Content Writing & SEO",
      category: "Writing",
      description: "SEO-optimized content writing for blogs, websites, and marketing materials that drive traffic.",
      provider: "Anonymous",
      rating: 4.7,
      reviews: 156,
      startingPrice: 45,
      deliveryTime: "3 days",
      location: "Remote",
      tags: ["SEO", "Content Writing", "Copywriting", "Marketing"],
      featured: true,
      verified: false,
      icon: PenTool,
    },
    {
      id: 4,
      title: "Mobile App UI/UX Design",
      category: "Design",
      description: "Modern, user-friendly mobile app designs with prototypes and design systems included.",
      provider: "Anonymous",
      rating: 4.9,
      reviews: 73,
      startingPrice: 120,
      deliveryTime: "10 days",
      location: "Tunisia",
      tags: ["UI/UX", "Mobile Design", "Figma", "Prototyping"],
      featured: false,
      verified: true,
      icon: Smartphone,
    },
    {
      id: 5,
      title: "Digital Marketing Strategy",
      category: "Marketing",
      description: "Comprehensive digital marketing strategy including social media, PPC, and content marketing plans.",
      provider: "Anonymous",
      rating: 4.8,
      reviews: 94,
      startingPrice: 200,
      deliveryTime: "14 days",
      location: "Morocco",
      tags: ["Digital Marketing", "Strategy", "Social Media", "PPC"],
      featured: true,
      verified: true,
      icon: TrendingUp,
    },
    {
      id: 6,
      title: "Video Editing & Production",
      category: "Video",
      description: "Professional video editing for marketing, tutorials, and social media content with motion graphics.",
      provider: "Anonymous",
      rating: 4.6,
      reviews: 112,
      startingPrice: 75,
      deliveryTime: "5 days",
      location: "Remote",
      tags: ["Video Editing", "Motion Graphics", "After Effects", "Premiere"],
      featured: false,
      verified: false,
      icon: Video,
    },
    {
      id: 7,
      title: "Data Analysis & Visualization",
      category: "Data",
      description: "Advanced data analysis with interactive dashboards and actionable insights for business decisions.",
      provider: "Anonymous",
      rating: 4.9,
      reviews: 68,
      startingPrice: 180,
      deliveryTime: "7 days",
      location: "Remote",
      tags: ["Data Analysis", "Python", "Tableau", "Machine Learning"],
      featured: false,
      verified: true,
      icon: FileText,
    },
    {
      id: 8,
      title: "Translation Services",
      category: "Language",
      description: "Professional translation services for business documents, websites, and marketing materials.",
      provider: "Anonymous",
      rating: 4.7,
      reviews: 203,
      startingPrice: 25,
      deliveryTime: "2 days",
      location: "Algeria",
      tags: ["Translation", "Multilingual", "Localization", "Proofreading"],
      featured: false,
      verified: true,
      icon: Languages,
    }
  ];

  const categories = [
    { id: "all", name: "All Categories", icon: Globe },
    { id: "Development", name: "Development", icon: Code },
    { id: "Design", name: "Design", icon: Palette },
    { id: "Writing", name: "Writing", icon: PenTool },
    { id: "Marketing", name: "Marketing", icon: Megaphone },
    { id: "Video", name: "Video", icon: Video },
    { id: "Data", name: "Data", icon: TrendingUp },
    { id: "Language", name: "Language", icon: Languages },
  ];

  // Filter services based on search and filters
  const filteredServices = servicesData.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    
    const matchesPrice = priceRange === "all" ||
                        (priceRange === "under50" && service.startingPrice < 50) ||
                        (priceRange === "50to100" && service.startingPrice >= 50 && service.startingPrice <= 100) ||
                        (priceRange === "100to200" && service.startingPrice > 100 && service.startingPrice <= 200) ||
                        (priceRange === "over200" && service.startingPrice > 200);
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.startingPrice - b.startingPrice;
      case "price-high":
        return b.startingPrice - a.startingPrice;
      case "rating":
        return b.rating - a.rating;
      case "reviews":
        return b.reviews - a.reviews;
      default: // featured
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />
      <div className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-orange-100 via-white to-orange-50 py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight mb-4 text-slate-900">
                Professional Services Marketplace
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-orange-600 max-w-2xl mx-auto">
                Discover talented professionals offering high-quality services for your business needs
              </p>
            </div>
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-orange-100">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search for services, skills, or keywords..."
                      className="pl-10 h-12 text-sm sm:text-base border-0 focus:ring-2 focus:ring-orange-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-48 h-12 border-0 focus:ring-2 focus:ring-orange-500">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="h-12 px-8 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50">
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
          <div className="flex gap-6 sm:gap-8">
            {/* Filters Sidebar */}
            <aside className="w-80 bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-24 border-2 border-orange-100">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-orange-600" />
                <h3 className="text-base sm:text-lg font-bold">Filters</h3>
              </div>
              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-bold mb-3 text-sm">Categories</h4>
                <div className="space-y-2">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${
                          selectedCategory === category.id ? 'bg-orange-100 border-orange-500' : 'border-transparent'
                        } border-2`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={selectedCategory === category.id}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="hidden"
                        />
                        <Icon className="w-5 h-5 text-orange-500" />
                        <span className="text-xs sm:text-sm font-medium">{category.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-bold mb-3 text-sm">Price Range</h4>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under50">Under $50</SelectItem>
                    <SelectItem value="50to100">$50 - $100</SelectItem>
                    <SelectItem value="100to200">$100 - $200</SelectItem>
                    <SelectItem value="over200">Over $200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Sort By */}
              <div className="mb-6">
                <h4 className="font-bold mb-3 text-sm">Sort By</h4>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Quick Stats */}
              <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-100">
                <h4 className="font-bold mb-2 text-orange-700 text-sm">Marketplace Stats</h4>
                <div className="space-y-1 text-xs">
                  <p className="flex justify-between">
                    <span>Total Services:</span>
                    <span className="font-medium">{servicesData.length}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Active Providers:</span>
                    <span className="font-medium">1,200+</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Projects Completed:</span>
                    <span className="font-medium">25,000+</span>
                  </p>
                </div>
              </div>
            </aside>
            {/* Services Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">
                    {searchTerm ? `Search Results for "${searchTerm}"` : "All Services"}
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">{sortedServices.length} services found</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {sortedServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <Card
                      key={service.id}
                      className="group border-2 border-orange-200 bg-white rounded-lg sm:rounded-2xl h-full flex flex-col overflow-hidden transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 p-0"
                    >
                      <CardHeader className="p-6 pb-4 border-b-2 border-orange-100 bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-7 h-7 text-orange-500" />
                          </div>
                        </div>
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                          {service.title}
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base leading-relaxed text-gray-700 line-clamp-3">
                          {service.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Anonymous</span>
                          <span className="mx-1">·</span>
                          <MapPin className="w-3 h-3" />
                          <span>{service.location}</span>
                          <span className="mx-2">·</span>
                          <Clock className="w-3 h-3" />
                          <span>{service.deliveryTime}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {service.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-100"
                            >
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 3 && (
                            <span className="text-xs text-gray-400 pt-1">+{service.tags.length - 3} more</span>
                          )}
                        </div>
                        <div className="mt-auto flex flex-col gap-3 pt-4 border-t-2 border-orange-100">
                          <div className="flex items-end justify-between w-full">
                            <div>
                              <span className="text-2xl font-bold text-orange-600">${service.startingPrice}</span>
                              <span className="text-xs text-gray-500 block">starting at</span>
                            </div>
                            {/* Empty for spacing/alignment */}
                          </div>
                          <div className="flex gap-3 w-full">
                            <Button size="sm" variant="outline" className="flex-1 rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis">Contact</Button>
                            <Button 
                              size="sm" 
                              className="flex-1 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 whitespace-nowrap overflow-hidden text-ellipsis"
                              onClick={() => navigate(`/services/${service.id}`)}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {/* Pagination */}
              <div className="flex justify-center items-center gap-3 mt-12 mb-16">
                <Button variant="outline" size="sm" className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300 disabled:opacity-60 disabled:text-white">
                  ← Previous
                </Button>
                <Button size="sm" className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50">1</Button>
                <Button variant="outline" size="sm" className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300">2</Button>
                <Button variant="outline" size="sm" className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300">3</Button>
                <Button variant="outline" size="sm" className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300">
                  Next →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Services;