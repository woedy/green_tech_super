import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Users, 
  Award, 
  Target, 
  Eye, 
  Heart,
  ArrowRight,
  TreePine,
  Recycle,
  Sun
} from "lucide-react";
import { Link } from "react-router-dom";
import teamImage from "@/assets/team-construction.jpg";

const About = () => {
  const values = [
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Committed to eco-friendly construction practices and renewable energy solutions."
    },
    {
      icon: Users,
      title: "Community",
      description: "Building strong communities through responsible development and local partnerships."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Delivering the highest quality construction and real estate services across Africa."
    },
    {
      icon: Heart,
      title: "Integrity",
      description: "Operating with transparency, honesty, and ethical business practices."
    }
  ];

  const achievements = [
    { number: "250+", label: "Projects Completed", icon: Award },
    { number: "15+", label: "Years Experience", icon: Target },
    { number: "500+", label: "Happy Clients", icon: Users },
    { number: "50+", label: "Green Buildings", icon: TreePine },
  ];

  const sustainability = [
    {
      icon: TreePine,
      title: "Green Building Certification",
      description: "All our projects meet or exceed international green building standards."
    },
    {
      icon: Sun,
      title: "Renewable Energy Integration",
      description: "Solar panels and renewable energy systems in every development."
    },
    {
      icon: Recycle,
      title: "Sustainable Materials",
      description: "Using recycled and locally sourced materials whenever possible."
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-accent/20 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="outline">
                About Green Tech Africa
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Building Africa's
                <span className="text-gradient block">Sustainable Future</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                For over 15 years, Green Tech Africa has been at the forefront of 
                sustainable construction and real estate development across the continent. 
                We combine innovative green technology with traditional craftsmanship to 
                create buildings that are both beautiful and environmentally responsible.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/contact">
                  Work With Us
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <img 
                src={teamImage} 
                alt="Green Tech Africa Team"
                className="rounded-2xl shadow-strong w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-success text-success-foreground p-6 rounded-xl shadow-medium">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-sm">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Mission */}
            <Card className="shadow-medium">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To transform Africa's construction and real estate landscape through 
                  sustainable building practices, innovative green technology, and 
                  community-focused development.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="shadow-medium">
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To be Africa's leading sustainable construction and real estate 
                  company, setting the standard for environmental responsibility 
                  and innovative building solutions.
                </p>
              </CardContent>
            </Card>

            {/* Impact */}
            <Card className="shadow-medium">
              <CardContent className="p-8 text-center">
                <Leaf className="w-12 h-12 text-primary-light mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-4">Our Impact</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Creating lasting positive change in communities across Africa 
                  through responsible development and sustainable building practices 
                  that benefit both people and planet.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <Card key={index} className="shadow-soft hover-lift smooth-transition">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mb-4">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{value.title}</h4>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-professional text-professional-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our Achievements
            </h2>
            <p className="text-xl text-professional-foreground/80 max-w-3xl mx-auto">
              Delivering excellence across Africa for over a decade
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <div key={index} className="text-center">
                  <IconComponent className="w-12 h-12 text-success mx-auto mb-4" />
                  <div className="text-4xl font-bold text-professional-foreground mb-2">
                    {achievement.number}
                  </div>
                  <div className="text-professional-foreground/80">
                    {achievement.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sustainability Focus */}
      <section className="py-20 bg-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Our Commitment to Sustainability
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leading the way in green building practices and environmental responsibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {sustainability.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card key={index} className="shadow-medium hover-lift smooth-transition">
                  <CardContent className="p-8 text-center">
                    <IconComponent className="w-12 h-12 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button variant="success" size="lg" asChild>
              <Link to="/services">
                Learn About Our Green Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;