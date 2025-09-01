import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import storeService, { convertToSupermarketFormat } from '../services/store-service';

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
    // If stores are passed as props, use them directly
    if (stores.length > 0) {
      setSupers(stores);
      return;
    }

    // Fetch from backend using store service
    const { request } = storeService.getMapSupermarkets();
    request
      .then((response) => {
        console.log('Fetched supermarkets:', response.data);
        // Convert backend store format to supermarket format
        const supermarkets = convertToSupermarketFormat(response.data);
        // Ensure the data has the correct structure
        const validStores = supermarkets.filter((store) =>
          store.lat && store.lng && !isNaN(store.lat) && !isNaN(store.lng)
        );
        setSupers(validStores);
      })
      .catch((error) => {
        console.error('Error fetching supermarkets:', error);
        // Use default store locations if fetch fails
        const defaultStores: Supermarket[] = [
          { id: "65a4e1e1e1e1e1e1e1e1e1e1", name: "שופרסל", address: "שופרסל, תל אביב", lat: 32.0853, lng: 34.7818 },
          { id: "65a4e1e1e1e1e1e1e1e1e1e2", name: "רמי לוי", address: "רמי לוי, ראשון לציון", lat: 31.9522, lng: 34.7998 },
          { id: "65a4e1e1e1e1e1e1e1e1e1e3", name: "קרפור", address: "קרפור, תל אביב", lat: 32.0836, lng: 34.8004 },
          { id: "65a4e1e1e1e1e1e1e1e1e1e4", name: "סיטי מרקט", address: "סיטי מרקט, תל אביב", lat: 32.0707, lng: 34.8245 },
        ];
        setSupers(defaultStores);
      });
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
