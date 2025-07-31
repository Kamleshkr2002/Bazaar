import Navbar from "../components/common/Navbar";

const Home = () => {
  return (
    <div className="p-6">
      <Navbar/>
      <h1 className="text-3xl font-bold mb-4">Explore Items</h1>
      <p className="text-gray-600">This is the homepage. Product cards will go here.</p>
    </div>
  );
};

export default Home;
