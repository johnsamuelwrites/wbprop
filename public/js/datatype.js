export const datatypeQuery = `
PREFIX wikibase: <http://wikiba.se/ontology#>
SELECT DISTINCT ?datatype (count(DISTINCT ?item) as ?count)
WHERE
{
    ?item wikibase:propertyType ?datatype.
}
GROUP by ?datatype
`;
