import { ObjectId } from 'mongodb';

export type User = {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bikeType: 'trail' | 'enduro' | 'mtb' | 'dh';
};
