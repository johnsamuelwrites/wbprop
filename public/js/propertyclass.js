export const propertyClassQuery = `
SELECT ?property (count(DISTINCT ?item) as ?count) WHERE {
    {
        ?item wdt:P1963 [].
    }
    UNION
    {
        ?property a wikibase:Property;
                  (wdt:P31|wdt:P279) ?item.
    }
}
GROUP by ?property
ORDER BY DESC(?count)
LIMIT 20
`;