import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '24px'
};

const center = {
  lat: 30.0444, // Cairo
  lng: 31.2357
};

interface Props {
    lat?: number;
    lng?: number;
    isEditable?: boolean;
    onLocationSelect?: (lat: number, lng: number) => void;
    markers?: { lat: number, lng: number, title?: string }[];
}

const GoogleMapComponent: React.FC<Props> = ({ lat, lng, isEditable, onLocationSelect, markers }) => {
  // 🔴 NOTE: Replace with real API Key or use env variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const [currentMarker, setCurrentMarker] = useState(lat && lng ? { lat, lng } : null);

  const onClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (isEditable && e.latLng && onLocationSelect) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setCurrentMarker({ lat: newLat, lng: newLng });
      onLocationSelect(newLat, newLng);
    }
  }, [isEditable, onLocationSelect]);

  return isLoaded ? (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={lat && lng ? { lat, lng } : center}
        zoom={13}
        onClick={onClick}
        options={{
            styles: darkMapStyle,
            disableDefaultUI: false,
        }}
      >
        {/* Single Marker (Selection/Single View) */}
        {currentMarker && !markers && (
          <Marker position={currentMarker} />
        )}

        {/* Multiple Markers (Sales Team View) */}
        {markers?.map((m, i) => (
            <Marker key={i} position={{ lat: m.lat, lng: m.lng }} title={m.title} />
        ))}
      </GoogleMap>
  ) : <div className="w-full h-[400px] bg-white/5 animate-pulse rounded-3xl flex items-center justify-center text-white/20">جاري تحميل الخريطة...</div>;
};

// Sleek Dark Theme for O2OEG Design
const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ color: "#757575" }],
    },
    {
      featureType: "administrative.country",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.fill",
      stylers: [{ color: "#2c2c2c" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#000000" }],
    },
];

export default React.memo(GoogleMapComponent);
