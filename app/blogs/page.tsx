import Navbar from '@/components/public-pages/navbar';
import Footer from '@/components/public-pages/footer';
import {
  // ArrowRight,
  BookOpenText,
  //  CalendarDays
} from 'lucide-react';
import BodyPublicLink from '@/components/public-pages/body-public-link';
import { Metadata } from 'next';
import { Separator } from '@/components/ui/separator';
// import Link from 'next/link';
// import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Blog | Insights & Updates from MondreyMD',
  description:
    'Stay updated with the latest features, tips, and insights on real-time Markdown collaboration, productivity, and documentation best practices.',
};

// const blogPosts = [
// {
//   slug: 'mastering-markdown-productivity',
//   title: 'Mastering Markdown: Boost Your Productivity',
//   date: '2023-10-26',
//   excerpt: 'Discover advanced Markdown techniques that will supercharge your writing workflow and help you create stunning documents faster.',
//   image: '/images/blog/markdown-productivity.jpg',
//   category: 'Productivity',
// },
// {
//   slug: 'real-time-collaboration-tips',
//   title: 'Real-time Collaboration: Tips for Distributed Teams',
//   date: '2023-10-20',
//   excerpt: 'Learn how to leverage real-time editing features for seamless teamwork, even when your team is spread across the globe.',
//   image: '/images/blog/collaboration-tips.jpg',
//   category: 'Collaboration',
// },
// {
//   slug: 'the-future-of-documentation',
//   title: 'The Future of Documentation: Beyond Static Files',
//   date: '2023-10-15',
//   excerpt: 'Explore how dynamic, collaborative platforms are changing the way teams create, manage, and share their critical documentation.',
//   image: '/images/blog/future-documentation.jpg',
//   category: 'Insights',
// },
// {
//   slug: 'getting-started-with-mondreymd',
//   title: 'Getting Started: Your First Document in MondreyMD',
//   date: '2023-10-10',
//   excerpt: 'A comprehensive guide for new users to quickly set up their workspace and create their first collaborative Markdown document.',
//   image: '/images/blog/getting-started.jpg',
//   category: 'Tutorials',
// },
// ];

export default function BlogPage() {
  return (
    <div className="text-foreground bg-background h-screen overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />

      <div className="flex flex-col px-6 items-center">
        <section className="relative w-full max-w-280 pt-24 pb-16">
          <div className="flex flex-col items-start space-y-6 max-w-4xl">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em] font-bold">
              <BookOpenText className="w-4 h-4" />
              Our Insights
            </div>
            <h1 className="text-[2.75rem] md:text-[5rem] font-black tracking-tighter leading-[0.9] text-start">
              The <span className="text-primary text-balance">MondreyMD</span> <br />
              Blog.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-start max-w-3xl">
              Stay updated with the latest features, tips, and insights on real-time Markdown collaboration, productivity, and documentation best practices
              directly from the MondreyMD team.
            </p>
          </div>
        </section>

        <Separator className="max-w-280" />

        {/* BLOG POST GRID */}
        <section className="w-full max-w-280 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* {blogPosts.length > 0 &&
              blogPosts?.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-4xl bg-sidebar border border-border overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-linear-to-t from-background/50 to-transparent" />
                  </div>
                  <div className="p-6 flex flex-col space-y-4 grow">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-wider ml-auto">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-muted-foreground text-base line-clamp-3">{post.excerpt}</p>
                  </div>
                  <div className="px-6 pb-6 pt-0">
                    <span className="inline-flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                      Read Post <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))} */}
          </div>
          {/* Simple Pagination Placeholder */}
          {/* {blogPosts.length > 0 ? (
            <div className="mt-20 flex justify-center">
              <Link href="#" className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all">
                Load More Posts
              </Link>
            </div>
          ) : (
            <div className="text-center"> NO POSTS YET.</div>
          )} */}
          <div className="text-center"> NO POSTS YET.</div>
        </section>

        <Separator className="max-w-280" />

        {/* CTA Section (can be reused from other pages or customized) */}
        <section className="w-full max-w-280 py-24">
          <div className="relative bg-sidebar border border-border rounded-[3.5rem] p-10 md:p-20 overflow-hidden flex flex-col items-start text-start gap-8">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
              Ready to <span className="text-primary italic text-balance">start writing?</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Join the MondreyMD community and experience truly collaborative Markdown.
            </p>
            <BodyPublicLink
              title="Get Started For Free"
              href="/login"
              classname="h-12 px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            />
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
