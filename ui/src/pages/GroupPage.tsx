import EntityDetailPage from "./EntityDetailPage";

const GroupPage = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Group"
      entityTypePlural="Groups"
      paramName="group"
      apiEndpointPrefix="/api/group"
      favoriteApiEndpointPrefix="/api/user/favorite/group"
      detailsResponseKey="groupDetails"
      backLink="/groups"
      icon="👥"
    />
  );
};

export default GroupPage;
