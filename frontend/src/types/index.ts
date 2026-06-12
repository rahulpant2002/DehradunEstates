export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyType = 'apartment' | 'house' | 'villa' | 'plot' | 'commercial';
export type PriceType = 'sale' | 'rent';
export type PropertyStatus = 'available' | 'sold';
export type FurnishingType = 'unfurnished' | 'semi-furnished' | 'fully-furnished';
export type PurchaseStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  price_type: PriceType;
  property_type: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  locality: string | null;
  location: { lat: number; lng: number } | null;
  area_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: FurnishingType | null;
  featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  media?: PropertyMedia[];
  profiles?: Pick<Profile, 'full_name' | 'phone' | 'email'> | null;
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  url: string;
  storage_path?: string | null;
  media_type: 'photo' | 'video';
  sort_order: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  property_id: string;
  buyer_id: string;
  amount: number;
  status: PurchaseStatus;
  created_at: string;
  properties?: Property;
}

export interface Interest {
  id: string;
  property_id: string;
  user_id: string;
  message: string | null;
  created_at: string;
  // the interested buyer's contact (visible to the seller)
  profiles?: Pick<Profile, 'full_name' | 'phone' | 'email'> | null;
  properties?: Property | null;
}

export interface PropertyFilters {
  search?: string;
  property_type?: PropertyType | '';
  price_type?: PriceType | '';
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  furnishing?: FurnishingType | '';
  radius_km?: number;
  lat?: number;
  lng?: number;
  city?: string;
}
