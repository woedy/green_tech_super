import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Leaf, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  MessageCircle
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-professional text-professional-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 hero-gradient rounded-lg">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-professional-foreground">
                  Green Tech
                </span>
                <span className="text-xs text-professional-foreground/70 -mt-1">
                  Africa
                </span>
              </div>
            </Link>
            <p className="text-professional-foreground/80 text-sm leading-relaxed">
              Leading construction and real estate company in Africa, 
              committed to sustainable development and innovative green technology.
            </p>
            <div className="flex space-x-3">
              <Button size="icon" variant="ghost" className="text-professional-foreground/70 hover:text-success hover:bg-professional-foreground/10">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-professional-foreground/70 hover:text-success hover:bg-professional-foreground/10">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-professional-foreground/70 hover:text-success hover:bg-professional-foreground/10">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-professional-foreground/70 hover:text-success hover:bg-professional-foreground/10">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2">
              {[
                { name: "About Us", path: "/about" },
                { name: "Our Services", path: "/services" },
                { name: "Projects", path: "/projects" },
                { name: "Properties", path: "/properties" },
                { name: "Contact", path: "/contact" },
              ].map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block text-professional-foreground/80 hover:text-success smooth-transition text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Our Services</h3>
            <div className="space-y-2">
              {[
                "Residential Construction",
                "Commercial Development", 
                "Property Management",
                "Real Estate Sales",
                "Green Building Consulting",
                "Infrastructure Development"
              ].map((service) => (
                <div
                  key={service}
                  className="text-professional-foreground/80 text-sm"
                >
                  {service}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-success mt-1 flex-shrink-0" />
                <div className="text-professional-foreground/80 text-sm">
                  123 Green Tech Plaza<br />
                  Accra, Ghana<br />
                  P.O. Box 12345
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-success flex-shrink-0" />
                <div className="text-professional-foreground/80 text-sm">
                  +233 20 765 4321
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-success flex-shrink-0" />
                <div className="text-professional-foreground/80 text-sm">
                  info@greentechafrica.com
                </div>
              </div>
              <Button 
                variant="success" 
                size="sm" 
                className="w-full mt-4"
                asChild
              >
                <a href="https://wa.me/233207654321" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-professional-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-professional-foreground/70 text-sm">
              © 2025 Green Tech Africa. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link 
                to="/privacy" 
                className="text-professional-foreground/70 hover:text-success smooth-transition"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="text-professional-foreground/70 hover:text-success smooth-transition"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
