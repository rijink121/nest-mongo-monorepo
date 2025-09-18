import { defaultEngine } from '@shared/config/app.config';
import { AppEngine } from '@shared/constants/app.contants';
import { SchemaTypes } from 'mongoose';

export const getIdType =
  defaultEngine === AppEngine.Mongo ? SchemaTypes.ObjectId : Number;
