import Navbar from '@/components/public-pages/navbar';
import Footer from '@/components/public-pages/footer';
import { ArrowRight, FileText, UserPlus, Users, ShieldCheck } from 'lucide-react';
import BodyPublicLink from '@/components/public-pages/body-public-link';
import { Metadata } from 'next';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const teamFeatures = [
  {
    title: 'Real-Time Team Collaboration',
    description:
      'Work together on Markdown documents in real-time. Your team can edit and see changes instantly, making collaboration simple and seamless.',
    icon: Users,
  },
  {
    title: 'Organized Project Files',
    description: 'Keep your documents structured and easy to access. Your team can create, organize, and navigate files effortlessly.',
    icon: FileText,
  },
  {
    title: 'Invite Team Members',
    description: 'Easily invite colleagues to your project. Collaborate on documents with your team instantly, without complex setup or permissions.',
    icon: UserPlus,
  },
];

export const metadata: Metadata = {
  title: 'Enterprise Collaboration for Teams and Markdown Projects',
  description: 'Scale your team writing workflow with MondreyMD Enterprise. Real-time collaboration, secure syncing, and organized project management.',
};

export default function EnterprisePage() {
  return (
    <div className="text-foreground bg-background h-screen overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />

      <div className="flex flex-col px-6 items-center">
        {/* HERO: Single Column - Bold & Transparent */}
        <section className="relative w-full max-w-280 pt-24 pb-16 text-start">
          <div className="flex flex-col items-start space-y-6 max-w-4xl">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em] font-bold">
              <ShieldCheck className="w-4 h-4" />
              Enterprise Standard
            </div>
            <h1 className="text-[2.75rem] md:text-[5rem] font-black tracking-tighter leading-[0.9]">
              Built for the <br />
              <span className="text-primary">Next Generation</span> of Teams.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
              MondreyMD Enterprise provides the infrastructure for high-velocity teams to document, collaborate, and scale without the friction of
              traditional editors. Ownership of your data starts here.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <BodyPublicLink
                title="Deploy for your Team"
                href="/login"
                Icon={ArrowRight}
                classname="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
              />
            </div>
          </div>
        </section>

        <Separator className="max-w-280" />

        <section className="w-full max-w-280 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 ">
            {teamFeatures.map((feature, idx) => (
              <div key={idx} className="group flex flex-col items-start space-y-5 h-full">
                <div className="p-4 rounded-2xl bg-sidebar border border-border group-hover:border-primary/50 transition-all duration-300 transform group-hover:-translate-y-1">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>

                <div className="flex-1 h-full flex items-end">
                  <Link
                    href="/login"
                    className="group/link text-sm font-bold uppercase tracking-widest text-primary/70 hover:text-primary transition-colors flex items-center gap-2"
                  >
                    Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="max-w-280" />
        {/* CTA SECTION: Enterprise */}
        <section className="w-full max-w-280 py-24">
          <div className="relative bg-sidebar border border-border rounded-[3.5rem] p-10 md:p-20 overflow-hidden flex flex-col items-start text-start gap-8">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10" />

            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              Ready for <span className="text-primary italic">enterprise-grade</span> collaboration?
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Deploy MondreyMD across your organization with structured workflows, controlled access, and scalable Markdown infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <BodyPublicLink
                title="Request Access"
                href="/contact"
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
