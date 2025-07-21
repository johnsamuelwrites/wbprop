export const propertyStatementQuery = `
SELECT ?property ?statementCount WHERE {
    ?property rdf:type wikibase:Property;
      wikibase:statements ?statementCount.
  }
  ORDER BY DESC (?statementCount)
  LIMIT 15
`;