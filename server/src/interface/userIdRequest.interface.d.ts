// custom-request.interface.ts

import { Request } from 'express';

interface UserIdRequest extends Request {
  user: {
    id: number;
  };
  // id:number
}

export default UserIdRequest;
