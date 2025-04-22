import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { latLngToCell, cellToBoundary } from 'h3-js';
import 'maplibre-gl/dist/maplibre-gl.css';
import Papa from 'papaparse';
import { Feature, Polygon } from 'geojson';

const MapLibreWithCoverage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<any[]>([]);

  // Function to load and parse CSV data
  const loadCSVData = async () => {
    try {
      const response = await fetch('/410.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch CSV file');
      }
      const text = await response.text();
      Papa.parse(text, {
        complete: (result) => {
          setData(result.data);
        },
        header: false,
      });
    } catch (error) {
      console.error('Error loading CSV:', error);
    }
  };

  useEffect(() => {
    loadCSVData();
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [74.3587, 31.5204],
      zoom: 10,
    });

    map.on('load', () => {
      const coverageData = data

        .map((entry: any, index: number) => {
          let lat = entry[6];
          let lng = entry[7];
          const coverage = entry[8];

          if (typeof lat === 'undefined' || typeof lng === 'undefined') {
            console.error(
              `Missing values at Row ${index}: Lat: ${lat}, Lng: ${lng}`
            );
            return null;
          }

          lat = parseFloat(lat);
          lng = parseFloat(lng);

          if (isNaN(lat) || isNaN(lng)) {
            console.error(
              `Invalid values at Row ${index}: Lat: ${lat}, Lng: ${lng}`
            );
            return null;
          }

          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error(
              `Invalid coordinates at Row ${index}: Lat: ${lat}, Lng: ${lng}`
            );
            return null;
          }

          const h3Index = latLngToCell(lng, lat, 9);
          const hexBoundary = cellToBoundary(h3Index, true);

          if (!hexBoundary || hexBoundary.length < 6) {
            console.error('Invalid hex boundary:', hexBoundary);
            return null;
          }

          const geoJsonBoundary = hexBoundary.map((coord: [number, number]) => [
            coord[0],
            coord[1],
          ]);

          geoJsonBoundary.push(geoJsonBoundary[0]);

          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [geoJsonBoundary],
            },
            properties: {
              coverage: coverage,
            },
          } as Feature<Polygon, { coverage: number }>;
        })
        .filter((d) => d !== null);

      if (coverageData.length > 0) {
        map.addSource('coverage', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: coverageData,
          },
        });

        map.addLayer({
          id: 'coverage-fill',
          type: 'fill',
          source: 'coverage',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'coverage'],
              0,
              '#ffaf7b', // low coverage
              50,
              '#ffa500', // medium coverage
              100,
              '#008000', // high coverage
            ],
            'fill-opacity': 0.6,
          },
        });

        map.addLayer({
          id: 'coverage-outline',
          type: 'line',
          source: 'coverage',
          paint: {
            'line-color': '#3a1c71',
            'line-width': 2,
          },
        });
      } else {
        console.error('No valid coverage data found.');
      }
    });

    return () => {
      map.remove();
    };
  }, [data]);

  return (
    <div
      ref={mapContainer}
      style={{ height: '100vh', width: '100vw' }}
    />
  );
};

export default MapLibreWithCoverage;
