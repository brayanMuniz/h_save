import EntityDetailPage from "./EntityDetailPage";

const TagPage = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Tag"
      entityTypePlural="Tags"
      paramName="tag"
      apiEndpointPrefix="/api/tag"
      favoriteApiEndpointPrefix="/api/user/favorite/tag"
      detailsResponseKey="tagDetails"
      backLink="/tags"
      icon="🏷️"
    />
  );
};

export default TagPage;
