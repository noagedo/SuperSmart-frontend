// components/SuperMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png',
  shadowSize: [41, 41]
});

export interface Supermarket {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface SuperMapProps {
  stores?: Supermarket[];
  height?: string | number;
}

export default function SuperMap({ 
  stores = [], 
  height = '500px' 
}: SuperMapProps) {
  const [supers, setSupers] = useState<Supermarket[]>(stores);

  useEffect(() => {
    // If stores are provided as props, use them
    if (stores.length > 0) {
      setSupers(stores);
      return;
    }

    // Otherwise fetch from API as fallback
    fetch('/mapSupermarkets')
      .then((res) => res.json())
      .then((data) => setSupers(data));
  }, [stores]);

  return (
    <MapContainer 
      center={[32.0853, 34.7818]} 
      zoom={10} 
      style={{ height: height, width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors'
      />
      {supers.map((supermarket) => (
        <Marker 
          key={supermarket.id} 
          position={[supermarket.lat, supermarket.lng]} 
          icon={icon}
        >
          <Popup>
            <strong>{supermarket.name}</strong><br />
            {supermarket.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
