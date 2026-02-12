import { createClient } from '@/utils/supabase/server';

export interface CommunityStats {
  perfumes: number;
  brands: number;
  members: number;
  reviews: number;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const supabase = await createClient();
  
  const [perfumesCount, brandsCount, membersCount, reviewsCount, commentsCount] = await Promise.all([
    supabase.from('perfumes').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
  ]);

  return {
    perfumes: perfumesCount.count || 0,
    brands: brandsCount.count || 0,
    members: membersCount.count || 0,
    reviews: (reviewsCount.count || 0) + (commentsCount.count || 0)
  };
}

export type ActivityType = 'review' | 'comment' | 'collection';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  user_name: string;
  perfume_name: string;
  perfume_slug: string | null;
  perfume_image: string | null;
  brand_name: string;
  content?: string; // For comments/reviews
  rating?: number;  // For reviews
  created_at: string;
}

export interface Contributor {
  id: string;
  name: string;
  avatar_url?: string;
  review_count: number;
  comment_count: number;
  total_activity: number;
  level: {
    name: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
    perk: string;
    nextLevel: number | null;
  };
}

export function getContributorLevel(activityCount: number) {
  if (activityCount >= 100) return { 
    name: 'Legendary', 
    color: 'text-purple-700', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200',
    icon: '👑',
    perk: 'Early Access + Custom Badge',
    nextLevel: null 
  };
  if (activityCount >= 50) return { 
    name: 'Master', 
    color: 'text-amber-700', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200',
    icon: '⭐',
    perk: 'Featured Reviews',
    nextLevel: 100 
  };
  if (activityCount >= 20) return { 
    name: 'Connoisseur', 
    color: 'text-stone-700', 
    bg: 'bg-stone-50', 
    border: 'border-stone-200',
    icon: '💎',
    perk: 'Profile Customization',
    nextLevel: 50 
  };
  if (activityCount >= 10) return { 
    name: 'Enthusiast', 
    color: 'text-stone-600', 
    bg: 'bg-stone-50', 
    border: 'border-stone-100',
    icon: '✨',
    perk: 'Community Badge',
    nextLevel: 20 
  };
  return { 
    name: 'Novice', 
    color: 'text-stone-400', 
    bg: 'bg-stone-50', 
    border: 'border-stone-50',
    icon: '🌱',
    perk: 'Start contributing to level up',
    nextLevel: 10 
  };
}

export async function getTopContributors(limit = 5): Promise<Contributor[]> {
  const supabase = await createClient();
  
  const [reviews, comments] = await Promise.all([
    supabase.from('reviews').select('user_id, profiles(display_name)').limit(100),
    supabase.from('comments').select('user_id, user_name').limit(100)
  ]);

  const stats: Record<string, Contributor> = {};

  reviews.data?.forEach((r: any) => {
    if (!r.user_id) return;
    if (!stats[r.user_id]) {
        stats[r.user_id] = { 
          id: r.user_id, 
          name: r.profiles?.display_name || 'Anonymous', 
          review_count: 0, 
          comment_count: 0, 
          total_activity: 0,
          level: getContributorLevel(0)
        };
    }
    stats[r.user_id].review_count++;
    stats[r.user_id].total_activity++;
    stats[r.user_id].level = getContributorLevel(stats[r.user_id].total_activity);
  });

  comments.data?.forEach((c: any) => {
     if (!c.user_id) return;
     if (!stats[c.user_id]) {
        stats[c.user_id] = { 
          id: c.user_id, 
          name: c.user_name || 'Anonymous', 
          review_count: 0, 
          comment_count: 0, 
          total_activity: 0,
          level: getContributorLevel(0)
        };
     }
     stats[c.user_id].comment_count++;
     stats[c.user_id].total_activity++;
     stats[c.user_id].level = getContributorLevel(stats[c.user_id].total_activity);
  });

  return Object.values(stats)
    .sort((a, b) => b.total_activity - a.total_activity)
    .slice(0, limit);
}

