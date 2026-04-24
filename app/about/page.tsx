import Image from 'next/image';
import Link from 'next/link';
import { Github, Linkedin, Facebook, ArrowRight, Briefcase } from 'lucide-react';
import Navbar from '@/components/public-pages/navbar';
import { aboutBoxes } from '@/data/about';
import Footer from '@/components/public-pages/footer';
import BodyPublicLink from '@/components/public-pages/body-public-link';
import { Metadata } from 'next';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'About MondreyMD Collaborative Markdown Platform',
  description:
    'Learn about MondreyMD, a real-time Markdown editor with team collaboration. Discover our mission to simplify writing and productivity for everyone.',
};

export default function AboutPage() {
  return (
    <div className="text-foreground bg-background h-screen overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />

      <div className="flex flex-col px-6 items-center">
        <section className="relative w-full max-w-280 pt-24 pb-16">
          <div className="flex flex-col items-start space-y-6 max-w-4xl">
            <span className="text-primary font-mono text-xs uppercase tracking-[0.3em] font-bold">Our Story</span>
            <h1 className="text-[2.75rem] md:text-[5rem] font-black tracking-tighter leading-[0.9] text-start">
              The Mission behind <br />
              <span className="text-primary">MondreyMD.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-start max-w-3xl">
              We believe documentation shouldn&apos;t be a chore. MondreyMD was built to bridge the gap between personal thought and team execution—giving
              you a workspace that is as fast as your ideas.
            </p>
            <div className="pt-4">
              <BodyPublicLink
                title="Get started"
                href="/login"
                classname="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                Icon={ArrowRight}
              />
            </div>
          </div>
        </section>

        <Separator className="max-w-280" />

        <section className="w-full max-w-280 py-24">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">What Drives Us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Our principles are simple: speed, privacy, and collaboration. We build tools that we use ourselves every single day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {aboutBoxes.map((box, idx) => (
              <div
                key={idx}
                className="group flex flex-col items-start space-y-4 p-8 rounded-3xl bg-sidebar border border-border/50 transition-all hover:border-primary/80"
              >
                <div className="p-3 rounded-xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <box.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">{box.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-start">{box.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Separator className="max-w-280" />

        <section className="w-full max-w-280 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/images/profile.jpg"
                alt="Mondrey - Founder"
                width={500}
                height={500}
                className="relative rounded-[2.5rem] border border-border h-auto w-full max-w-[450px] shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 object-cover"
              />
            </div>

            <div className="flex flex-col items-start space-y-8">
              <div className="space-y-4">
                <h2 className="text-[2.5rem] font-black tracking-tighter leading-none">Hi, I’m Mondrey 👋</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  I&apos;m the solo developer behind this platform. I built MondreyMD because I was tired of choosing between &quot;simple&quot; markdown
                  editors and &quot;collaborative&quot; team tools. I wanted both.
                </p>
                <p className="text-lg text-muted-foreground/80 italic">&quot;No complex setup, no data silos—just pure focus on the content.&quot;</p>
              </div>

              {/* Social Links Standardized */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Github, href: 'https://github.com/e2e2a' },
                  { icon: Linkedin, href: 'https://www.linkedin.com/in/reymond-godoy-5764b935a' },
                  { icon: Facebook, href: 'https://www.facebook.com/reymond.godoy.71' },
                  { icon: Briefcase, href: 'https://portfolio.mondrey.dev' },
                ].map((social, i) => (
                  <Link
                    key={i}
                    href={social.href}
                    target="_blank"
                    className="p-3 rounded-full border border-border bg-sidebar hover:text-primary hover:border-primary transition-all"
                  >
                    <social.icon className="w-5 h-5" />
                  </Link>
                ))}
              </div>

              <div className="text-sm font-mono text-muted-foreground">
                Inquiries:{' '}
                <Link href="mailto:e2e2a@mondrey.dev" className="text-primary hover:underline">
                  e2e2a@mondrey.dev
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Separator className="max-w-280" />

        {/* INVESTORS / FUTURE SECTION: Honest & Direct */}
        <section className="w-full max-w-280 py-24 mb-10">
          <div className="bg-sidebar border border-border rounded-[3rem] p-12 md:p-20 text-start flex flex-col md:flex-row gap-12 items-center justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tighter mb-4">Investment & Growth</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                MondreyMD is currently <span className="font-bold text-foreground">100% self-funded</span>. This allows us to prioritize user experience
                over quarterly profits. We are focused on sustainable growth and long-term partnership.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="px-6 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest">
                🚀 Stage: Fresh Deploy
              </div>
              <Link
                href="mailto:e2e2a@mondrey.dev"
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Partner with us
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
