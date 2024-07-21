// import React from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppState } from '../../redux/store';
// import { setFilters } from '../../redux/tableSlice';
// import { supportedYears } from '../../data/Contestants';
// import { countries } from '../../data/Countries';

// const Filters: React.FC = () => {
//   const dispatch = useDispatch();
//   const filters = useSelector((state: AppState) => state.tableState.filters);

//   const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const year = e.target.value ? parseInt(e.target.value) : undefined;
//     dispatch(setFilters({ year }));
//   };

//   const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const country = e.target.value || undefined;
//     dispatch(setFilters({ country }));
//   };

//   return (
//     <div className="flex space-x-4">
//       <select value={filters.year || ''} onChange={handleYearChange}>
//         <option value="">All Years</option>
//         {supportedYears.map(year => (
//           <option key={year} value={year}>{year}</option>
//         ))}
//       </select>
//       <select value={filters.country || ''} onChange={handleCountryChange}>
//         <option value="">All Countries</option>
//         {countries.map(country => (
//           <option key={country.id} value={country.name}>{country.name}</option>
//         ))}
//       </select>
//     </div>
//   );
// };

// export default Filters;