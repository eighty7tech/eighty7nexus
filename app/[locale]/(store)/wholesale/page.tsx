import { getTranslations } from "next-intl/server";
import { 
  Building2, 
  PackageCheck, 
  Tags, 
  BadgeDollarSign, 
  Handshake, 
  FileText, 
  Network, 
  Truck, 
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default async function WholesaleFrontPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic Hero Section */}
      <section className="relative overflow-hidden bg-primary/5 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center justify-center p-2 px-4 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-4 border border-primary/20 backdrop-blur-sm">
            <Building2 className="w-4 h-4 mr-2" />
            B2B Portal
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Wholesale Purchasing <br className="hidden md:block"/> Reimagined
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Access bulk pricing, request custom quotes, and manage your corporate account directly from our optimized B2B storefront. Join over 500+ trusted partners.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-xl w-full sm:w-auto shadow-xl shadow-primary/25">
              <Link href={`/${locale}/products`}>
                Browse Wholesale Catalog
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl w-full sm:w-auto bg-background/50 backdrop-blur-sm">
              <Link href={`/${locale}/auth/register?type=vendor`}>
                Apply for an Account
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats/Trust Bar */}
      <section className="border-y bg-card/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border">
            <div className="space-y-2">
              <h4 className="text-3xl font-bold text-foreground">500+</h4>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Partners</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-bold text-foreground">10k+</h4>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Products Available</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-bold text-foreground">99%</h4>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">On-time Delivery</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-bold text-foreground">24/7</h4>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Dedicated Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Stepper */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Streamlined Onboarding</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Get your corporate account set up in four simple steps and start taking advantage of exclusive B2B benefits.</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0"></div>
          
          {[
            { icon: FileText, title: "Apply", desc: "Submit your business details and tax ID." },
            { icon: ShieldCheck, title: "Approve", desc: "Our team verifies your account within 24h." },
            { icon: Tags, title: "Order", desc: "Unlock tier-pricing and bulk discounts." },
            { icon: Handshake, title: "Terms", desc: "Checkout seamlessly with Net 30 terms." }
          ].map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center bg-background">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 mb-6 group transition-transform hover:scale-110">
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{idx + 1}. {step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Expanded Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything your purchasing department needs to operate efficiently at scale.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Tags} 
              color="emerald" 
              title="Tiered Volume Discounts" 
              desc="Unlock deeper discounts automatically as your cart quantity increases. No coupon codes required." 
            />
            <FeatureCard 
              icon={BadgeDollarSign} 
              color="blue" 
              title="Net Terms Eligibility" 
              desc="Approved accounts can checkout instantly using Net 30 or Net 60 terms and pay by invoice." 
            />
            <FeatureCard 
              icon={Building2} 
              color="amber" 
              title="Dedicated Rep" 
              desc="Work directly with a designated account manager for custom quotes and priority support." 
            />
            <FeatureCard 
              icon={Network} 
              color="indigo" 
              title="API & ERP Integration" 
              desc="Connect your internal procurement systems directly to our product feeds and order endpoints." 
            />
            <FeatureCard 
              icon={PackageCheck} 
              color="rose" 
              title="Tax Exemption" 
              desc="Upload your resale certificates to automatically remove taxes from eligible wholesale orders." 
            />
            <FeatureCard 
              icon={Truck} 
              color="cyan" 
              title="Freight Logistics" 
              desc="LTL and FTL freight shipping options available directly in checkout for massive orders." 
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg">What is the Minimum Order Quantity (MOQ)?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
              MOQs vary by product category. Some products require a minimum of 50 units, while master cartons might require only 5 cases. The exact MOQ is displayed on each product page.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg">How do I qualify for Net 30 terms?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
              Once you've registered for a wholesale account and completed 3 successful prepaid orders, you can apply for Net terms through your dashboard. Approvals are subject to a standard credit check.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg">Can I get a sample before ordering in bulk?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
              Yes, we offer a sample program for verified B2B partners. You can order single units at the wholesale base tier price to evaluate quality before committing to a larger run.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg">Do you offer dropshipping?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
              While our primary focus is bulk B2B fulfillment, we do offer API integrations that allow approved partners to route individual D2C orders through our fulfillment centers. Contact your rep for details.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-3xl p-12 text-center text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="w-64 h-64" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to scale your supply chain?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join the platform powering hundreds of businesses with reliable, bulk-priced inventory.
            </p>
            <Button asChild size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-xl">
              <Link href={`/${locale}/auth/register?type=vendor`}>
                Create Wholesale Account
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, color, title, desc }: { icon: any, color: string, title: string, desc: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    indigo: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    cyan: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  };

  return (
    <div className="bg-card border rounded-3xl p-8 flex flex-col space-y-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className={`p-4 rounded-2xl w-16 h-16 flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
