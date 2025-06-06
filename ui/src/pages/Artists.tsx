import React from "react";
import EntityListPage from "./EntityListPage"; // Import the abstract component
import ArtistCard from "../components/ArtistCard"; // Import the specific card

const ArtistsPage = () => {
  return (
    <EntityListPage
      entityName="Artist"
      entityNamePlural="Artists"
      listApiEndpoint="/api/artists"
      favoriteApiEndpointPrefix="/api/user/favorite/artist"
      CardComponent={ArtistCard}
      icon="🎨"
    />
  );
};

export default ArtistsPage;
