import React from "react";
import EntityListPage from "./EntityListPage";

const AllParodiesPage = () => {
  return (
    <EntityListPage
      entityName="Parody"
      entityNamePlural="Parodies"
      listApiEndpoint="/api/parodies"
      favoriteApiEndpointPrefix="/api/user/favorite/parody"
      entityLinkPrefix="/parody"
      icon="🎭"
    />
  );
};

export default AllParodiesPage;
