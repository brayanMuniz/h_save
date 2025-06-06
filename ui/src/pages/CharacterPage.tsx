import EntityDetailPage from "./EntityDetailPage";

const CharacterPage = () => {
  return (
    <EntityDetailPage
      entityTypeSingular="Character"
      entityTypePlural="Characters"
      paramName="character"
      apiEndpointPrefix="/api/character"
      favoriteApiEndpointPrefix="/api/user/favorite/character"
      detailsResponseKey="characterDetails"
      backLink="/characters"
      icon="🧑‍🎤"
    />
  );
};

export default CharacterPage;
