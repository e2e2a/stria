import TypingText from '@/components/ui/shadcn-io/typing-text';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/public-pages/navbar';
import Footer from '@/components/public-pages/footer';
import { features } from '@/data/features';
import BodyPublicLink from '@/components/public-pages/body-public-link';
import { Metadata } from 'next';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'MondreyMD Collaborative Markdown Editor for Teams',
  description: 'Create, preview, and collaborate on Markdown documents in real time. MondreyMD simplifies team writing workflow and documentation online.',
};

export default function Home() {
  return (
    <div className="h-screen text-foreground bg-background overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />

      <div className="grid grid-cols-1 px-6 place-items-center flex-col h-auto gap-y-10">
        <section className="relative w-full max-w-280 mx-auto pt-14 sm:pt-14 h-auto lg:h-[780px] flex items-center justify-center">
          <div className="absolute top-1/4 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 blur-[80px] md:blur-[140px] -z-10 animate-pulse" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[85vh] w-full py-12 lg:py-0">
            {/* LEFT SIDE: The Introduction */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 lg:pr-10">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.9] lg:leading-[1.1]">
                  Build Together <br />
                  with <span className="text-primary">MondreyMD</span>
                </h1>

                <div className="h-12 flex items-center justify-center lg:justify-start">
                  <TypingText
                    text={['Write Faster.', 'Preview Instantly.', 'Share Effortlessly.']}
                    className="text-xl md:text-3xl font-medium text-muted-foreground/60 italic"
                    cursorCharacter={<span className="w-0.5 md:w-[3px] h-6 md:h-8 bg-primary inline-block ml-1" />}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                <BodyPublicLink
                  title="Get Started For Free"
                  href="/login"
                  Icon={ArrowRight}
                  classname="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                />
                <Link
                  href="#about"
                  className="group flex items-center gap-2 font-bold text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  The Specs
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE: The Brand Signature (Unified Glow) */}
            <div className="relative flex justify-center lg:justify-end group w-full">
              {/* CARD GLOW */}
              <div className="absolute -inset-4 bg-primary/20 blur-2xl md:blur-[60px] rounded-[2.5rem] md:rounded-[3.5rem] opacity-50 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

              <div className="relative w-full max-w-[500px] lg:max-w-none bg-card p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-border shadow-2xl backdrop-blur-md transform lg:rotate-2 group-hover:rotate-0 transition-all duration-700 ease-in-out before:absolute before:inset-0 before:rounded-[2.5rem] md:before:rounded-[3.5rem] before:p-px before:bg-linear-to-b before:from-primary/50 before:to-transparent before:-z-10">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-red-500/20" />
                    <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full bg-green-500/20" />
                  </div>
                  <span className="text-[8px] md:text-[10px] font-mono text-primary/70 uppercase tracking-widest font-bold">v2.0 // Sovereign-Sync</span>
                </div>

                <div className="relative overflow-hidden rounded-lg md:rounded-xl border border-border">
                  <Image
                    src="/images/editor-v2.png"
                    alt="MondreyMD Editor Preview"
                    className="w-full h-auto brightness-105 contrast-110 transition-transform duration-1000"
                    width={1000}
                    height={600}
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />
                </div>

                {/* Footer Branding */}
                <div className="mt-4 md:mt-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-base md:text-lg font-black tracking-tighter italic">
                      Mondrey<span className="text-primary">MD</span>
                    </p>
                    <p className="text-[8px] md:text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Collaboration Engine</p>
                  </div>
                  <div className="hidden sm:grid grid-cols-4 gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-border group-hover:bg-primary/60 transition-colors duration-500" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Background Accent */}
              <div className="absolute -bottom-10 -right-10 w-24 md:w-32 h-24 md:h-32 opacity-20 pointer-events-none bg-[radial-gradient(var(--primary)_1.5px,transparent_1.5px)] bg-size-[20px_20px]" />
            </div>
          </div>
        </section>
        <Separator className="max-w-280" />

        {/* SECTION 2: THE BRIDGE (The "Why") */}
        <section className="relative py-24 w-full max-w-280 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-snug">Tired of working in isolation?</h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-280 mx-auto">
              MondreyMD bridges the gap between personal note-taking and team collaboration. Write, preview, and share your workspace instantly,
              <span className="text-foreground"> allowing your ideas to grow from a private thought into a collective success.</span>
            </p>
            <div className="pt-4">
              <span className="inline-flex items-center gap-2 text-primary font-mono text-sm tracking-tighter uppercase">
                <span className="w-8 h-px bg-primary/30" />
                MondreyMD
              </span>
            </div>
          </div>
        </section>
        <Separator className="max-w-280" />

        <section id="features" className="w-full max-w-280 py-24 mx-auto border-b">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            {/* Left Side: Content Stack */}
            <div className="flex flex-col gap-12">
              {[
                {
                  title: 'Your Ideas, Synchronized.',
                  desc: 'MondreyMD stores your work locally but syncs globally. Collaborate in real-time without giving up ownership.',
                },
                {
                  title: 'Built for Collective Intelligence.',
                  desc: "A powerful plugin ecosystem and multi-user support to fit your team's unique engineering culture.",
                },
                {
                  title: 'Success is Portable.',
                  desc: "Open-standard Markdown. Your team's knowledge base isn't a walled garden—it's a portable asset.",
                },
              ].map((item, i) => (
                <div key={i} className="group relative pl-8 border-l-2 border-transparent hover:border-primary transition-all duration-500">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-sidebar border-2 border-border group-hover:border-primary transition-colors" />
                  <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{item.desc}</p>
                  <Separator />
                </div>
              ))}
            </div>

            {/* Right Side: Visual Element */}
            <div className="sticky top-24 flex justify-center lg:justify-end">
              <div className="relative group">
                {/* Dynamic Background Glow */}
                <div className="absolute -inset-10 bg-primary/5 blur-[60px] rounded-full group-hover:bg-primary/10 transition-all duration-1000" />

                <div className="relative bg-card p-10 md:p-14 rounded-[3.5rem] border border-border shadow-2xl backdrop-blur-sm">
                  <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter shadow-lg transform rotate-6 group-hover:rotate-0 transition-transform duration-500">
                    Free to Start
                  </div>

                  <div className="relative w-40 h-40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-border/50 transform -rotate-3 group-hover:rotate-0 transition-transform duration-700 ease-out bg-sidebar">
                    <Image
                      src="/images/logo-v1.png"
                      alt="MondreyMD Core"
                      className="w-full h-full object-cover brightness-110 contrast-125 scale-110 group-hover:scale-100 transition-transform duration-700"
                      width={400}
                      height={400}
                      priority
                    />

                    {/* Glassmorphism Overlay on the image bottom */}
                    <div className="absolute bottom-0 inset-x-0 h-1/3 bg-linear-to-t from-black/60 to-transparent flex items-end p-4">
                      <span className="text-white/80 font-mono text-[10px] tracking-widest uppercase">v2.0 // Local-First</span>
                    </div>
                  </div>

                  <div className="mt-8 text-center space-y-1">
                    <p className="text-2xl font-black tracking-tighter text-foreground italic">
                      Mondrey<span className="text-primary">MD</span>
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Engineered for Teams</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 rounded-3xl flex flex-col items-center">
          <div className="max-w-4xl w-full mb-12">
            <h2 className="text-[2.75rem] leading-[1.1] tracking-[-0.02em] text-balance sm:text-[3.75rem] sm:leading-none">Features</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              MondreyMD bridges the gap between individual creativity and collective success. No silos, no limits—just pure collaborative momentum.
            </p>
          </div>
          <div className="grid grid-cols-1 max-w-280 md:grid-cols-2 gap-12 px-6 ">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group border border-transparent hover:border-primary/80 p-8 rounded-2xl bg-sidebar transition-all duration-300"
                >
                  <div className="flex flex-col items-start text-center">
                    <div className="p-3 rounded-xl bg-primary/20 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="text-2xl! sm:text-4xl! font-bold mb-3 tracking-tight text-foreground">{feature.title}</h3>
                    <p className="md:text-xl text-muted-foreground leading-relaxed max-w-prose text-start">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {/* CTA SECTION: Homepage */}
        <section className="w-full max-w-280 py-24">
          <div className="relative bg-sidebar border border-border rounded-[3.5rem] p-10 md:p-20 overflow-hidden flex flex-col items-start text-start gap-8">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10" />

            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              Start building your <span className="text-primary italic">shared knowledge</span> today.
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Write in Markdown. Collaborate in real time. Own your workflow from first draft to final publish.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <BodyPublicLink
                title="Create Your Workspace"
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
