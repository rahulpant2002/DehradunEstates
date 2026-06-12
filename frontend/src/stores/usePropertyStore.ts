import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Property, PropertyFilters, Interest } from '../types';

const PAGE_SIZE = 20;
const SELECT = '*, profiles(full_name, phone, email), media:property_media(*)';

// Supabase rows store latitude/longitude; the app uses a { lat, lng } object.
function mapRow(row: any): Property {
  const { latitude, longitude, ...rest } = row;
  return {
    ...rest,
    location: latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null,
  } as Property;
}

export interface NewPropertyInput {
  title: string;
  description?: string | null;
  price: number;
  price_type: Property['price_type'];
  property_type: Property['property_type'];
  address: string;
  city?: string;
  locality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area_sqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnishing?: Property['furnishing'];
  featured?: boolean;
}

interface PropertyState {
  properties: Property[];
  featured: Property[];
  current: Property | null;
  total: number;
  loading: boolean;
  page: number;
  fetchProperties: (filters?: PropertyFilters, page?: number) => Promise<void>;
  fetchFeatured: () => Promise<void>;
  fetchById: (id: string) => Promise<void>;
  createProperty: (data: NewPropertyInput, photoFiles: File[], videoFiles: File[]) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  expressInterest: (propertyId: string, message?: string) => Promise<void>;
  hasMyInterest: (propertyId: string) => Promise<boolean>;
  fetchMyInterests: () => Promise<Property[]>;
  fetchListingInterests: () => Promise<Interest[]>;
  fetchMyListings: () => Promise<Property[]>;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  featured: [],
  current: null,
  total: 0,
  loading: false,
  page: 1,

  fetchProperties: async (filters = {}, page = 1) => {
    set({ loading: true });
    let query = supabase
      .from('properties')
      .select(SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    if (filters.property_type) query = query.eq('property_type', filters.property_type);
    if (filters.price_type) query = query.eq('price_type', filters.price_type);
    if (filters.min_price !== undefined) query = query.gte('price', filters.min_price);
    if (filters.max_price !== undefined) query = query.lte('price', filters.max_price);
    if (filters.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
    if (filters.furnishing) query = query.eq('furnishing', filters.furnishing);
    if (filters.city) query = query.eq('city', filters.city);

    const { data, count, error } = await query;
    if (error) { set({ loading: false }); throw error; }
    set({ properties: (data || []).map(mapRow), total: count || 0, page, loading: false });
  },

  fetchFeatured: async () => {
    const { data } = await supabase
      .from('properties')
      .select(SELECT)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(8);
    set({ featured: (data || []).map(mapRow) });
  },

  fetchById: async (id) => {
    set({ loading: true });
    const { data, error } = await supabase.from('properties').select(SELECT).eq('id', id).maybeSingle();
    if (error) { set({ loading: false }); throw error; }
    set({ current: data ? mapRow(data) : null, loading: false });
  },

  createProperty: async (data, photoFiles, videoFiles) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in to list a property');
    const { latitude, longitude, ...rest } = data;
    const { data: prop, error } = await supabase
      .from('properties')
      .insert({ ...rest, latitude: latitude ?? null, longitude: longitude ?? null, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    const propId = prop.id as string;

    const uploadAll = async (files: File[], type: 'photo' | 'video', sortBase: number) => {
      await Promise.all(files.map(async (file, i) => {
        const ext = file.name.split('.').pop();
        const path = `${propId}/${type}_${Date.now()}_${i}.${ext}`;
        const bucket = `property-${type}s`;
        const { error: ue } = await supabase.storage.from(bucket).upload(path, file);
        if (ue) throw ue;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        const { error: ie } = await supabase.from('property_media').insert({
          property_id: propId, url: publicUrl, storage_path: path, media_type: type, sort_order: sortBase + i,
        });
        if (ie) throw ie;
      }));
    };

    await uploadAll(photoFiles, 'photo', 0);
    await uploadAll(videoFiles, 'video', 100);
    return mapRow(prop);
  },

  deleteProperty: async (id) => {
    // Remove storage objects first (DB rows cascade on property delete).
    const { data: media } = await supabase
      .from('property_media').select('storage_path, media_type').eq('property_id', id);
    if (media?.length) {
      const photos = media.filter((m) => m.media_type === 'photo' && m.storage_path).map((m) => m.storage_path!);
      const videos = media.filter((m) => m.media_type === 'video' && m.storage_path).map((m) => m.storage_path!);
      if (photos.length) await supabase.storage.from('property-photos').remove(photos);
      if (videos.length) await supabase.storage.from('property-videos').remove(videos);
    }
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
    set((s) => ({ properties: s.properties.filter((p) => p.id !== id) }));
  },

  // A buyer clicks "Buy" -> records interest; the seller is notified (sees the
  // interested buyers on their listing). Many buyers can be interested.
  expressInterest: async (propertyId, message) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please sign in to express interest');
    const { error } = await supabase
      .from('property_interests')
      .insert({ property_id: propertyId, user_id: user.id, message: message ?? null });
    if (error) {
      if (error.code === '23505') throw new Error('You have already expressed interest in this property');
      throw error;
    }
  },

  hasMyInterest: async (propertyId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from('property_interests')
      .select('id')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .maybeSingle();
    return !!data;
  },

  // Properties the current user has expressed interest in (buyer view).
  fetchMyInterests: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('property_interests')
      .select('properties(*, profiles(full_name, phone, email), media:property_media(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => mapRow(r.properties)).filter(Boolean);
  },

  // Interests on the current user's own listings (seller view) — includes each
  // interested buyer's contact + the property title.
  fetchListingInterests: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('property_interests')
      .select('id, message, created_at, property_id, profiles:user_id(full_name, phone, email), properties!inner(id, title, created_by)')
      .eq('properties.created_by', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as Interest[];
  },

  fetchMyListings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('properties')
      .select(SELECT)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRow);
  },
}));
