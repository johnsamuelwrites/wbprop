export const projectQuery = `
        SELECT ?projectLabel (COUNT(DISTINCT ?property) AS ?count) WHERE {
            ?property rdf:type wikibase:Property;
              wdt:P5008 ?project.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en". }
        }
        GROUP BY ?projectLabel
        ORDER BY DESC (?count)
        LIMIT 20
    `;
