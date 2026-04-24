import Navbar from '@/components/public-pages/navbar';
import Footer from '@/components/public-pages/footer';
import { Check, User, Users, Shield } from 'lucide-react';
import BodyPublicLink from '@/components/public-pages/body-public-link';
import { Metadata } from 'next';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Pricing | Simple & Transparent Markdown Collaboration',
  description: 'MondreyMD is currently free for all early adopters. Explore our upcoming team and enterprise plans.',
};

const pricingPlans = [
  {
    name: 'Individual',
    price: '$0',
    description: 'Perfect for solo creators, students, and developers building personal knowledge bases.',
    features: ['Unlimited Documents', 'Real-time Markdown Sync', 'Export to PDF/HTML', 'Community Support'],
    buttonText: 'Get Started Free',
    status: 'active', // Highlighting this one
    icon: User,
  },
  {
    name: 'Pro Team',
    price: '$12',
    description: 'Advanced collaboration tools for high-velocity startups and engineering teams.',
    features: ['Everything in Individual', 'Shared Workspaces', 'Advanced Permissions', 'Version History', 'Priority Support'],
    buttonText: 'Sold Out / Coming Soon',
    status: 'sold-out',
    icon: Users,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Security and administrative controls for organizations with strict compliance needs.',
    features: ['SAML SSO', 'Audit Logs', 'Dedicated Support', 'On-premise Options', 'Unlimited Seats'],
    buttonText: 'Contact for Waitlist',
    status: 'sold-out',
    icon: Shield,
  },
];

export default function PricingPage() {
  return (
    <div className="text-foreground bg-background h-screen overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />

      <div className="flex flex-col px-6 items-center">
        <section className="relative w-full max-w-280 pt-24 pb-16">
          <div className="flex flex-col items-start space-y-6 max-w-4xl">
            <span className="text-primary font-mono text-xs uppercase tracking-[0.3em] font-bold">Current Phase: Early Access</span>
            <h1 className="text-[2.75rem] md:text-[5rem] font-black tracking-tighter leading-[0.9] text-start">
              Free for now. <br />
              <span className="text-primary text-balance">Powerful forever.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-start max-w-3xl">
              MondreyMD is in active development. During our early access phase, the core platform is completely free to use. Join us as we build the
              future of collaborative writing.
            </p>
          </div>
        </section>

        <Separator className="max-w-280" />

        {/* PRICING GRID */}
        <section className="w-full max-w-280 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => {
              const isActive = plan.status === 'active';

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 ${
                    isActive ? 'bg-sidebar border-primary shadow-2xl shadow-primary/10 z-10 scale-105' : 'bg-sidebar/40 border-border grayscale opacity-60'
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Early Access Active
                    </div>
                  )}

                  <div className="mb-8 space-y-4">
                    <div className={`p-3 w-fit rounded-xl ${isActive ? 'bg-primary/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-muted-foreground">/mo</span>}
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-sm h-12">{plan.description}</p>
                  </div>

                  <div className="grow space-y-4 mb-10">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-3 text-sm">
                        <Check className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isActive ? (
                    <BodyPublicLink
                      title={plan.buttonText}
                      href="/login"
                      classname="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                    />
                  ) : (
                    <button
                      disabled
                      className="w-full h-12 rounded-2xl bg-muted/50 text-muted-foreground font-bold cursor-not-allowed border border-border italic text-sm"
                    >
                      {plan.buttonText}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <Separator className="max-w-280" />

        {/* ROADMAP / MISSION SECTION */}
        <section className="w-full max-w-280 py-24 text-start">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tighter">Why is it free?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                As a solo founder, my priority is building a tool that actually works for you. By keeping MondreyMD free during this phase, I can gather
                the feedback necessary to build the best Markdown environment on the market.
              </p>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tighter">When are the Pro plans coming?</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We are currently refining our collaborative engine. Once we reach a 1:1 parity with our reliability standards, we will open up the Pro and
                Enterprise slots. Early adopters will always receive a legacy discount.
              </p>
            </div>
          </div>
        </section>
        {/* CTA SECTION: Pricing */}
        <section className="w-full max-w-280 py-24">
          <div className="relative bg-sidebar border border-border rounded-[3.5rem] p-10 md:p-20 overflow-hidden flex flex-col items-start text-start gap-8">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10" />

            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Start free. Scale when you’re ready.</h2>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Transparent pricing. No lock-in. Upgrade as your team grows and keep full ownership of your Markdown knowledge base.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <BodyPublicLink
                title="Get Started Free"
                href="/login"
                classname="h-12 px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
