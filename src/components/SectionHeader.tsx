'use client';

import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  linkText?: string;
  linkHref?: string;
}

const SectionHeader = ({ title, linkText = "View All", linkHref = "#" }: SectionHeaderProps) => {
  return (
    <div className="flex justify-between items-end mb-8 px-6 max-w-[1400px] mx-auto w-full">
      <h3 className="font-serif text-3xl text-stone-900">{title}</h3>
      <Link href={linkHref} className="text-[10px] font-bold tracking-widest text-stone-400 uppercase hover:text-stone-900 transition-colors">
        {linkText}
      </Link>
    </div>
  );
};

export default SectionHeader;