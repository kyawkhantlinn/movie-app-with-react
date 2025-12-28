import React, { useState, useEffect } from "react"
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";
import { resume } from "react-dom/server";

const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
};

const App = () => {
  const [totalMovies, setTotalMovies] = useState("thousands of");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);

  // Debounce the search term to prevent making too many API requests
  // by waiting for the user to stop typing for 500ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchTotalMovie = async () => {
    const endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
    const response = await fetch(endpoint, API_OPTIONS);

    const data = await response.json();
    setTotalMovies(data.total_results);
  }

  const fetchMovies = async (query = "") => {
    setIsLoading(true);
    setErrorMessage("");

    try {

      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {

      console.error(`Error fetching movies : ${error}`);
      setErrorMessage("Error fetching movies. Please try again later.");

    } finally {

      setIsLoading(false);

    }
  }

  const loadTrendingMovies = async () => {
    try {

      const movies = await getTrendingMovies();
      setTrendingMovies(movies);

    } catch (error) {

      console.error(`Error fetching trending movies : ${error}`);

    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchTotalMovie();
    loadTrendingMovies();
  }, []);

  return (
    <main>

      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>

          <Search totalMovies={totalMovies} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <div className="w-full bg-light-100/5 flex justify-center align-center px-4 py-20 rounded-lg mt-10 max-w-3xl mx-auto">
              <Spinner />
            </div>
          ) : errorMessage ? (
            <p className="text-lg wrap-break-word leading-12 text-center text-red-600 w-full bg-light-100/5 px-4 py-6 rounded-lg mt-10 max-w-3xl mx-auto">{errorMessage}</p>
          ) : movieList.length > 0 ? (
            <ul>
              {movieList.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          ) : (
            <p className="text-lg wrap-break-word leading-12 text-center text-gray-600 w-full bg-light-100/5 px-4 py-6 rounded-lg mt-10 max-w-3xl mx-auto">No results found for <i className="text-gray-400">{searchTerm}</i></p>
          )}
        </section>
      </div>

    </main>
  );
}

export default App;