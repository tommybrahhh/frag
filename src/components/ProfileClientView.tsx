'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database } from '@/types/database';

type ProfilePageProps = {
  userEmail: string;
  initialCollection: Tables<'user_collections'>[] & { perfume: Tables<'perfumes'> & { brand: Tables<'brands'> } }[];
};

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];


export default function ProfileClientView({ userEmail, initialCollection }: ProfilePageProps) {
  const { user, supabase, loading: authLoading } = useAuth(); // Still need useAuth for logout/session mgmt
  const router = useRouter();
  const [collection, setCollection] = useState(initialCollection); // Initialize with server-fetched data

  // Function to refetch collection if needed (e.g., after user action)
  const refetchCollection = async () => {
    if (!user) return; // Should not happen if page is server-protected

    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select(`
            perfume:perfumes (
              id,
              name,
              image_url,
              brand:brands (name)
            )
          `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const formatted = data?.map((item: any) => item.perfume) || [];
      setCollection(formatted);
    } catch (err) {
      console.error('Error refetching collection:', err);
    }
  };


  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans pb-20">
      
      {/* Header Section */}
      <div className="bg-white border-b border-stone-200 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Member Profile</span>
          <h1 className="text-4xl font-serif text-stone-900 mt-2 mb-2">My Wardrobe</h1>
          <p className="text-stone-500">{userEmail}</p>
        </div>
      </div>

      {/* Collection Grid */}
      <div className="max-w-6xl mx-auto px-6 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl text-stone-900">Saved Collection</h2>
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{collection.length} Bottles</span>
        </div>

        {collection.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collection.map((perfume) => (
              <Link 
                key={perfume.id} 
                href={`/perfume/${perfume.id}`}
                className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-48 flex items-center justify-center p-4 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors">
                  {perfume.image_url ? (
                    <img src={perfume.image_url} alt={perfume.name} className="h-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-stone-300 text-xs italic">No Image</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
                    {perfume.brand?.name}
                  </div>
                  <div className="font-serif text-lg text-stone-900 leading-tight truncate">
                    {perfume.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
            <h3 className="font-serif text-xl text-stone-400 mb-4">Your shelf is empty</h3>
            <p className="text-stone-500 mb-6 max-w-md mx-auto">Start exploring scents and save your favorites to build your digital wardrobe.</p>
            <Link href="/" className="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-700 transition">
              Explore Perfumes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}