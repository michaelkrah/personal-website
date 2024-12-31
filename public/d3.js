// d3Chart.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

function drawActivityChart(data, chartDataTime, chartOptionalData, containerId) {
    // Dimensions and margins
    if (!data || !chartDataTime || !containerId) {
        return;
    }

    const filteredData = data.filter(d => chartDataTime.includes(d.day));
    const backgroundData = chartDataTime.map(day => ({ day }));

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    let dataColor = '#1db954';
    if (chartOptionalData) {
        dataColor = '#444444';
        chartOptionalData = chartOptionalData.filter(d => chartDataTime.includes(d.day));
    }

    // Days of the week
    const days = chartDataTime
    const tickValues = days.filter((_, index) => index % Math.ceil(days.length / 7) === 0);

    const entryValues = { 1: "#DAA520", 2: "#800020", 3: "#D2B48C", 4: "#87CEFA", 5: "#6B8E23" };

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
        .call(d3.axisBottom(xScale).tickValues(tickValues));

    svg.append('g').call(d3.axisLeft(yScale));

    svg
        .selectAll('.background')
        .data(backgroundData)
        .enter()
        .append('rect')
        .attr('class', 'background')
        .attr('x', d => xScale(d.day))
        .attr('y', 0)
        .attr('height', height)
        .attr('width', xScale.bandwidth())
        .style('fill', '#292929');

    svg
        .selectAll('.bar')
        .data(filteredData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.day))
        .attr('y', d => yScale(d.start))
        .attr('height', d => yScale(d.end) - yScale(d.start))
        .attr('width', xScale.bandwidth())
        .style('fill', dataColor)

    if (chartOptionalData) {
        svg
            .selectAll('.optional-bar')
            .data(chartOptionalData)
            .enter()
            .append('rect')
            .attr('class', 'optional-bar')
            .attr('x', d => xScale(d.day))
            .attr('y', d => yScale(d.start))
            .attr('height', d => yScale(d.end) - yScale(d.start))
            .attr('width', xScale.bandwidth())
            .style('fill', d => entryValues[d.entry]);
    }
}

export { drawActivityChart };