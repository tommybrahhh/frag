import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, image_url, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle() as any;

  if (!post) {
    return { title: 'Post Not Found | Scentia' };
  }

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on Scentia.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on Scentia.`,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export default async function BlogPostPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = params.slug;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single() as any;

  if (error || !post) {
    console.error('Error fetching blog post:', error);
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.image_url ? [post.image_url] : [],
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: 'Scentia Team', // Dynamic author if available
    },
    description: post.excerpt || `Read ${post.title} on Scentia.`,
  };

  return (
    <article className="min-h-screen bg-white text-stone-800 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Image Section */}
      <div className="relative w-full h-[60vh] md:h-[70vh] flex items-end">
        {post.image_url ? (
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-stone-200 flex items-center justify-center">
            <span className="text-stone-400 font-bold uppercase tracking-widest">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        <div className="relative w-full max-w-4xl mx-auto px-6 pb-12 md:pb-20">
           <Link href="/" className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white mb-8 inline-flex items-center gap-2 transition-colors">
             <span className="text-lg">←</span> Back to Home
           </Link>
           {post.excerpt && (
             <p className="text-stone-300 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-4 drop-shadow-sm">
               {post.excerpt}
             </p>
           )}
           <h1 className="text-white font-serif text-3xl md:text-5xl lg:text-6xl leading-tight mb-8 drop-shadow-md">
             {post.title}
           </h1>
           <div className="flex items-center gap-4 text-white/60 text-[10px] font-bold uppercase tracking-widest">
             <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
             <span className="opacity-30">|</span>
             <span>Admin</span>
           </div>
        </div>
      </div>

      {/* Content Container - More narrow for readability */}
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <div 
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
        
        <hr className="my-12 border-stone-100" />
        
        <div className="text-center">
           <Link href="/" className="inline-block px-8 py-4 border border-stone-200 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-colors">
             Read More Articles
           </Link>
        </div>
      </div>
    </article>
  );
}
