import EntityListPage from "./EntityListPage";
import GroupCard from "../components/GroupCard";

const GroupsPage = () => {
  return (
    <EntityListPage
      entityName="Group"
      entityNamePlural="Groups"
      listApiEndpoint="/api/groups"
      favoriteApiEndpointPrefix="/api/user/favorite/group"
      CardComponent={GroupCard}
      icon="👥"
    />
  );
};

export default GroupsPage;
