import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  Users,
  Award,
  MessageSquare,
  Heart,
  Share2,
  Code,
  Palette,
  PenTool,
  Smartphone,
  TrendingUp,
  Video,
  FileText,
  Languages,
  Shield,
  RefreshCw,
  Zap
} from "lucide-react";

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState("standard");

  // Mock service data - in real app, fetch based on id
  const servicesData = {
    "1": {
      id: 1,
      title: "Full-Stack Web Development",
      category: "Development",
      description: "Custom web applications using React, Node.js, and modern technologies. From concept to deployment.",
      fullDescription: "I specialize in building modern, scalable web applications from scratch. With over 5 years of experience in full-stack development, I deliver high-quality solutions that meet your business needs. My services include responsive design, database architecture, API development, and cloud deployment.",
      provider: "Anonymous",
      rating: 4.9,
      reviews: 127,
      startingPrice: 150,
      deliveryTime: "7 days",
      location: "Remote",
      tags: ["React", "Node.js", "MongoDB", "AWS", "Docker", "REST API", "TypeScript", "PostgreSQL"],
      featured: true,
      verified: true,
      icon: Code,
      completedProjects: 156,
      responseTime: "1 hour",
      packages: {
        basic: {
          name: "Basic",
          price: 150,
          deliveryTime: "5 days",
          revisions: 2,
          features: [
            "Landing page design",
            "Responsive layout",
            "Basic animations",
            "Contact form integration",
            "2 revisions"
          ]
        },
        standard: {
          name: "Standard",
          price: 450,
          deliveryTime: "7 days",
          revisions: 3,
          features: [
            "Multi-page website",
            "Custom design",
            "Database integration",
            "Authentication system",
            "API development",
            "3 revisions",
            "Source code included"
          ]
        },
        premium: {
          name: "Premium",
          price: 900,
          deliveryTime: "14 days",
          revisions: 5,
          features: [
            "Full web application",
            "Custom architecture",
            "Advanced features",
            "Third-party integrations",
            "Admin panel",
            "API documentation",
            "Cloud deployment",
            "5 revisions",
            "3 months support"
          ]
        }
      },
      portfolio: [
        { id: 1, title: "E-commerce Platform", description: "Full-featured online store" },
        { id: 2, title: "SaaS Dashboard", description: "Analytics and reporting tool" },
        { id: 3, title: "Social Network", description: "Community platform with messaging" }
      ],
      faqs: [
        { q: "Do you provide source code?", a: "Yes, all packages include complete source code with documentation." },
        { q: "What technologies do you use?", a: "I primarily work with React, Node.js, MongoDB/PostgreSQL, and AWS for deployment." },
        { q: "Can you work with existing projects?", a: "Absolutely! I can continue development on existing codebases or provide maintenance." },
        { q: "Do you offer post-launch support?", a: "Yes, premium packages include 3 months of support. Additional support can be purchased separately." }
      ]
    }
    // Add more services as needed
  };

  const service = servicesData[id as string] || servicesData["1"];
  const Icon = service.icon;
  const currentPackage = service.packages[selectedPackage as keyof typeof service.packages];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/services')}
              className="text-orange-600 hover:text-orange-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Header */}
              <Card className="border-orange-100 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                          {service.category}
                        </Badge>
                        {service.featured && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        {service.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{service.rating}</span>
                          <span className="text-gray-400">({service.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-orange-500" />
                          <span>Anonymous Provider</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span>{service.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="border-orange-200 text-orange-600">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="border-orange-200 text-orange-600">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Key Features */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-600">Delivery Time</p>
                        <p className="font-semibold text-gray-900">{service.deliveryTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <Award className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-600">Completed</p>
                        <p className="font-semibold text-gray-900">{service.completedProjects} projects</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-600">Response Time</p>
                        <p className="font-semibold text-gray-900">{service.responseTime}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Card className="border-orange-100 shadow-sm">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none bg-white px-8 pt-4">
                    <TabsTrigger value="overview" className="data-[state=active]:border-orange-500 data-[state=active]:text-orange-600">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" className="data-[state=active]:border-orange-500 data-[state=active]:text-orange-600">
                      Portfolio
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="data-[state=active]:border-orange-500 data-[state=active]:text-orange-600">
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="data-[state=active]:border-orange-500 data-[state=active]:text-orange-600">
                      FAQ
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">About This Service</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {service.fullDescription}
                        </p>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Skills & Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {service.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-orange-50 text-orange-700 border-orange-200 px-4 py-2 text-sm"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">What's Included</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>Clean, documented code</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>Responsive design</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>SEO optimization</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>Cross-browser compatibility</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>Security best practices</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span>Performance optimization</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="portfolio" className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Projects</h3>
                    <div className="grid gap-4">
                      {service.portfolio.map((project) => (
                        <Card key={project.id} className="border-orange-100 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
                            <p className="text-sm text-gray-600">{project.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-8 p-6 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-orange-600">{service.rating}</div>
                          <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{service.reviews} reviews</p>
                        </div>
                        <Separator orientation="vertical" className="h-20" />
                        <div className="flex-1 space-y-2">
                          {[5, 4, 3, 2, 1].map((stars) => (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="text-sm w-12">{stars} stars</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-500"
                                  style={{ width: `${stars === 5 ? 80 : stars === 4 ? 15 : 5}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {stars === 5 ? 80 : stars === 4 ? 15 : 5}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sample Reviews */}
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Card key={i} className="border-orange-100">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <Avatar>
                                  <AvatarFallback className="bg-orange-100 text-orange-700">
                                    A{i}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold">Anonymous User</span>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">
                                    Excellent work! The developer delivered exactly what I needed and more. 
                                    Highly professional and responsive.
                                  </p>
                                  <span className="text-xs text-gray-500">2 weeks ago</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="faq" className="p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                      {service.faqs.map((faq, idx) => (
                        <Card key={idx} className="border-orange-100">
                          <CardContent className="p-6">
                            <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                            <p className="text-gray-700">{faq.a}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Sidebar - Contact */}
            <div className="lg:col-span-1">
              <Card className="border-orange-200 shadow-lg sticky top-24">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 mb-3">
                      Order Now
                    </Button>

                    <Button variant="outline" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 mb-2">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Provider
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Why Choose This Service?</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Shield className="w-4 h-4 text-orange-600" />
                      <span>Money-back guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-orange-600" />
                      <span>Quality assurance</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Award className="w-4 h-4 text-orange-600" />
                      <span>Top-rated provider</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceDetails;
