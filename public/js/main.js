// public/js/main.js

// Import D3.js
import * as d3 from 'd3';

import { propertyClassQuery } from './propertyclass.js';
import { projectQuery } from './wikiproject.js';
import { datatypeQuery } from './datatype.js';
import { languageQuery } from './language.js';
import { propertyStatementQuery } from './property.js';

const ENDPOINT_URL = 'https://query.wikidata.org/sparql';

const HEADERS = {
    'Accept': 'application/sparql-results+json',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
};

/**
 * Generic fetcher for SPARQL queries.
 * @param {string} query - The SPARQL query string.
 * @param {Function} mapFn - Function to map each result row to {label, value}.
 * @param {string} errorMessage - Custom error message for logging.
 * @returns {Promise<Array<{label: string, value: number}>>}
 */
async function fetchSPARQLData(query, mapFn, errorMessage) {
    try {
        const response = await fetch(ENDPOINT_URL, {
            method: 'POST',
            headers: HEADERS,
            body: `query=${encodeURIComponent(query)}`
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results.bindings.map(mapFn);
    } catch (error) {
        console.error(errorMessage, error);
        return [];
    }
}

/**
 * Utility to extract the last part of a URI.
 * @param {string} uri 
 * @returns {string}
 */
const extractFragment = (uri) => uri?.split('/').pop() || "None";

/** --- Specific data fetchers below --- **/

export function fetchDatatypeData() {
    return fetchSPARQLData(datatypeQuery, d => ({
        label: extractFragment(d.datatype.value),
        value: +d.count.value
    }), "Error fetching datatype data:");
}

export function fetchPropertyData() {
    return fetchSPARQLData(propertyClassQuery, d => ({
        label: extractFragment(d.property?.value),
        value: +d.count.value
    }), "Error fetching property data:");
}

export function fetchProjectPropertyData() {
    return fetchSPARQLData(projectQuery, d => ({
        label: d.projectLabel.value,
        value: +d.count.value
    }), "Error fetching project property data:");
}

export function fetchLanguageData() {
    return fetchSPARQLData(languageQuery, d => ({
        label: d.language.value,
        value: +d.count.value
    }), "Error fetching language data:");
}

export function fetchPropertyStatementData() {
    return fetchSPARQLData(propertyStatementQuery, d => ({
        label: extractFragment(d.property?.value),
        value: +d.statementCount.value
    }), "Error fetching property statement data:");
}

/**
 * Renders an animated, responsive D3.js bar chart.
 * @param {string} containerId The ID of the container element (e.g., 'd3-chart').
 * @param {Array<Object>} data Array of objects with 'label' and 'value' keys.
 * @param {string} chartTitle Chart heading.
 */
export async function renderBarChart(containerId, data, chartTitle) {
    const container = d3.select(`#${containerId}`);
    const containerNode = container.node();

    if (!containerNode) {
        console.error(`Container with ID #${containerId} not found.`);
        return;
    }

    if (data.length === 0) {
        container.html(`<p class="text-red-600 font-semibold">🚫 No data available for "${chartTitle}".</p>`);
        return;
    }

    // Sort data descending
    data.sort((a, b) => b.value - a.value);

    const containerWidth = containerNode.getBoundingClientRect().width;
    const margin = { top: 50, right: 30, bottom: 140, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear previous chart
    container.select("svg").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto")
        .style("background-color", "#F3F4F6") // uniform light background
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold")
        .style("fill", "#1F2937")
        .style("opacity", 0)
        .transition()
        .duration(800)
        .style("opacity", 1)
        .text(chartTitle);

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.2)
        .domain(data.map(d => d.label));

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.value)]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "0.75rem")
        .style("fill", "#4B5563");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .style("font-size", "0.75rem")
        .style("fill", "#4B5563");

    // Tooltip
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(31, 41, 55, 0.9)")
            .style("color", "#fff")
            .style("padding", "0.5rem 0.75rem")
            .style("border-radius", "0.375rem")
            .style("pointer-events", "none")
            .style("font-size", "0.875rem")
            .style("opacity", 0);
    }

    // Bars with animation
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .style("fill", "#3B82F6")
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget).style("fill", "#2563EB");
            tooltip.transition().duration(200).style("opacity", 0.95);
            tooltip.html(`<strong>${d.label}</strong><br/>Value: ${d.value}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).style("fill", "#3B82F6");
            tooltip.transition().duration(400).style("opacity", 0);
        })
        .transition()
        .duration(800)
        .delay((_, i) => i * 50)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value));

    // Labels on bars
    svg.selectAll(".bar-label")
        .data(data)
        .enter().append("text")
        .attr("x", d => x(d.label) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 8)
        .attr("text-anchor", "middle")
        .style("font-size", "0.75rem")
        .style("font-weight", "600")
        .style("fill", "#111827")
        .style("opacity", 0)
        .text(d => d.value)
        .transition()
        .duration(800)
        .delay((_, i) => i * 50)
        .style("opacity", 1);

    // Debounced resize handler
    function debounce(fn, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    // Resize listener per chart
    if (!window._chartResizeListeners) {
        window._chartResizeListeners = new Map();
    }
    const oldListener = window._chartResizeListeners.get(containerId);
    if (oldListener) {
        window.removeEventListener('resize', oldListener);
    }
    const newListener = debounce(() => renderBarChart(containerId, data, chartTitle), 200);
    window._chartResizeListeners.set(containerId, newListener);
    window.addEventListener('resize', newListener);
}
