
export interface Note {
  id: string;
  name: string;
}

export interface Perfume {
  id: string;
  name: string;
  slug?: string | null;
  brand: string;
  image_url?: string;
}
