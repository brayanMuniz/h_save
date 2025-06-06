import React from "react";
import EntityListPage from "./EntityListPage";
import TagCard from "../components/TagCard";

const TagsPage = () => {
  return (
    <EntityListPage
      entityName="Tag"
      entityNamePlural="Tags"
      listApiEndpoint="/api/tags"
      favoriteApiEndpointPrefix="/api/user/favorite/tag"
      CardComponent={TagCard}
      icon="🏷️"
    />
  );
};

export default TagsPage;
