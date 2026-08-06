import { createContext, useContext, useState } from "react";
import { GENDER_FILTER_ALL } from "../data/profileOptions";

const SwipeFiltersContext = createContext(null);

const DEFAULT_FILTERS = { gender: GENDER_FILTER_ALL, ageMin: 18, ageMax: 90, maxDistance: 100 };

export function SwipeFiltersProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SwipeFiltersContext.Provider value={{ filters, updateFilter, showFilters, setShowFilters }}>
      {children}
    </SwipeFiltersContext.Provider>
  );
}

export function useSwipeFilters() {
  return useContext(SwipeFiltersContext);
}
