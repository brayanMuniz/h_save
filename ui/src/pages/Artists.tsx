import EntityListPage from "./EntityListPage";
import ArtistCard from "../components/ArtistCard";

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
