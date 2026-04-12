export * from './auth.service';
import { AuthService } from './auth.service';
export * from './status.service';
import { StatusService } from './status.service';
export * from './tours.service';
import { ToursService } from './tours.service';
export * from './values.service';
import { ValuesService } from './values.service';
export const APIS = [AuthService, StatusService, ToursService, ValuesService];
