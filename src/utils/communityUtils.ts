export function getContributorLevel(activityCount: number) {
  if (activityCount >= 100) return { 
    name: 'Legendary', 
    color: 'text-stone-900', 
    bg: 'bg-stone-100', 
    border: 'border-stone-300',
    icon: 'Elite',
    perk: 'Early Access + Custom Badge',
    nextLevel: null 
  };
  if (activityCount >= 50) return { 
    name: 'Master', 
    color: 'text-stone-800', 
    bg: 'bg-stone-100', 
    border: 'border-stone-200',
    icon: 'Gold',
    perk: 'Featured Reviews',
    nextLevel: 100 
  };
  if (activityCount >= 20) return { 
    name: 'Connoisseur', 
    color: 'text-stone-700', 
    bg: 'bg-stone-50', 
    border: 'border-stone-200',
    icon: 'Pro',
    perk: 'Profile Customization',
    nextLevel: 50 
  };
  if (activityCount >= 10) return { 
    name: 'Enthusiast', 
    color: 'text-stone-600', 
    bg: 'bg-stone-50', 
    border: 'border-stone-100',
    icon: 'Plus',
    perk: 'Community Badge',
    nextLevel: 20 
  };
  return { 
    name: 'Novice', 
    color: 'text-stone-400', 
    bg: 'bg-stone-50', 
    border: 'border-stone-50',
    icon: 'New',
    perk: 'Start contributing to level up',
    nextLevel: 10 
  };
}
