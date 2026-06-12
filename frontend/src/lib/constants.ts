export const DEHRADUN_CENTER = { lat: 30.3165, lng: 78.0322 };

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  house: 'House',
  villa: 'Villa',
  plot: 'Plot',
  commercial: 'Commercial',
};

export const PRICE_TYPE_LABELS: Record<string, string> = {
  sale: 'For Sale',
  rent: 'For Rent',
};

export const FURNISHING_LABELS: Record<string, string> = {
  unfurnished: 'Unfurnished',
  'semi-furnished': 'Semi-Furnished',
  'fully-furnished': 'Fully Furnished',
};

export const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  sold: 'Sold',
  rented: 'Rented',
  inactive: 'Inactive',
};

export const INQUIRY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  read: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  replied: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};
