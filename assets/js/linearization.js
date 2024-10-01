
const MARGIN = { TOP: 20, RIGHT: 20, BOTTOM: 20, LEFT: 20 };
const WIDTH = 750;
const HEIGHT = 500;

var svg = d3.select("div#chart").append("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
    .append("g")
        // .attr("transform", "translate(" + MARGIN.LEFT + "," + margin.top + ")");

var sineData = d3.range(-2*Math.PI, 2*Math.PI + 2*Math.PI/50, 2*Math.PI/50).map(d => [d, Math.sin(d)])
var cosineData = d3.range(-2*Math.PI, 2*Math.PI, 2*Math.PI/50).map(d => [d, Math.cos(d)])
var sineLinearize = d3.range(Math.PI - 1, Math.PI + 2, 1).map(d => [d, -d+Math.PI])
var cosineLinearize = d3.range(Math.PI - 1, Math.PI + 2, 1).map(d => [d, -1])

console.log(cosineLinearize)

var xDomain = [-2 * Math.PI, 2 * Math.PI ]
var xRange = [MARGIN.LEFT, WIDTH - MARGIN.RIGHT]
var yDomain = [-1.25, 1.25]
var yRange = [HEIGHT - MARGIN.BOTTOM, MARGIN.TOP]
var x = d3.scaleLinear(xDomain, xRange).nice();
var y = d3.scaleLinear(yDomain, yRange).nice()

toPiUnits = (d) => {return d ? `\u03c0` : 0 } // ${round(d/Math.PI)}

svg.selectAll("g.x-axis").data([null])
    .join('g')
    .attr('class', 'x-axis')
    .attr("transform", `translate(0,${(HEIGHT)/2})`)
    .style("opacity", 0.5)
    .style("font-size","30px")
    .call(d3.axisBottom(x)
        .tickValues([0, Math.PI])
        .tickFormat(toPiUnits))
        
svg.selectAll("g.y-axis").data([null])
    .join('g')
    .attr('class', 'y-axis')
    .attr("transform", `translate(${(WIDTH)/2}, 0)`)
    .style("opacity", 0.5)
    .call(d3.axisLeft(y).ticks(0))

const lineFunc = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]));

var lineContainer = svg.selectAll("g.line-container").data([null]).join('g')
    .attr('class', 'line-container')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('stroke', 'black')

lineContainer.selectAll("path.sin").data([null])
    .join("path")
    .attr('class', 'sin')
    .attr("d", lineFunc(sineData))
    
lineContainer.selectAll("path.cos").data([null])
    .join("path")
    .attr('class', 'cos')
    .attr("d", lineFunc(cosineData));

lineContainer.selectAll("path.sinlin").data([null])
    .join("path")
    .attr('class', 'sinlin')
    .attr("d", lineFunc(sineLinearize));

lineContainer.selectAll("path.coslin").data([null])
    .join("path")
    .attr('class', 'coslin')
    .attr("d", lineFunc(cosineLinearize));