// d3Chart.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';


export function drawActivityChart(data, chartDataTime, containerId) {
    // Dimensions and margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Days of the week
    const days = chartDataTime

    // Create scales
    const xScale = d3
        .scaleBand()
        .domain(days)
        .range([0, width])
        .padding(0.1);

    const yScale = d3
        .scaleLinear()
        .domain([0, 24]) 
        .range([0, height]);

    // Create an SVG container
    const svg = d3
        .select(`#${containerId}`)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw axes
    svg
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append('g').call(d3.axisLeft(yScale));


    svg
        .selectAll('.background')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'background')
        .attr('x', d => xScale(d.day))
        .attr('y', 0)
        .attr('height', height)
        .attr('width', xScale.bandwidth())
        .style('fill', '#333'); 

        svg
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.day))
        .attr('y', d => yScale(d.start))
        .attr('height', d => yScale(d.end) - yScale(d.start))
        .attr('width', xScale.bandwidth())
        .style('fill', '#1db954')
}