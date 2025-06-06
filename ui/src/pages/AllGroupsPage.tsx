import EntityListPage from "./EntityListPage";

const AllGroupsPage = () => {
  return (
    <EntityListPage
      entityName="Group"
      entityNamePlural="Groups"
      listApiEndpoint="/api/groups"
      favoriteApiEndpointPrefix="/api/user/favorite/group"
      entityLinkPrefix="/group"
      icon="👥"
    />
  );
};

export default AllGroupsPage;
