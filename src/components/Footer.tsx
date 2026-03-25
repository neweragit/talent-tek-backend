import { Link } from "react-router-dom";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Platform",
      links: [
        { name: "For Company", path: "/for-company" },
        { name: "For Talents", path: "/for-talents" },
        { name: "Pricing", path: "/pricing" },
        { name: "How It Works", path: "/" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", path: "/" },
        { name: "Careers", path: "/" },
        { name: "Blog", path: "/" },
        { name: "Contact", path: "/" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", path: "/" },
        { name: "Documentation", path: "/" },
        { name: "API", path: "/" },
        { name: "Partners", path: "/" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", path: "/" },
        { name: "Terms of Service", path: "/" },
        { name: "Cookie Policy", path: "/" },
        { name: "GDPR", path: "/" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-black border-t border-gray-900 text-white">
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-orange-600/10 via-black to-orange-500/5 animate-gradient-pan" />
      {/* Floating glow blobs */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-orange-500/20 animate-float"
            style={{
              width: `${Math.random() * 180 + 40}px`,
              height: `${Math.random() * 180 + 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              filter: 'blur(40px)',
              transform: 'translate(-50%, -50%)',
              opacity: 0.5,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <img src="/src/logo/logo.jfif" alt="TalenTek" className="h-10 w-10" />
              <span className="text-3xl font-bold text-white">TalenTek</span>
            </Link>
            <p className="text-sm text-gray-300">
              Empowering the future workforce by connecting top global talent with leading companies.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4 text-white">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-300 hover:text-orange-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} TalenTek. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
