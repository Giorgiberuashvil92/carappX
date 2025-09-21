import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  lastUpdated: number;
}

@Injectable()
export class LocationService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.db.collection('user_locations');
  }

  async updateUserLocation(
    userId: string,
    latitude: number,
    longitude: number,
    address?: string,
    city?: string,
  ): Promise<void> {
    const locationData: UserLocation = {
      userId,
      latitude,
      longitude,
      address,
      city,
      lastUpdated: Date.now(),
    };

    await this.col().doc(userId).set(locationData);
  }

  async getUserLocation(userId: string): Promise<UserLocation | null> {
    const doc = await this.col().doc(userId).get();
    return doc.exists ? (doc.data() as UserLocation) : null;
  }

  // Haversine formula to calculate distance between two points
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Calculate distance for a location
  calculateLocationDistance(
    userLat: number,
    userLon: number,
    locationLat: number,
    locationLon: number,
  ): number {
    return this.calculateDistance(userLat, userLon, locationLat, locationLon);
  }

  // Get nearby locations within radius
  async getNearbyLocations(
    userId: string,
    radiusKm: number = 5,
  ): Promise<Array<{ location: any; distance: number }>> {
    const userLocation = await this.getUserLocation(userId);
    if (!userLocation) {
      throw new Error('User location not found');
    }

    // Get all carwash locations
    const carwashCol = this.firebase.db.collection('carwash_locations');
    const snap = await carwashCol.get();
    const locations = snap.docs.map((d) => d.data());

    // Calculate distances and filter by radius
    const nearbyLocations = locations
      .map((location) => ({
        location,
        distance: this.calculateLocationDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.latitude || 0,
          location.longitude || 0,
        ),
      }))
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return nearbyLocations;
  }
}
