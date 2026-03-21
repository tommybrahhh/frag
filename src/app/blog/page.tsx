import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import BlogHero from '@/components/features/blog/BlogHero';


export const metadata: Metadata = {
  title: 'Blog | Scentia',
  description: 'Explore the world of fragrances, reviews, and guides on Scentia.',
};

export default async function BlogIndexPage() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, image_url, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false }) as any;

  if (error) {
    console.error('Error fetching blog posts:', error);
  }

  const featuredPosts = posts?.slice(0, 2) || [];
  const otherPosts = posts?.slice(2) || [];

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Hero Header */}
      <section className="pt-16 pb-12 md:pt-24 md:pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-stone-400 mb-4 block">
            The Journal
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-stone-900 mb-6">
            Stories of <span className="italic text-stone-400">Scent.</span>
          </h1>
          <p className="text-stone-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed font-light">
            Insights, history, and expert guides from the curated world of niche and designer fragrances.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <BlogHero posts={featuredPosts} />
      )}

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        {otherPosts.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-12">
               <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-900">Latest Articles</h2>
               <div className="h-px flex-1 bg-stone-100" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-x-8 md:gap-y-16">
              {otherPosts.map((post: any) => (
                <Link 
                  key={post.id} 
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col h-full"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 mb-6 rounded-sm">
                    {post.image_url ? (
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                         <span className="text-stone-300 font-serif italic text-sm">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                  </div>
                  
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="w-8 h-px bg-stone-200" />
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-serif text-stone-900 mb-4 group-hover:text-stone-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    
                    {post.excerpt && (
                      <p className="text-stone-500 text-sm leading-relaxed font-light line-clamp-3 mb-6">
                        {post.excerpt}
                      </p>
                    )}
                    
                    <div className="mt-auto">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900 border-b border-stone-200 pb-1 group-hover:border-stone-900 transition-colors">
                        Read Article
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          !featuredPosts.length && (
            <div className="text-center py-20 border-y border-stone-100">
              <p className="text-stone-400 font-serif italic text-xl">
                Our journal is currently being curated. Check back soon.
              </p>
            </div>
          )
        )}
      </section>
    </main>
  );
}
