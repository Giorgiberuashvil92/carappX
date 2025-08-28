import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Car } from '../types/garage';

interface CarContextType {
  cars: Car[];
  selectedCar: Car | null;
  addCar: (car: Omit<Car, 'id' | 'imageUri' | 'lastService' | 'nextService'>) => void;
  selectCar: (car: Car) => void;
  removeCar: (carId: string) => void;
  updateCar: (carId: string, updates: Partial<Car>) => void;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

const INITIAL_CARS: Car[] = [
  {
    id: '1',
    make: 'BMW',
    model: 'M5 Competition',
    year: 2023,
    plateNumber: 'AA-001-AA',
    imageUri: 'https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    lastService: new Date('2024-01-15'),
    nextService: new Date('2024-07-15'),
  },
  {
    id: '2',
    make: 'Mercedes-Benz',
    model: 'C63 S AMG',
    year: 2024,
    plateNumber: 'BB-002-BB',
    imageUri: 'https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    lastService: new Date('2024-02-01'),
    nextService: new Date('2024-08-01'),
  },
];

export function CarProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<Car[]>(INITIAL_CARS);
  const [selectedCar, setSelectedCar] = useState<Car | null>(INITIAL_CARS[0]);

  const addCar = (carData: Omit<Car, 'id' | 'imageUri' | 'lastService' | 'nextService'>) => {
    const newCar: Car = {
      ...carData,
      id: Date.now().toString(),
      imageUri: 'https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      lastService: new Date(),
      nextService: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
    };
    
    setCars(prevCars => [...prevCars, newCar]);
    
    // If this is the first car, select it
    if (cars.length === 0) {
      setSelectedCar(newCar);
    }
  };

  const selectCar = (car: Car) => {
    setSelectedCar(car);
  };

  const removeCar = (carId: string) => {
    setCars(prevCars => prevCars.filter(car => car.id !== carId));
    
    // If we're removing the selected car, select the first available car
    if (selectedCar?.id === carId) {
      const remainingCars = cars.filter(car => car.id !== carId);
      setSelectedCar(remainingCars.length > 0 ? remainingCars[0] : null);
    }
  };

  const updateCar = (carId: string, updates: Partial<Car>) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { ...car, ...updates } : car
      )
    );
    
    // Update selected car if it's the one being updated
    if (selectedCar?.id === carId) {
      setSelectedCar(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  return (
    <CarContext.Provider value={{
      cars,
      selectedCar,
      addCar,
      selectCar,
      removeCar,
      updateCar,
    }}>
      {children}
    </CarContext.Provider>
  );
}

export function useCars() {
  const context = useContext(CarContext);
  if (context === undefined) {
    throw new Error('useCars must be used within a CarProvider');
  }
  return context;
}
