import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Mwangi",
      position: "CEO, TechVenture Kenya",
      company: "TechVenture Kenya",
      content: "Green Tech Africa delivered our commercial complex on time and within budget. Their commitment to sustainability and quality is unmatched. The building's green features have significantly reduced our operational costs.",
      rating: 5,
      avatar: "SM"
    },
    {
      name: "David Okafor",
      position: "Property Developer",
      company: "Okafor Holdings",
      content: "Working with Green Tech Africa on our residential project was exceptional. Their expertise in green building technology and attention to detail resulted in a development that exceeded our expectations.",
      rating: 5,
      avatar: "DO"
    },
    {
      name: "Amina Hassan",
      position: "Real Estate Investor",
      company: "Hassan Properties",
      content: "The team's professionalism and innovative approach to sustainable construction made our investment incredibly successful. The properties are not only beautiful but also environmentally responsible.",
      rating: 5,
      avatar: "AH"
    }
  ];

  const clients = [
    "TechVenture Kenya",
    "Okafor Holdings", 
    "Hassan Properties",
    "Green Bank Africa",
    "Summit Hotels",
    "Urban Development Corp"
  ];

  return (
    <section className="py-20 bg-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            What Our Clients Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Trusted by leading businesses and individuals across Africa for 
            exceptional construction and real estate services.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-medium hover-lift smooth-transition">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Quote className="w-8 h-8 text-primary/30 mr-2" />
                  <div className="flex space-x-1 ml-auto">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-primary-foreground font-semibold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.position}
                    </div>
                    <div className="text-xs text-primary font-medium">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Client Logos */}
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-8">
            Trusted by Leading Organizations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {clients.map((client, index) => (
              <div 
                key={index} 
                className="bg-background rounded-lg p-4 shadow-soft hover-lift smooth-transition"
              >
                <div className="text-center text-sm font-medium text-muted-foreground">
                  {client}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;