export async function getMostDiscussedPerfumes(limit = 5) {
  const supabase = await createClient();
  
  const { data: comments } = await supabase
    .from('comments')
    .select('perfume_id, perfumes(name, slug, image_url, brands(name))')
    .limit(100);

  const counts: Record<string, { count: number, perfume: any }> = {};

  comments?.forEach((c: any) => {
      if (!c.perfumes) return;
      const pid = c.perfume_id;
      if (!counts[pid]) {
          counts[pid] = { count: 0, perfume: c.perfumes };
      }
      counts[pid].count++;
  });

  return Object.values(counts)
     .sort((a, b) => b.count - a.count)
     .slice(0, limit);
}

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const [reviewsResult, commentsResult] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id,
        rating,
        text_content,
        created_at,
        profiles ( display_name ),
        perfumes (
          name,
          slug,
          image_url,
          brands ( name )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit),
    
    supabase
      .from('comments')
      .select(`
        id,
        content,
        user_name,
        created_at,
        perfumes (
          name,
          slug,
          image_url,
          brands ( name )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
  ]);

  const reviews: ActivityItem[] = (reviewsResult.data || []).map((r: any) => ({
    id: r.id,
    type: 'review',
    user_name: r.profiles?.display_name || 'Anonymous',
    perfume_name: r.perfumes?.name || 'Unknown Perfume',
    perfume_slug: r.perfumes?.slug || null,
    perfume_image: r.perfumes?.image_url || null,
    brand_name: r.perfumes?.brands?.name || 'Unknown Brand',
    content: r.text_content,
    rating: r.rating,
    created_at: r.created_at
  }));

  const comments: ActivityItem[] = (commentsResult.data || []).map((c: any) => ({
    id: c.id,
    type: 'comment',
    user_name: c.user_name || 'Anonymous',
    perfume_name: c.perfumes?.name || 'Unknown Perfume',
    perfume_slug: c.perfumes?.slug || null,
    perfume_image: c.perfumes?.image_url || null,
    brand_name: c.perfumes?.brands?.name || 'Unknown Brand',
    content: c.content,
    created_at: c.created_at
  }));

  const allActivity = [...reviews, ...comments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return allActivity.slice(0, limit);
}

export async function getTrendingPerfumes(limit = 10) {
  const supabase = await createClient();

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_trending_perfumes', { period_days: 30, limit_count: limit });

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image_url: p.image_url,
      rating: p.rating,
      brand: { name: p.brand_name }
    }));
  }

  const { data: recentIds } = await supabase
    .from('comments')
    .select('perfume_id')
    .order('created_at', { ascending: false })
    .limit(50);

  const idCounts: Record<string, number> = {};
  recentIds?.forEach((r: any) => {
    idCounts[r.perfume_id] = (idCounts[r.perfume_id] || 0) + 1;
  });

  const sortedIds = Object.keys(idCounts).sort((a, b) => idCounts[b] - idCounts[a]).slice(0, limit);
  
  let queryIds = sortedIds;
  if (queryIds.length < limit) {
     const { data: popular } = await supabase
       .from('perfumes')
       .select('id')
       .order('rating', { ascending: false })
       .limit(limit);
     
     if (popular) {
        const popularIds = popular.map(p => p.id);
        queryIds = [...new Set([...queryIds, ...popularIds])].slice(0, limit);
     }
  }

  const { data: trending } = await supabase
    .from('perfumes')
    .select(`
      id,
      name,
      slug,
      image_url,
      rating,
      brand:brands ( name )
    `)
    .in('id', queryIds);

  return trending || [];
}

export async function getRandomPerfume() {
  const supabase = await createClient();
  
  // Get total count first to pick a random offset
  const { count } = await supabase
    .from('perfumes')
    .select('*', { count: 'exact', head: true });

  if (!count) return null;
  
  const randomOffset = Math.floor(Math.random() * count);

  const { data } = await supabase
    .from('perfumes')
    .select(`
      id,
      name,
      slug,
      image_url,
      rating,
      brand:brands ( name )
    `)
    .range(randomOffset, randomOffset)
    .single();

  return data;
}