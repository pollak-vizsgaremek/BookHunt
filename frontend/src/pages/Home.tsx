import Navigation from "../components/Navigation"

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Placeholder for main content of the home page */}
      <div className="pt-15 max-w-6xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">Hey hey</h1>
        <p className="text-lg text-gray-700">
          Currently the placeholder to test routing and navigation
        </p>
    </div>
    </div>
  )
}

export default Home
