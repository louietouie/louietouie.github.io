
const MARGIN = { TOP: 20, RIGHT: 20, BOTTOM: 20, LEFT: 20 };
const WIDTH = 750;
const HEIGHT = 500;

var svg = d3.select("div#chart").append("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
    .append("g")
        // .attr("transform", "translate(" + MARGIN.LEFT + "," + margin.top + ")");

var sineData = d3.range(0, 2*Math.PI + 2*Math.PI/50, 2*Math.PI/50).map(d => [d, Math.sin(d)])
var cosineData = d3.range(0, 2*Math.PI, 2*Math.PI/50).map(d => [d, Math.cos(d)])
var sineLinearize = d3.range(Math.PI - 1.25, Math.PI + 2.5, 1.25).map(d => [d, -d+Math.PI])
var cosineLinearize = d3.range(Math.PI - 1.25, Math.PI + 2.5, 1.25).map(d => [d, -1])

console.log(cosineLinearize)

var xDomain = [0, 2 * Math.PI ]
var xRange = [MARGIN.LEFT, WIDTH - MARGIN.RIGHT]
var yDomain = [-1.25, 1.25]
var yRange = [HEIGHT - MARGIN.BOTTOM, MARGIN.TOP]
var x = d3.scaleLinear(xDomain, xRange).nice();
var y = d3.scaleLinear(yDomain, yRange).nice()

toPiUnits = (d) => {return d ? `\u03c0` : 0 } // ${round(d/Math.PI)}

// svg.selectAll("g.x-axis").data([null])
//     .join('g')
//     .attr('class', 'x-axis')
//     .attr("transform", `translate(0,${(HEIGHT)/2})`)
//     // .style("opacity", 0.5)
//     .style("font-size","30px")
//     .call(d3.axisBottom(x)
//         .tickValues([0, Math.PI])
//         .tickFormat(toPiUnits))
        
// svg.selectAll("g.y-axis").data([null])
//     .join('g')
//     .attr('class', 'y-axis')
//     .attr("transform", `translate(${(WIDTH)/2}, 0)`)
//     // .style("opacity", 0.5)
//     .call(d3.axisLeft(y).ticks(0))

const lineFunc = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]));

var lineContainer = svg.selectAll("g.line-container").data([null]).join('g')
    .attr('class', 'line-container')
    .attr('stroke-width', 4)
    .attr('fill', 'none')
    // .attr('opacity', 0.5)
    .attr('stroke', 'black')

svg.selectAll("line.y-mark").data([null]).join('line')
    .attr('class', 'y-mark')
    .attr("x1", x(Math.PI))
    .attr("y1", MARGIN.BOTTOM)
    .attr("x2", x(Math.PI))
    .attr("y2", HEIGHT-MARGIN.TOP)
    .style("stroke-width", 2)
    .style("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "2,4");

svg.selectAll("line.yz-mark").data([null]).join('line')
    .attr('class', 'yz-mark')
    .attr("x1", MARGIN.LEFT)
    .attr("y1", MARGIN.BOTTOM)
    .attr("x2", MARGIN.LEFT)
    .attr("y2", HEIGHT-MARGIN.TOP)
    .style("stroke-width", 2)
    .style("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "2,4");

svg.selectAll("text.z").data([null]).join("text")
    .attr("class", "z")
    .attr("x", x(Math.PI))
    .attr("y", HEIGHT - MARGIN.BOTTOM)
    .text('\u03c0')
    .attr('text-anchor', 'end')
    .style("font-size","30px")
    .attr('dx', -8);

svg.selectAll("text.p").data([null]).join("text")
    .attr("class", "p")
    .attr("x", MARGIN.LEFT)
    .attr("y", HEIGHT - MARGIN.BOTTOM)
    .text('0')
    .attr('text-anchor', 'start')
    .style("font-size","30px")
    .attr('dx', 8);

lineContainer.selectAll("path.sin").data([null])
    .join("path")
    .attr('class', 'sin')
    .attr('stroke', '#7297A0')
    .attr("d", lineFunc(sineData))
    .attr('opacity', 0.5)
    
lineContainer.selectAll("path.cos").data([null])
    .join("path")
    .attr('class', 'cos')
    .attr('stroke', '#A88C7D')
    .attr("d", lineFunc(cosineData))
    .attr('opacity', 0.5)

lineContainer.selectAll("path.sinlin").data([null])
    .join("path")
    .attr('class', 'sinlin')
    .attr("d", lineFunc(sineLinearize))
    .attr("stroke-dasharray", "10,5")
    .attr('stroke', '#e60706')
    .attr('opacity', 100);

lineContainer.selectAll("path.coslin").data([null])
    .join("path")
    .attr('class', 'coslin')
    .attr("d", lineFunc(cosineLinearize))
    .attr("stroke-dasharray", "10,5")
    .attr('stroke', '#e60706')
    .attr('opacity', 100);