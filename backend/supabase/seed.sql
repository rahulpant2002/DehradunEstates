-- =============================================================================
-- seed.sql  —  Sample properties + media (safe to run multiple times).
-- created_by is left NULL (no auth user required to seed).
-- Photos use the public Pexels CDN; one listing includes a sample video.
-- =============================================================================

-- Backfill profiles for any users who signed up before the schema rebuild,
-- so their existing logins keep working.
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

insert into properties
  (id, title, description, price, price_type, property_type, status, address, city, locality,
   latitude, longitude, area_sqft, bedrooms, bathrooms, furnishing, featured)
values
  ('11111111-1111-1111-1111-111111111101',
   '3BHK Apartment on Rajpur Road',
   'Spacious 3BHK with modern interiors, modular kitchen and a large balcony overlooking the hills.',
   8500000, 'sale', 'apartment', 'available', '12, Rajpur Road', 'Dehradun', 'Rajpur Road',
   30.3489, 78.0712, 1450, 3, 2, 'semi-furnished', true),

  ('11111111-1111-1111-1111-111111111102',
   'Luxury Villa in Vasant Vihar',
   'Independent 4BHK villa with a private lawn, car porch and a rooftop terrace in a gated colony.',
   21500000, 'sale', 'villa', 'available', '47, Block B, Vasant Vihar', 'Dehradun', 'Vasant Vihar',
   30.3256, 78.0008, 3200, 4, 4, 'fully-furnished', true),

  ('11111111-1111-1111-1111-111111111103',
   'Cozy 2BHK for Rent in Dalanwala',
   'Well-maintained 2BHK on a quiet residential lane, close to the market, hospitals and Gandhi Park.',
   22000, 'rent', 'apartment', 'available', '8, EC Road, Dalanwala', 'Dehradun', 'Dalanwala',
   30.3142, 78.0489, 980, 2, 2, 'semi-furnished', true),

  ('11111111-1111-1111-1111-111111111104',
   'Independent House near Sahastradhara Road',
   'Double-storey house with 3 bedrooms, a pooja room and ample parking; great connectivity to the IT park.',
   12500000, 'sale', 'house', 'available', '21, Kulhan, Sahastradhara Road', 'Dehradun', 'Sahastradhara Road',
   30.3617, 78.0846, 2100, 3, 3, 'unfurnished', true),

  ('11111111-1111-1111-1111-111111111105',
   'Residential Plot in Jakhan',
   'East-facing residential plot with clear title and approved layout. Great investment near Rajpur Road.',
   6500000, 'sale', 'plot', 'available', 'Plot 14, Jakhan', 'Dehradun', 'Jakhan',
   30.3556, 78.0689, 2000, null, null, null, false),

  ('11111111-1111-1111-1111-111111111106',
   '4BHK Bungalow on Mussoorie Road',
   'Elegant hillside bungalow with panoramic valley views, landscaped garden and a fireplace.',
   32000000, 'sale', 'villa', 'available', '9, Hathipaon, Mussoorie Road', 'Dehradun', 'Mussoorie Road',
   30.3897, 78.0567, 4100, 4, 5, 'fully-furnished', true)
on conflict (id) do nothing;

insert into property_media (property_id, url, media_type, sort_order)
values
  ('11111111-1111-1111-1111-111111111101', 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111101', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),
  ('11111111-1111-1111-1111-111111111101', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'video', 100),

  ('11111111-1111-1111-1111-111111111102', 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111102', 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),
  ('11111111-1111-1111-1111-111111111102', 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 2),

  ('11111111-1111-1111-1111-111111111103', 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111103', 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),

  ('11111111-1111-1111-1111-111111111104', 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111104', 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),
  ('11111111-1111-1111-1111-111111111104', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'video', 100),

  ('11111111-1111-1111-1111-111111111105', 'https://images.pexels.com/photos/164516/pexels-photo-164516.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111105', 'https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),

  ('11111111-1111-1111-1111-111111111106', 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111106', 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1)
on conflict do nothing;
