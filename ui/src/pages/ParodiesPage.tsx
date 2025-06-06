import EntityListPage from "./EntityListPage";
import ParodyCard from "../components/ParodyCard";

const ParodiesPage = () => {
  return (
    <EntityListPage
      entityName="Parody"
      entityNamePlural="Parodies"
      listApiEndpoint="/api/parodies"
      favoriteApiEndpointPrefix="/api/user/favorite/parody"
      CardComponent={ParodyCard}
      icon="🎭"
    />
  );
};

export default ParodiesPage;
