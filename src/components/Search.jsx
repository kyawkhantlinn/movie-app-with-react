import React from "react";

const Search = ({ totalMovies, searchTerm, setSearchTerm }) => {
    return (
        <div className="search">
            <div>
                <img src="search.svg" alt="search" />

                <input type="text" placeholder={`Search through ${totalMovies.toLocaleString()} movies`} value={searchTerm} onChange={(e) => (setSearchTerm(e.target.value))} />
            </div>
        </div>
    );
}

export default Search;