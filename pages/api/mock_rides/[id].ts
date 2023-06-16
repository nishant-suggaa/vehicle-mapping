import { NextApiRequest, NextApiResponse } from 'next';
import client from '../db';

client.connect().catch((error) => console.error(`Failed to connect to the database: ${error.message}`));

function decodePolyline(polyline: string) {
  // If polyline is not a string, return an empty array
  if (typeof polyline !== 'string') {
    return [];
  }

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const coordinateFactor = 1e5;
  const coordinates: number[] = [];

  let currentLat = 0;
  let currentLng = 0;

  for (let i = 0; i < polyline.length; ) {
    let shift = 0;  
    let result = 0;
    let byte: number;

    do {
      byte = polyline.charCodeAt(i++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    currentLat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(i++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    currentLng += deltaLng;

    coordinates.push(currentLat / coordinateFactor, currentLng / coordinateFactor);
  }

  return coordinates;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const mockRide = req.body;
    console.log(mockRide);
    try {
      if (mockRide && mockRide.status !== 'Ended') {
        // Check if path and overview_polyline exist before decoding
        const path = mockRide.path && mockRide.path.overview_polyline ? decodePolyline(mockRide.path.overview_polyline.points) : [];
        const nextIndex = mockRide.index + 1;
        const nextLocation = path.slice(nextIndex * 2, (nextIndex + 1) * 2);

        if (!nextLocation || nextLocation.length !== 2) {
          await updateMockRideStatus(mockRide.id, 'Ended');
        } else {
          await insertVehicleLocation(mockRide.vehicle_id, nextLocation);
          await updateMockRideIndex(mockRide.id, nextIndex);
        }

        res.status(200).json({ message: 'Success' });
      } else {
        res.status(404).json({ message: 'Not Found' });
      }
    } catch (err: any) {
      console.error('Error in main handler:', err);
      res.status(500).json({ message: err.message });
    }
  }


  async function updateMockRideStatus(id: string, status: string) {
    try {
      const query = 'UPDATE mock_route SET status = $1 WHERE id = $2';
      const values = [status, id];
      await client.query(query, values);
    } catch (error: any) {
      console.error('Error in updateMockRideStatus:', error);
      throw error;
    }
  }
  
  async function insertVehicleLocation(vehicle_id: string, location: any) {
    try {
      const query = 'INSERT INTO vehicle_location (vehicle_id, current_location) VALUES ($1, ST_GeomFromText($2, 4326))';
      const pointString = `POINT(${location[0]} ${location[1]})`;
      const values = [vehicle_id, pointString];
      await client.query(query, values);
    } catch (error: any) {
      throw new Error(`Failed to insert vehicle location: ${error.message}`);
    }
  }
  
  
  async function updateMockRideIndex(id: string, index: number) {
    try {
  
      const query = 'UPDATE mock_route SET index = $1 WHERE id = $2';
      const values = [index, id];
      await client.query(query, values);
      
    } catch (error: any) {
      throw new Error(`Failed to update mock ride index: ${error.message}`);
    }
  }
