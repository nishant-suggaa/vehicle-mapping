import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import client from './db';

client.connect().catch((error) => console.error(`Failed to connect to the database: ${error.message}`));
interface Coordinates {
  coordinates: number[];
  crs: {
    properties: {
      name: string;
    };
    type: string;
  };
  type: string;
}

interface MockRide {
  created_at: string;
  delivery_info: {
    current_retry: number;
    max_retries: number;
  };
  event: {
    data: {
      new: {
        created_at: string;
        drop: Coordinates;
        drop_info: any;
        id: number;
        index: number;
        path: {
          coordinates: any[];
        };
        pickup: Coordinates;
        pickup_info: any;
        speed: number;
        status: string;
        updated_at: string;
        vehicle_id: number;
      };
    };
  };
  id: string;
  table: {
    name: string;
    schema: string;
  };
  trigger: {
    name: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     const body: MockRide = req.body;
  try {
    
    const { pickup, drop, id } = body.event.data.new;

    
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${pickup.coordinates[1]},${pickup.coordinates[0]}`, // Swap lat and lon
        destination: `${drop.coordinates[1]},${drop.coordinates[0]}`, // Swap lat and lon
        key: 'AIzaSyABi8-qwYxFA0t-KeTuuKegUMI5qbLlc6k',
      },
    });

    const path = response.data;

    // 2a. Update path field of mock_route with response JSON
    

    const [pickupInfo, dropInfo] = await Promise.all([
      reverseGeocode(pickup.coordinates),
      reverseGeocode(drop.coordinates),
    ]);

    await updateMockRidesInfo(id, pickupInfo, dropInfo);

    await updateMockRidesPath(id, path);

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

async function updateMockRidesPath(id: number, path: any) {
  try {
    // Implement a function to update the path field of the mock_route table
    
    const updateQuery = `
      UPDATE mock_route
      SET path = $1
      WHERE id = $2
    `
    await client.query(updateQuery, [path, id]);

  } catch (error) {
    throw new Error(`Failed to update mock_route path: ${(error as Error).message}`);
  }
}

async function reverseGeocode(coordinates: number[]) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${coordinates[1]},${coordinates[0]}`,
        key: 'AIzaSyABi8-qwYxFA0t-KeTuuKegUMI5qbLlc6k' // Replace with your actual API key
      }
    });

    if (response.data.results.length > 0) {
      // Extract the formatted address from the response
      const result = response.data.results[0];
      const formattedAddress =result ? result.formatted_address : 'Unknown location';
      return formattedAddress;
    } else {
      console.log('No results found.');
      return null; // Return null or handle the case when no results are found
    }
  } catch (error) {
    console.error('Error:', (error as Error).message);
    return null; // Return null or handle the error case
  }
}


async function updateMockRidesInfo(id: number, pickupInfo: any, dropInfo: any) {
  try {
    // Implement a function to update the pickup_info and drop_info fields of the mock_route table
    const updateQuery = `
      UPDATE mock_route
      SET pickup_info = $1, drop_info = $2
      WHERE id = $3
    `;
    await client.query(updateQuery, [JSON.stringify(pickupInfo), JSON.stringify(dropInfo), id]);
  } catch (error) {
    throw new Error(`Failed to update mock_route info: ${(error as Error).message}`);
  }
}
