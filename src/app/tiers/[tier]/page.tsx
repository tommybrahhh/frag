import { createClient } from '@/utils/supabase/server';
import { getPerfumes } from '@/lib/services/perfumeService';
import TierPageClient from '@/components/features/search/TierPageClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ tier: string }>;
}

const TIER_MAP: Record<string, string> = {
  'designer': 'Designer',
  'niche': 'Niche',
  'indie': 'Indie'
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tier } = await params;
  const tierName = TIER_MAP[tier.toLowerCase()];
  
  if (!tierName) return { title: 'Tiers' };

  return {
    title: `${tierName} Fragrances | Scents Discovery`,
    description: `Discover the best ${tierName.toLowerCase()} perfumes. Browse our curated collection of ${tierName.toLowerCase()} fragrances with detailed scent profiles and reviews.`,
  };
}

export default async function TierPage({ params }: Props) {
  const { tier } = await params;
  const tierName = TIER_MAP[tier.toLowerCase()];

  if (!tierName) {
    notFound();
  }

  const { data, error } = await getPerfumes({
    tier: tierName,
    page: 1,
    limit: 20
  });

  if (error) {
    console.error(`Error fetching ${tierName} perfumes:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }

  return (
    <TierPageClient 
      tierName={tierName} 
      initialPerfumes={(data as any[]) || []} 
    />
  );
}

export async function generateStaticParams() {
  return [
    { tier: 'designer' },
    { tier: 'niche' },
    { tier: 'indie' }
  ];
}