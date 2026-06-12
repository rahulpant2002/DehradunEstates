import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import type { Property } from '../types';
import { formatPrice } from '../lib/utils';
import { DEHRADUN_CENTER } from '../lib/constants';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface PropertyMapProps {
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

export default function PropertyMap({ properties, center = DEHRADUN_CENTER, zoom = 13, height = '400px' }: PropertyMapProps) {
  const markers = properties.filter((p) => p.location);

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((p) => (
          <Marker key={p.id} position={[p.location!.lat, p.location!.lng]}>
            <Popup>
              <Link to={`/property/${p.id}`} className="font-semibold text-primary-600 hover:underline block mb-1">{p.title}</Link>
              <p className="text-sm text-slate-600">{formatPrice(p.price, p.price_type)}</p>
              <p className="text-xs text-slate-500">{p.address}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
