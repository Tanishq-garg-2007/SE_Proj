import React, { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { countryRoutes } from './App';

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return `#${c}`;
};

// Enhanced color palette
const enhancedColors = [
  '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
  '#6c5ce7', '#a29bfe', '#00d2d3', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#1dd1a1', '#feca57'
];

// Function to get the centroid of a country polygon
const getCentroid = (coordinates) => {
  if (!coordinates || !coordinates[0]) return [0, 0];
  
  let coords = coordinates;
  if (Array.isArray(coords)) {
    coords = coords; // Take the first polygon if it's a MultiPolygon
  }
  
  let totalLat = 0;
  let totalLng = 0;
  let count = 0;
  
  coords.forEach(coord => {
    if (coord && coord.length >= 2) {
      totalLng += coord[0];
      totalLat += coord[1];
      count++;
    }
  });
  
  return count > 0 ? [totalLng / count, totalLat / count] : [0, 0];
};

// Check if country is available in routes
const isCountryAvailable = (countryName) => {
  return !!countryRoutes[countryName] || 
         (["United States", "USA", "US"].includes(countryName) && !!countryRoutes["United States of America"]);
};

export default function GlobeComponent() {
  const globeRef = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [countryPoints, setCountryPoints] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(data => {
        console.log('Data loaded:', data.features.length, 'countries');
        setCountries(data);
        
        const points = data.features.map((country, index) => {
          const centroid = getCentroid(country.geometry.coordinates);
          const colorIndex = index % enhancedColors.length;
          const isAvailable = isCountryAvailable(country.properties.name);
          
          return {
            id: index,
            lat: centroid[1],
            lng: centroid,
            name: country.properties.name,
            size: Math.random() * 0.7 + 0.5,
            color: enhancedColors[colorIndex],
            hasRoute: isAvailable
          };
        }).filter(point => point.lat !== 0 || point.lng !== 0);
        
        console.log('Points created:', points.length);
        setCountryPoints(points);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load GeoJSON:', err);
        setCountries({ features: [] });
        setCountryPoints([]);
        setIsLoading(false);
      });
  }, []);

  // Enhanced lighting setup
  useEffect(() => {
    if (globeRef.current && globeRef.current.scene) {
      const scene = globeRef.current.scene();
      
      // Clear existing lights
      scene.children = scene.children.filter(child => 
        child.type !== 'AmbientLight' && 
        child.type !== 'DirectionalLight' && 
        child.type !== 'PointLight'
      );
      
      // Enhanced lighting
      const ambLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambLight);
      
      const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight1.position.set(-1, 0.5, 1);
      scene.add(dirLight1);
      
      const dirLight2 = new THREE.DirectionalLight(0x4ecdc4, 0.3);
      dirLight2.position.set(1, 0.5, -1);
      scene.add(dirLight2);
    }
  }, []);

  // Enhanced click handler
  const handleCountryClick = useCallback((country) => {
    if (!country?.properties?.name) return;
    
    let countryName = country.properties.name;
    
    if (countryName === "United States" || countryName === "USA" || countryName === "US") {
      countryName = "United States of America";
    }
    
    console.log('Clicked country:', countryName);
    
    if (countryRoutes[countryName]) {
      navigate(`/${countryName.toLowerCase().replace(/\s+/g, '-')}`);
    } else {
      window.open(`https://en.wikipedia.org/wiki/${countryName}`, "_blank");
    }
  }, [navigate]);

  const handlePointClick = useCallback((point) => {
    if (!point?.name) return;
    
    let countryName = point.name;
    
    if (countryName === "United States" || countryName === "USA" || countryName === "US") {
      countryName = "United States of America";
    }
    
    console.log('Clicked point:', countryName);
    
    if (countryRoutes[countryName]) {
      navigate(`/${countryName.toLowerCase().replace(/\s+/g, '-')}`);
    } else {
      window.open(`https://en.wikipedia.org/wiki/${countryName}`, "_blank");
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #000011 0%, #001122 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(255,0,0,0.3)',
          borderTop: '3px solid #ff0000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#ff0000', marginTop: '20px', fontSize: '18px' }}>Loading Earth...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #000011 0%, #001122 100%)', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Available Countries Legend */}
      <div style={{
        position: 'absolute',
        top: '30px',
        right: '30px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        padding: '20px',
        borderRadius: '15px',
        border: '2px solid rgba(255,0,0,0.5)',
        backdropFilter: 'blur(10px)'
      }}>
        <h4 style={{ color: '#ff0000', margin: '0 0 15px 0', fontSize: '16px' }}>🎯 Available Destinations</h4>
        {Object.keys(countryRoutes).map((country) => (
          <div key={country} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ff0000',
              boxShadow: '0 0 10px #ff000050'
            }}></div>
            <span style={{ color: 'white' }}>{country}</span>
          </div>
        ))}
      </div>

      {/* Country Info Display */}
      {hoveredCountry && (
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '30px',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.9)',
          padding: '20px',
          borderRadius: '15px',
          color: 'white',
          border: `2px solid ${hoveredCountry.hasRoute ? '#ff0000' : '#4ecdc4'}`,
          backdropFilter: 'blur(10px)',
          maxWidth: '300px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: hoveredCountry.hasRoute ? '#ff0000' : '#4ecdc4' }}>
            {hoveredCountry.hasRoute ? '🎯' : '🔗'} {hoveredCountry.name}
          </h3>
          <p style={{ margin: '5px 0', fontSize: '14px', opacity: 0.8 }}>
            {hoveredCountry.hasRoute ? '✅ Available for detailed exploration' : '🔗 Opens Wikipedia for information'}
          </p>
        </div>
      )}

      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Enhanced polygons with RED boundaries for available countries
        polygonsData={countries.features}
        polygonCapColor={(d) => {
          const isAvailable = isCountryAvailable(d.properties.name);
          return isAvailable ? 'rgba(255,0,0,0.15)' : 'rgba(0,0,0,0)'; // Red fill for available countries
        }}
        polygonSideColor={(d) => {
          const isAvailable = isCountryAvailable(d.properties.name);
          return isAvailable ? 'rgba(255,0,0,0.1)' : 'rgba(0,0,0,0)'; // Red sides
        }}
        polygonStrokeColor={(d) => {
          const isAvailable = isCountryAvailable(d.properties.name);
          return isAvailable ? '#ff0000' : 'rgba(100,200,255,0.05)'; // RED BORDER for available countries
        }}
        polygonAltitude={(d) => {
          const isAvailable = isCountryAvailable(d.properties.name);
          return isAvailable ? 0.015 : 0.001; // Slightly elevated for available countries
        }}
        onPolygonClick={handleCountryClick}
        onPolygonHover={(country) => {
          const countryData = country?.properties ? {
            name: country.properties.name,
            hasRoute: isCountryAvailable(country.properties.name)
          } : null;
          setHoveredCountry(countryData);
        }}
        polygonLabel={({ properties: d }) => {
          const isAvailable = isCountryAvailable(d.name);
          const color = isAvailable ? '#ff0000' : '#4ecdc4';
          return `
            <div style="
              background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(50,0,0,0.95) 100%); 
              padding: 15px 20px; 
              border-radius: 12px; 
              color: white;
              font-size: 16px;
              font-weight: bold;
              border: 2px solid ${color};
              box-shadow: 0 8px 25px ${color}40;
              text-align: center;
              max-width: 200px;
              backdrop-filter: blur(10px);
            ">
              <div style="color: ${color}; font-size: 18px; margin-bottom: 8px;">
                ${isAvailable ? '🎯' : '🔗'} ${d.name}
              </div>
              <div style="font-size: 13px; opacity: 0.9; color: #ccc;">
                ${isAvailable ? 'Click to explore this destination' : 'Click to view on Wikipedia'}
              </div>
            </div>
          `;
        }}
        
        // Enhanced dots with RED color for available countries
        pointsData={countryPoints}
        pointColor={d => d.hasRoute ? '#007bffff' : d.color}
        pointAltitude={0.02}
        pointRadius={d => d.hasRoute ? d.size * 2.5 : d.size * 1.5}
        pointResolution={20}
        onPointClick={handlePointClick}
        onPointHover={(point, prevPoint) => {
          if (globeRef.current) {
            globeRef.current.renderer().domElement.style.cursor = point ? 'pointer' : 'grab';
          }
          setHoveredCountry(point || null);
        }}
        pointLabel={d => {
          const color = d.hasRoute ? '#00ffccff' : '#4ecdc4';
          return `
            <div style="
              background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(50,0,0,0.95) 100%); 
              padding: 15px 20px; 
              border-radius: 12px; 
              color: white;
              font-size: 16px;
              font-weight: bold;
              border: 2px solid ${color};
              box-shadow: 0 8px 25px ${color}40;
              text-align: center;
              backdrop-filter: blur(10px);
            ">
              <div style="color: ${color}; font-size: 18px; margin-bottom: 8px;">
                ${d.hasRoute ? '🎯' : '🔗'} ${d.name}
              </div>
              <div style="font-size: 13px; opacity: 0.9; color: #ccc;">
                ${d.hasRoute ? 'Click to explore' : 'Opens Wikipedia'}
              </div>
            </div>
          `;
        }}
        
        // Enhanced atmosphere
        atmosphereColor="green"
        atmosphereAltitude={0.15}
        
        // Controls
        enablePointerInteraction={true}
        autoRotate={false}
        controlType="orbit"
        enableZoom={true}
        enableRotate={true}
        
        // Performance optimization
        rendererConfig={{
          antialias: true,
          alpha: true
        }}
        
        // Globe dimensions
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}

