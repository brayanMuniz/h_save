import EntityListPage from "./EntityListPage";

const AllArtistsPage = () => {
  return (
    <EntityListPage
      entityName="Artist"
      entityNamePlural="Artists"
      listApiEndpoint="/api/artists"
      favoriteApiEndpointPrefix="/api/user/favorite/artist"
      entityLinkPrefix="/artist"
      icon="🎨"
    />
  );
};

export default AllArtistsPage;
