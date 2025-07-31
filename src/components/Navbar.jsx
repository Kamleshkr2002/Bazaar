import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-green-500 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">CampusMarket</Link>
      <div className="space-x-4">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;
