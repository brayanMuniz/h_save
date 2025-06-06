import EntityDetailPage from "./EntityDetailPage";

const ParodyPage = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Parody"
      entityTypePlural="Parodies"
      paramName="parody"
      apiEndpointPrefix="/api/parody"
      favoriteApiEndpointPrefix="/api/user/favorite/parody"
      detailsResponseKey="parodyDetails"
      backLink="/parodies"
      icon="🎭"
    />
  );
};

export default ParodyPage;
