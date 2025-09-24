import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <Layout>
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Legal Information
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground">
              Last updated: January 2024
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  By accessing and using Green Tech Africa's services, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service apply to all users of our construction and real estate services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Service Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>Green Tech Africa provides:</p>
                <ul>
                  <li>Construction services including residential, commercial, and industrial projects</li>
                  <li>Real estate services including property sales, management, and consultation</li>
                  <li>Green building and sustainability consulting</li>
                  <li>Property development and investment advisory services</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Client Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>Clients agree to:</p>
                <ul>
                  <li>Provide accurate and complete information for all projects</li>
                  <li>Obtain necessary permits and approvals as required</li>
                  <li>Make payments according to agreed terms and schedules</li>
                  <li>Ensure site access and safety compliance</li>
                  <li>Communicate changes or concerns promptly</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Payment Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <ul>
                  <li>Payment schedules will be outlined in individual project contracts</li>
                  <li>Late payments may incur additional charges as specified in contracts</li>
                  <li>All prices are subject to change based on material costs and project scope</li>
                  <li>Deposits are typically required before project commencement</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Project Delivery and Timelines</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Project timelines are estimates based on normal working conditions. Delays may occur due to weather, permit approvals, material availability, or client-requested changes. We will communicate any potential delays promptly and work to minimize their impact.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Warranties and Guarantees</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <ul>
                  <li>Construction work comes with industry-standard warranties</li>
                  <li>Structural work typically includes a 10-year warranty</li>
                  <li>Materials and workmanship warranties vary by component</li>
                  <li>Warranty terms will be detailed in individual project contracts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Green Tech Africa's liability is limited to the contract value of services provided. We are not liable for indirect, consequential, or incidental damages. Our insurance coverage provides additional protection for clients as outlined in project contracts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  All designs, plans, and proprietary methods remain the intellectual property of Green Tech Africa unless specifically transferred in writing. Clients receive usage rights for their specific projects.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  Any disputes arising from our services will first be addressed through good faith negotiations. If resolution cannot be achieved, disputes will be settled through arbitration in accordance with local laws and regulations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Modifications to Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  These terms may be updated periodically. Clients will be notified of significant changes. Continued use of our services constitutes acceptance of revised terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                <p>
                  For questions about these Terms of Service, please contact us:
                </p>
                <ul>
                  <li>Email: legal@greentechafrica.com</li>
                  <li>Phone: +234 801 234 5678</li>
                  <li>Address: 123 Green Tech Plaza, Victoria Island, Lagos, Nigeria</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;