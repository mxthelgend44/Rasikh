import type { Bank, Employer, Landlord, Property } from '../types';

/** Illustrative mock data: all organisations are fictional and all rents are estimates. */

export const EMPLOYERS: Employer[] = [
  {
    id: 'emp_gulf_meridian',
    name: 'Gulf Meridian Technologies',
    industry: 'Technology',
    area: 'Al Maryah Island',
    hrContact: { name: 'Layla Haddad', email: 'layla.haddad@gulfmeridian.example' },
  },
  {
    id: 'emp_northwind',
    name: 'Northwind Analytics',
    industry: 'Data analytics',
    area: 'Al Maryah Island',
    hrContact: { name: 'Ciara Doyle', email: 'ciara.doyle@northwind.example' },
  },
];

export const LANDLORDS: Landlord[] = [
  { id: 'landlord_al_reem', name: 'Al Reem Residences', area: 'Al Reem Island' },
  { id: 'landlord_khalifa', name: 'Khalifa City Villas Management', area: 'Khalifa City' },
  { id: 'landlord_yas', name: 'Yas Gardens Lettings', area: 'Yas Island' },
];

export const BANKS: Bank[] = [{ id: 'bank_saadiyat', name: 'Saadiyat Commercial Bank' }];

function reem(
  unit: string,
  bedrooms: number,
  estAnnualRentAed: number,
  chequeOptions: number[],
  tower = 'Al Reem Gardens Tower',
): Property {
  return {
    id: `prop_reem_${unit}`,
    landlordId: 'landlord_al_reem',
    name: tower,
    area: 'Al Reem Island',
    unit,
    bedrooms,
    leaseRef: `lease_reem_${unit}`,
    estAnnualRentAed,
    chequeOptions,
  };
}

export const PROPERTIES: Property[] = [
  reem('2207', 2, 98_000, [1, 2, 4]),
  reem('1104', 1, 74_000, [1, 2]),
  reem('0815', 1, 68_000, [1, 2, 4], 'Reem Harbour Residences'),
  reem('0912', 0, 55_000, [1, 2], 'Reem Harbour Residences'),
  reem('1530', 2, 105_000, [2, 4]),
  {
    id: 'prop_maryah_1706',
    landlordId: 'landlord_al_reem',
    name: 'Maryah Plaza Residences',
    area: 'Al Maryah Island',
    unit: '1706',
    bedrooms: 2,
    leaseRef: 'lease_maryah_1706',
    estAnnualRentAed: 135_000,
    chequeOptions: [2, 4],
  },
  {
    id: 'prop_khalifa_v12',
    landlordId: 'landlord_khalifa',
    name: 'Khalifa Gardens Compound',
    area: 'Khalifa City',
    unit: 'V12',
    bedrooms: 3,
    leaseRef: 'lease_khalifa_v12',
    estAnnualRentAed: 150_000,
    chequeOptions: [2, 4],
  },
  {
    id: 'prop_yas_0304',
    landlordId: 'landlord_yas',
    name: 'Yas Gardens Apartments',
    area: 'Yas Island',
    unit: '0304',
    bedrooms: 1,
    leaseRef: 'lease_yas_0304',
    estAnnualRentAed: 80_000,
    chequeOptions: [1, 2, 4],
  },
];
