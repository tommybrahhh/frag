import Link from 'next/link';
import Image from 'next/image';
import { Database } from '@/types/database';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];

interface BlogHeroProps {
  posts: BlogPost[];
}

const BlogHero = ({ posts }: BlogHeroProps) => {
  if (!posts || posts.length === 0) {
    return (
       <section className="px-6 max-w-[1400px] mx-auto mb-20 pt-8 text-center text-stone-400 border py-10 rounded-xl">
         No published blog posts found.
       </section>
    );
  }

  return (
    <section className="px-6 max-w-[1400px] mx-auto mb-20 pt-8">
      <div className={`grid grid-cols-1 ${posts.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer block"
          >
             <div className="absolute inset-0 bg-stone-200">
               {post.image_url ? (
                 <Image
                   src={post.image_url}
                   alt={post.title}
                   className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                   width={800}
                   height={600}
                   priority
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400">
                   No Image
                 </div>
               )}
             </div>
             <div
               className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-500"
             />
             <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                {post.excerpt && (
                  <p className="text-stone-300 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-1">
                    {post.excerpt}
                  </p>
                )}
               <h2 className="text-white font-serif text-3xl md:text-4xl lg:text-5xl font-medium tracking-wide leading-tight">
                 {post.title}
               </h2>
             </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BlogHero;