import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Leaf, Linkedin, Mail, MapPin, MessageCircle, Phone, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-border/70 bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="space-y-4 lg:col-span-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl hero-gradient">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <div className="text-lg font-bold">Green Tech</div>
              <div className="text-xs text-muted-foreground">Africa</div>
            </div>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            End-to-end construction and real estate services designed for modern African cities, with a deep focus on sustainability.
          </p>
          <div className="flex items-center gap-2">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
              <Button key={idx} size="icon" variant="outline" className="h-9 w-9 rounded-full">
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">Company</h3>
          <div className="space-y-2 text-sm">
            {[
              ["About Us", "/about"],
              ["Services", "/services"],
              ["Projects", "/projects"],
              ["Properties", "/properties"],
            ].map(([label, path]) => (
              <Link key={label} to={path} className="block text-muted-foreground hover:text-primary">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">Contact</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /> Nairobi, Kenya</div>
            <div className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-primary" /> +254 700 123 456</div>
            <div className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 text-primary" /> info@greentechafrica.com</div>
          </div>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <a href="https://wa.me/254700123456" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp us
            </a>
          </Button>
        </div>

        <div className="lg:col-span-3">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">Stay Updated</h3>
          <p className="mb-3 text-sm text-muted-foreground">Get new property alerts and project updates.</p>
          <div className="flex gap-2">
            <Input placeholder="Your email" className="h-10" />
            <Button variant="hero" className="h-10">Join</Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:px-6 md:flex-row lg:px-8">
          <div>© 2025 Green Tech Africa. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
