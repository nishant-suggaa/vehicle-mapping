import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';


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
    const { id } = body.event.data.new;
    await axios.post(`https://mapping-api-zeta.vercel.app/api/mock_rides/${id}`, body.event.data.new);

    res.status(200).json({ message: 'Success' , id: id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
