import Navbar from '@/components/public-pages/navbar';
import Footer from '@/components/public-pages/footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact MondreyMD',
  description: 'Get in touch with MondreyMD. Ask questions, request a demo, or partner with us for collaborative Markdown solutions.',
};

export default function ContactPage() {
  return (
    <div className="text-foreground bg-background h-screen overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />

      <div className="flex flex-col px-6 items-center gap-20">
        {/* HERO CONTACT HEADER */}
        <section className="w-full max-w-280 pt-34 text-center flex flex-col items-center gap-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            Let’s Talk <span className="text-primary">Markdown Collaboration</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Have questions, feedback, or partnership ideas? Reach out and our team will get back to you promptly.
          </p>
        </section>

        {/* CONTACT FORM CARD */}
        <section className="w-full max-w-280 py-12">
          <div className="relative bg-sidebar border border-border rounded-[3.5rem] p-10 md:p-20 overflow-hidden flex flex-col gap-8">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10" />

            <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Send us a message</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Whether it’s a question, feedback, or partnership request, we’re here to help. Fill in the form below and we’ll get back to you shortly.
            </p>

            <form className="flex flex-col gap-6 w-full">
              <input
                type="text"
                placeholder="Your Name"
                className="bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                placeholder="Your Message"
                rows={5}
                className="bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="h-12 px-10 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all">
                Send Message
              </button>
            </form>
          </div>
        </section>

        {/* SIMPLE CONTACT INFO */}
        <section className="w-full max-w-280 flex flex-col pb-24 md:flex-row gap-12 justify-between text-start">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold">Email</h3>
            <p className="text-muted-foreground">support@mondrey.dev</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold">Partnerships</h3>
            <p className="text-muted-foreground">partner@mondrey.dev</p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold">Address</h3>
            <p className="text-muted-foreground">Remote-first, Global Team</p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
