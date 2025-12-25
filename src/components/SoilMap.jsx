import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
// Import the leaflet-draw JS so the draw handlers register on the global L namespace
import 'leaflet-draw';
import { API_ENDPOINTS } from '../config/api';

function SoilMap() {
  const [geojson, setGeojson] = useState(null);               
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleCreated = useCallback(async (e) => {
    const layer = e.layer;
    // For polygons, getLatLngs returns nested arrays
    const latlngs = layer.getLatLngs();

    // Convert to GeoJSON polygon coordinates: [ [ [lng, lat], ... ] ]
    const coordinates = latlngs[0].map(({ lat, lng }) => [lng, lat]);
    // Ensure closed polygon
    if (coordinates.length && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
      coordinates.push(coordinates[0]);
    }

    const polygonGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };

    setGeojson(polygonGeoJSON);

    // Send polygon to backend API to request soil data
    try {
      setLoading(true);
      const resp = await fetch(API_ENDPOINTS.SOIL_AREA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon: polygonGeoJSON, samples: 9 })
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server returned ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch soil data:', err);
      setResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleted = useCallback(() => {
    setGeojson(null);
    setResults(null);
  }, []);

  const downloadCSV = useCallback(() => {
    // Determine which array to export. Backend returns { status, samples, results: [...] }
    let arr = null;
    if (!results) return;
    if (Array.isArray(results)) arr = results;
    else if (Array.isArray(results.results)) arr = results.results;
    else return;

    // Flatten nested objects for CSV export
    const flatten = (obj, parent = '', res = {}) => {
      for (const [k, v] of Object.entries(obj || {})) {
        const key = parent ? `${parent}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          flatten(v, key, res);
        } else if (Array.isArray(v)) {
          res[key] = JSON.stringify(v);
        } else {
          res[key] = v;
        }
      }
      return res;
    };

    const flatRows = arr.map(item => {
      // If item has nested `soil` object (from backend), merge lat/lon and flattened soil
      const base = {};
      if (item.lat !== undefined) base.lat = item.lat;
      if (item.lon !== undefined) base.lon = item.lon;
      if (item.soil && typeof item.soil === 'object') {
        Object.assign(base, flatten(item.soil));
      }
      // Also flatten top-level fields
      Object.assign(base, flatten(item));
      return base;
    });

    // Build header (union of all keys)
    const allKeys = Array.from(new Set(flatRows.flatMap(r => Object.keys(r))));
    const header = allKeys.join(',') + '\n';
    const rows = flatRows.map(r => allKeys.map(k => {
      const v = r[k] === undefined ? '' : r[k];
      // Escape quotes
      const cell = typeof v === 'string' ? v.replace(/"/g, '""') : String(v);
      // Wrap in quotes if contains comma or newline
      return (/,|\n|\r|"/.test(cell)) ? `"${cell}"` : cell;
    }).join(',')).join('\n');

    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'soil_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <div className="w-full h-full">
      <div style={{ height: 520 }} className="rounded-md overflow-hidden">
        <MapContainer center={[20, 0]} zoom={3} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onDeleted={handleDeleted}
              draw={{
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  showArea: true,
                  shapeOptions: { color: '#f06eaa' }
                }
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      <div className="mt-4 p-4 bg-white rounded shadow-sm">
        <h4 className="font-semibold">Selection</h4>
        {geojson ? (
          <div>
            <pre style={{ maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(geojson, null, 2)}</pre>
            <div className="mt-2">
              <button onClick={downloadCSV} className="mr-2 bg-blue-600 text-white px-3 py-1 rounded">Download CSV</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">Draw a polygon to request soil data for that area.</div>
        )}

        <div className="mt-4">
          <h5 className="font-semibold">Soil Results</h5>
          {loading && <div className="text-sm">Loading soil data...</div>}
          {!loading && results && (
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              <pre>{JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SoilMap;
