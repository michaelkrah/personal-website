// d3Chart.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

function drawActivityChart(data, chartDataTime, chartOptionalData, containerId) {
    // Dimensions and margins
    if (!data || !chartDataTime || !containerId) {
        return;
    }

    const filteredData = data.filter(d => chartDataTime.includes(d.day));
    const backgroundData = chartDataTime.map(day => ({ day }));

    const container = d3.select(`#${containerId}`);
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;


    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    let dataColor = '#1db954';
    if (chartOptionalData) {
        dataColor = '#444444';
        chartOptionalData = chartOptionalData.filter(d => chartDataTime.includes(d.day));
    }

    // Days of the week
    const days = chartDataTime
    const tickValues = days.filter((_, index) => index % Math.ceil(days.length / 7) === 0);
    //#DA2020
    //#C1B691
    const entryValues = { 1: "#DAA520", 2: "#87CEFA", 3: "#C71010", 4: "#EA87FA", 5: "#6B8E23" };

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
        .call(d3.axisBottom(xScale).tickValues(tickValues))
        .style('font-size', '0.6em');

    svg.append('g')
        .call(d3.axisLeft(yScale))
        .style('font-size', '0.6em');
    // .call(g => g.select('.domain').remove());


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
        .style('fill', '#242424');

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