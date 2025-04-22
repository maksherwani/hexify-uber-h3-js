import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { latLngToCell, cellToBoundary } from 'h3-js';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Feature, Polygon } from 'geojson';

const MapLibreWithHex: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  const lat = 37.775938;
  const lng = -122.41795;
  const resolution = 9;

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [lng, lat],
      zoom: 12,
    });

    map.on('load', () => {
      const h3Index = latLngToCell(lat, lng, resolution);
      const hexBoundary = cellToBoundary(h3Index, true);
      if (!hexBoundary || hexBoundary.length < 6) {
        console.error('Invalid hex boundary data:', hexBoundary);
        return;
      }

      hexBoundary.push(hexBoundary[0]);

      const hexPolygon: Feature<Polygon> = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [hexBoundary],
        },
        properties: {},
      };

      map.addSource('hex', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [hexPolygon],
        },
      });

      map.addLayer({
        id: 'hex-fill',
        type: 'fill',
        source: 'hex',
        paint: {
          'fill-color': '#ffaf7b',
          'fill-opacity': 0.6,
        },
      });

      map.addLayer({
        id: 'hex-outline',
        type: 'line',
        source: 'hex',
        paint: {
          'line-color': '#3a1c71',
          'line-width': 2,
        },
      });

      const bounds = new maplibregl.LngLatBounds(
        hexBoundary[0] as [number, number],
        hexBoundary[0] as [number, number]
      );
      hexBoundary.slice(1).forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });

      map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{ height: '100vh', width: '100vw' }}
    />
  );
};

export default MapLibreWithHex;
