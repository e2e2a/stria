import Navbar from '@/components/public-pages/navbar';
import Footer from '@/components/public-pages/footer';
import { ArrowRight, Zap } from 'lucide-react';
import { features } from '@/data/features';
import BodyPublicLink from '@/components/public-pages/body-public-link';
import { Metadata } from 'next';
import CarouselSection from './components/carousel-section';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Markdown Solutions for Teams and Collaborative Projects',
  description:
    'Explore solutions to streamline team collaboration and documentation. Write, preview, and manage Markdown projects efficiently in real time.',
};

export default function SolutionsPage() {
  return (
    <div className="h-screen text-foreground bg-background overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />

      <div className="flex flex-col px-6 items-center">
        {/* HERO: Clean & SEO Optimized */}
        <section className="relative w-full max-w-280 pt-24 pb-16">
          <div className="flex flex-col items-start space-y-6 max-w-4xl">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em] font-bold">
              <Zap className="w-4 h-4" />
              Workflow Optimization
            </div>
            <h1 className="text-[2.75rem] md:text-[4.5rem] font-black tracking-tighter leading-[0.9] text-start">
              Accelerate your <br />
              <span className="text-primary">Markdown Workflow.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-start max-w-3xl">
              Mondrey helps teams and individuals streamline their writing, stay organized, and collaborate effectively. Everything you need for modern
              documentation, delivered in a seamless, high-performance platform.
            </p>
            <div className="pt-4">
              <BodyPublicLink
                title="Get Started For Free"
                href="/login"
                classname="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                Icon={ArrowRight}
              />
            </div>
          </div>
        </section>

        <Separator className="max-w-280" />

        {/* SOLUTIONS GRID: 2-Column Professional Layout */}
        <section className="w-full max-w-280 py-24">
          <div className="mb-16 text-start">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">Why Teams Choose Mondrey</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Empower your collective intelligence with a modern workspace built for clarity, speed, and engineering-grade teamwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {features.map((feature, idx) => (
              <div key={idx} className="group flex flex-col md:flex-row items-start gap-6">
                <div className="shrink-0 p-4 rounded-2xl bg-sidebar border border-border group-hover:border-primary/50 transition-all shadow-sm">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="max-w-280" />

        <section className="w-full max-w-280 py-24">
          <div className="relative bg-sidebar border border-border rounded-[3.5rem] p-10 md:p-20 overflow-hidden flex flex-col items-start text-start gap-8">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10" />

            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              Bring <span className="text-primary italic">Clarity and Speed</span> to Your Next Project.
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Skip the setup and the manual syncing. Mondrey handles the infrastructure so you can focus on the writing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <BodyPublicLink title="Start Now" href="/login" classname="h-12 px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" />
            </div>
          </div>
        </section>

        {/* Carousel Section stays at the bottom to maintain engagement */}
        <section className="w-full py-12">
          <CarouselSection />
        </section>
      </div>
      <Footer />
    </div>
  );
}
