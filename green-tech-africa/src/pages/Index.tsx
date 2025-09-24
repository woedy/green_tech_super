import Layout from "@/components/layout/Layout";
import Hero from "@/components/sections/Hero";
import ServicesOverview from "@/components/sections/ServicesOverview";
import FeaturedProjects from "@/components/sections/FeaturedProjects";
import Testimonials from "@/components/sections/Testimonials";

const Index = () => {
  return (
    <Layout>
      <Hero />
      <ServicesOverview />
      <FeaturedProjects />
      <Testimonials />
    </Layout>
  );
};

export default Index;
