import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

// Utility: generate a consistent color from country name
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return `#${c}`;
};

export default function GlobeComponent() {
  const globeRef = useRef();
  const [countries, setCountries] = useState({ features: [] });

  // Load GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  // Add brighter ambient light
  useEffect(() => {
    if (globeRef.current) {
      const scene = globeRef.current.scene();
      const light = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(light);
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000' }}>
      {countries.features.length > 0 && (
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundColor="#000000"
          polygonsData={countries.features}
          polygonCapColor={({ properties }) => stringToColor(properties.ADMIN)}
          polygonSideColor={() => 'rgba(255, 255, 255, 0.1)'}
          polygonStrokeColor={() => '#111'}
          polygonLabel={({ properties }) => `
            <b>${properties.ADMIN}</b><br />
            ISO: ${properties.ISO_A2}
          `}
          polygonsTransitionDuration={300}
          onPolygonClick={(polygon) => {
            const country = polygon.properties.ADMIN;
            const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(country)}`;
            window.open(url, '_blank'); // open in new tab
          }}
        />
      )}
    </div>
  );
}
