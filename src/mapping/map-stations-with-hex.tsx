import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { latLngToCell, cellToBoundary, gridDisk } from 'h3-js';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Feature, Polygon } from 'geojson';

const MapStationsWithHex: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const resolution = 8;

  const stations = [
    { name: 'Station 1', lat: 31.5204, lng: 74.3587 },
    { name: 'Station 2', lat: 31.56, lng: 74.33 },
    { name: 'Station 3', lat: 31.5, lng: 74.4 },
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [74.36, 31.52],
      zoom: 12,
    });

    map.on('load', () => {
      const coveredHexes = new Set<string>();

      stations.forEach(({ lat, lng }) => {
        const centerHex = latLngToCell(lat, lng, resolution);
        const disk = gridDisk(centerHex, 3);
        disk.forEach((h3Index) => coveredHexes.add(h3Index));
      });

      const hexFeatures: Feature<Polygon>[] = Array.from(coveredHexes).map(
        (h3Index) => {
          const boundary = cellToBoundary(h3Index, true);
          boundary.push(boundary[0]);
          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [boundary],
            },
            properties: {},
          };
        }
      );

      map.addSource('coverage', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: hexFeatures,
        },
      });

      map.addLayer({
        id: 'coverage-fill',
        type: 'fill',
        source: 'coverage',
        paint: {
          'fill-color': '#4CAF50',
          'fill-opacity': 0.5,
        },
      });

      map.addLayer({
        id: 'coverage-outline',
        type: 'line',
        source: 'coverage',
        paint: {
          'line-color': '#2E7D32',
          'line-width': 1,
        },
      });
    });

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{ height: '100vh', width: '100vw' }}
    />
  );
};

export default MapStationsWithHex;
