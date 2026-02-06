
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Terreiro } from '../../types';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView: React.FC = () => {
  const [terreiros, setTerreiros] = useState<Terreiro[]>([]);
  const [selected, setSelected] = useState<Terreiro | null>(null);

  useEffect(() => {
    fetchTerreiros();
  }, []);

  const fetchTerreiros = async () => {
    const { data } = await supabase
      .from('terreiros')
      .select('*')
      .eq('verification_status', 'verified')
      .eq('is_visible', true);

    if (data) {
      // Fallback lat/lng if missing
      const validData = data.map(t => ({
        ...t,
        latitude: t.latitude || -14.2350,
        longitude: t.longitude || -51.9253
      }));
      setTerreiros(validData as Terreiro[]);
    }
  };

  return (
    <div className="flex flex-1 h-screen overflow-hidden relative">
      <MapContainer center={[-14.2350, -51.9253]} zoom={4} scrollWheelZoom={true} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {terreiros.map(t => (
          <Marker
            key={t.id}
            position={[t.latitude || 0, t.longitude || 0]}
            eventHandlers={{
              click: () => setSelected(t),
            }}
          >
          </Marker>
        ))}
      </MapContainer>

      {/* Selected Info Popup Drawer */}
      {selected && (
        <div className="absolute top-4 right-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl overflow-y-auto z-[1000] border animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${selected.image || 'https://via.placeholder.com/400x200?text=Terreiro'})` }}>
            <button onClick={() => setSelected(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><span className="material-symbols-outlined">close</span></button>
            <div className="absolute bottom-4 left-4 bg-primary text-white px-3 py-1 text-xs font-bold rounded shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span> Selo Oficial
            </div>
          </div>
          <div className="p-6 flex-1">
            <h2 className="text-2xl font-bold text-text-main mb-1">{selected.name}</h2>
            <p className="text-sm text-text-secondary flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-[16px]">location_on</span> {selected.address}, {selected.city}
            </p>

            <hr className="my-4 border-gray-100" />

            <h3 className="font-bold text-sm text-text-main mb-2">Sobre a Casa</h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">{selected.description || 'Descrição não informada.'}</p>

            <div className="space-y-3">
              {selected.contact_whatsapp && (
                <a href={`https://wa.me/${selected.contact_whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors">
                  <span className="material-symbols-outlined">chat</span> Falar no WhatsApp
                </a>
              )}
              {selected.contact_email && (
                <a href={`mailto:${selected.contact_email}`} className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  <span className="material-symbols-outlined">mail</span> Enviar E-mail
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Link to="/" className="absolute top-4 left-4 p-3 bg-white rounded-lg shadow-xl border flex items-center gap-2 font-bold text-sm text-text-main hover:bg-gray-50 z-[1000]">
        <span className="material-symbols-outlined">arrow_back</span> Voltar
      </Link>
    </div>
  );
};

export default MapView;