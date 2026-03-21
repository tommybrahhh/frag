'use client';

import Link from 'next/link';
import Image from 'next/image';

interface GridImage {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

const VisualGrid = () => {
  const images: GridImage[] = [
    { src: 'https://plus.unsplash.com/premium_photo-1679064287763-0d05bc80f1a3?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Clean', title: 'Clean', subtitle: 'Fresh & Airy' },
    { src: 'https://images.unsplash.com/photo-1618994492420-b4f4d6b4890c?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Earthy', title: 'Earthy', subtitle: 'Woody & Grounded' },
    { src: 'https://images.unsplash.com/photo-1611146264101-358a3b387eee?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Gourmand', title: 'Gourmand', subtitle: 'Sweet & Indulgent' },
    { src: 'https://plus.unsplash.com/premium_photo-1673823666050-bb56202cc9e4?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', alt: 'Modern', title: 'Modern', subtitle: 'Bold & New' }
  ];

  return (
    <section className="px-6 max-w-[1400px] mx-auto mb-20 pt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <Link
            key={img.alt}
            href={`/search?vibe=${img.title.toLowerCase()}`}
            className="group relative h-[280px] md:h-[350px] rounded-2xl overflow-hidden cursor-pointer w-full block"
            aria-label={`Explore ${img.title} scents: ${img.subtitle}`}
          >
            <div className="absolute inset-0 bg-stone-200">
              <Image
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                width={800}
                height={800}
                quality={85}
                priority
              />
            </div>
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"
              aria-hidden="true"
            />
            <div className="absolute bottom-0 left-0 w-full p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
              <span className="text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                {img.subtitle}
              </span>
              <h3 className="text-white font-serif text-3xl md:text-4xl font-medium tracking-wide">
                {img.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default VisualGrid;
