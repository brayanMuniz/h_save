import EntityListPage from "./EntityListPage";

const AllCharactersPage = () => {
  return (
    <EntityListPage
      entityName="Character"
      entityNamePlural="Characters"
      listApiEndpoint="/api/characters"
      favoriteApiEndpointPrefix="/api/user/favorite/character"
      entityLinkPrefix="/character"
      icon="🧑‍🎤"
    />
  );
};

export default AllCharactersPage;
