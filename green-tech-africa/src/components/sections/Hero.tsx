import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Home, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";

const stats = [
  { number: "250+", label: "Projects Completed" },
  { number: "15+", label: "Years Experience" },
  { number: "500+", label: "Happy Clients" },
  { number: "50+", label: "Green Buildings" },
  { number: "1000+", label: "Acres Sold" },
  { number: "500+", label: "Legal Cases Won" },
];

const Hero = () => {
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-professional/95 via-professional/85 to-professional/60" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-success" />
            Sustainable construction + trusted property investments
          </div>

          <h1 className="text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            Build, Buy & Invest
            <span className="block text-gradient">with Confidence in Africa</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
            From smart homes and prime land to commercial developments, Green Tech Africa gives customers one modern platform to discover, compare, and move forward faster.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="hero" size="xl" asChild className="group shadow-elegant">
              <Link to="/projects">
                <Building className="mr-2 h-5 w-5" /> Explore Projects
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-professional" asChild>
              <Link to="/properties"><Home className="mr-2 h-5 w-5" />View Properties</Link>
            </Button>
            <Button variant="outline" size="xl" className="border-white/30 bg-white/10 text-white hover:bg-white hover:text-professional" asChild>
              <Link to="/land"><Scale className="mr-2 h-5 w-5" />Land Sales & Legal</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/90">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm"><ShieldCheck className="h-4 w-4 text-success" />Verified listings</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm"><ShieldCheck className="h-4 w-4 text-success" />Transparent documentation</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm"><ShieldCheck className="h-4 w-4 text-success" />Dedicated support</div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md md:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-success md:text-3xl">{stat.number}</div>
              <div className="mt-1 text-xs text-white/80 md:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
