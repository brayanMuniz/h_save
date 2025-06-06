import EntityDetailPage from "./EntityDetailPage";

const ArtistPage = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Artist"
      entityTypePlural="Artists"
      paramName="artist"
      apiEndpointPrefix="/api/artist"
      favoriteApiEndpointPrefix="/api/user/favorite/artist"
      detailsResponseKey="artistDetails"
      backLink="/artists"
      icon="🎨"
    />
  );
};

export default ArtistPage;
