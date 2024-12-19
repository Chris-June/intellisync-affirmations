const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-md bg-gray-900/80 border-b border-gray-800/50">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600">
          Daily Affirmations
        </h1>
      </div>
    </header>
  );
};

export default Header;
