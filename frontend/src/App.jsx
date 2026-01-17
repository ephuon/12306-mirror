import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchResultPage from './pages/SearchResultPage';
import UserCenterPage from './pages/UserCenterPage';
import PersonalInfo from './pages/center/PersonalInfo';
import PassengerList from './pages/center/PassengerList';
import OrderList from './pages/center/OrderList';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<SearchResultPage />} />
      <Route path="/center" element={<UserCenterPage />}>
        <Route index element={<PersonalInfo />} />
        <Route path="personal" element={<PersonalInfo />} />
        <Route path="passengers" element={<PassengerList />} />
        <Route path="orders" element={<OrderList />} />
      </Route>
    </Routes>
  );
}
export default App;
