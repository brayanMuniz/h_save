import EntityListPage from "./EntityListPage";
import CharacterCard from "../components/CharacterCard";

const CharactersPage = () => {
  return (
    <EntityListPage
      entityName="Character"
      entityNamePlural="Characters"
      listApiEndpoint="/api/characters"
      favoriteApiEndpointPrefix="/api/user/favorite/character"
      CardComponent={CharacterCard}
      icon="🧑‍🎤"
    />
  );
};

export default CharactersPage;
