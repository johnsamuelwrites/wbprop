export const languageQuery = `
SELECT ?language (COUNT(DISTINCT ?property) AS ?count) WHERE {
    ?property rdf:type wikibase:Property;
      rdfs:label ?label.
    BIND(LANG(?label) AS ?language)
  }
  GROUP BY ?language
  ORDER BY DESC (?count)
  LIMIT 10
`;