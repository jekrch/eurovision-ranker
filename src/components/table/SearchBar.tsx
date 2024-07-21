// // components/SearchBar.tsx

// import React from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppState } from '../../redux/store';
// import { setSearchTerm } from '../../redux/tableSlice';
// import { useAppDispatch } from '../../utilities/hooks';


// const SearchBar: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const searchTerm = useSelector((state: AppState) => state.tableState.searchTerm);

//   const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//     dispatch(setSearchTerm(e.target.value));
//   };

//   return (
//     <input
//       type="text"
//       value={searchTerm}
//       onChange={handleSearch}
//       placeholder="Search songs or performers..."
//       className="w-full p-2 border rounded"
//     />
//   );
// };

// export default SearchBar;