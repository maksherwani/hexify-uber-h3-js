import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { latLngToCell, cellToBoundary } from 'h3-js';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Feature, Polygon, Point } from 'geojson';

const MapStadiumsWithHex: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  const resolution = 9;

  const stadiums = [
    {
      name: 'Gaddafi Stadium',
      lat: 31.5204,
      lng: 74.3587,
    },
    {
      name: 'National Stadium Karachi',
      lat: 24.8928,
      lng: 67.0647,
    },
    {
      name: 'Rawalpindi Cricket Stadium',
      lat: 33.6276,
      lng: 73.0479,
    },
    {
      name: 'Multan Cricket Stadium',
      lat: 30.1956,
      lng: 71.4192,
    },
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [73.0479, 33.6276],
      zoom: 5.5,
    });

    map.on('load', () => {
      const hexPolygons: Feature<Polygon>[] = [];
      const pointFeatures: Feature<Point>[] = [];

      for (const stadium of stadiums) {
        const h3Index = latLngToCell(stadium.lat, stadium.lng, resolution);
        const boundary = cellToBoundary(h3Index, true);
        if (!boundary || boundary.length < 6) continue;

        boundary.push(boundary[0]);

        hexPolygons.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [boundary],
          },
          properties: {
            name: stadium.name,
          },
        });

        pointFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [stadium.lng, stadium.lat],
          },
          properties: {
            name: stadium.name,
          },
        });
      }

      map.addSource('hexes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: hexPolygons,
        },
      });

      map.addSource('stadiums', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: pointFeatures,
        },
      });

      map.addLayer({
        id: 'hex-fill',
        type: 'fill',
        source: 'hexes',
        paint: {
          'fill-color': '#ffaf7b',
          'fill-opacity': 0.6,
        },
      });

      map.addLayer({
        id: 'hex-outline',
        type: 'line',
        source: 'hexes',
        paint: {
          'line-color': '#3a1c71',
          'line-width': 2,
        },
      });

      map.addLayer({
        id: 'stadium-points',
        type: 'circle',
        source: 'stadiums',
        paint: {
          'circle-radius': 6,
          'circle-color': '#1978c8',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: 'stadium-labels',
        type: 'symbol',
        source: 'stadiums',
        layout: {
          'text-field': ['get', 'name'],
          'text-offset': [0, 1.2],
          'text-size': 12,
        },
        paint: {
          'text-color': '#333',
        },
      });
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

export default MapStadiumsWithHex;
