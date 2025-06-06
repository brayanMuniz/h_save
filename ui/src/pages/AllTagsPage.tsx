import EntityListPage from "./EntityListPage";

const AllTagsPage = () => {
  return (
    <EntityListPage
      entityName="Tag"
      entityNamePlural="Tags"
      listApiEndpoint="/api/tags"
      favoriteApiEndpointPrefix="/api/user/favorite/tag"
      entityLinkPrefix="/tag"
      icon="🏷️"
    />
  );
};

export default AllTagsPage;
