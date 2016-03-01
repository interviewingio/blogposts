var chartWidth = 800;
var chartHeight = 500;
var margin = {
  top: 40, right: 60, bottom: 100, left: 90
}

var squareWidth = 15;
var squareHeight = 15;
var scale = 1.5;

// hover ranges
var ranges = {
  1: [1, 1.999],
  2: [2,2.9],
  3: [2.9, 3.5],
  4: [3.5, 4]
}

var colorScale = d3.scale.linear()
  .domain([1, 2, 3, 4])
  .range(["#ff0f5f", "#e63ba8", "#ba48d9", "#267fd3"])

d3.selectAll("span.score")
.style("color", function(d) {
  return colorScale(+this.innerHTML)
})
 .html(function(d) {
  var score = +this.innerHTML;
  return "<svg width=10 height=10><circle r=4 cx=5 cy=5 fill=" + colorScale(score) + "></circle></svg>" + score;
})


// https://github.com/iconic/open-iconic/blob/master/svg/person.svg
var personIcon = "M4 0c-1.1 0-2 1.12-2 2.5s.9 2.5 2 2.5 2-1.12 2-2.5-.9-2.5-2-2.5zm-2.09 5c-1.06.05-1.91.92-1.91 2v1h8v-1c0-1.08-.84-1.95-1.91-2-.54.61-1.28 1-2.09 1-.81 0-1.55-.39-2.09-1z"

var chart = d3.select("#chart")
var svg = d3.select("#chart").append("svg")
var chartg = svg.append("g");

chartg.append("rect").classed("range", true)

var meanLine = chartg.append("line").classed("mean-line", true)
  
var yScale = d3.scale.linear()

var xScale = d3.scale.linear()
  .domain([1, 4])

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

d3.json("/data/interviews.json", function(err, interviewees) {
  //console.log(interviewees)
  var matches = {};
  var meanData = []     ; interviewees.forEach(function(interview, index) {
    var mean = d3.mean(interview);
    var stddev = d3.deviation(interview);
    var points = interview.map(function(score,i) {
      return {
        score: score,
        mean: mean,
        index: index
      }
    })
    points.mean = mean;
    points.stddev = stddev;
    points.index = index;
    
    // we have several interviewees
    var key = (Math.floor(mean*1000)/1000) + "::" + (Math.floor(stddev*1000)/1000);
    
    var match = matches[key];
    if(!match) matches[key] = 0;
    matches[key] += 1;
    points.offset = matches[key];
    
    meanData.push(points)
  })
  
  var maxMean = d3.max(meanData, function(d) { return d.mean });
  //console.log("maxMean", maxMean)
  var maxStddev = d3.max(meanData, function(d) { return d.stddev });
  //console.log("maxStddev", maxStddev)
       
  yScale.domain([0, maxStddev])   


  var xAxis = d3.svg.axis()
  .scale(xScale)
  .orient("bottom")
  .tickValues([1,2,3,4])
  .tickFormat(d3.format(".0n"))
  
  var xg = chartg.append("g").classed("axis", true)
  .classed("xaxis", true)
  .call(xAxis)
  
  xg.selectAll(".tick")
  .on("mouseover", function(d) {
    highlightScoreRange(ranges[d][0], ranges[d][1])
  })
  .on("mouseout", function() {
    unfade();
    clearForce();
  }).style({
    cursor: "pointer"
  })
  .insert("circle", "line")
  .attr({
    cx: 0,
    cy: 16,
    r: 12,
    fill: function(d) { return colorScale(d)}
  })

  xg.selectAll(".tick").select("text")
  .attr({
    stroke: "#cfe0e7",    
    "paint-order":"stroke", 
    "stroke-width": 2,    
    "stroke-opacity": 1,    
    "stroke-linecap": "butt",   
    "stroke-linejoin": "miter"
  })

  var yAxis = d3.svg.axis()
  .scale(yScale)
  .orient("left")

  var yg = chartg.append("g").classed("axis", true)
  .classed("yaxis", true)
  
  var stdlabel = chartg.append("text").classed("label", true)
  .text("Standard Deviation of Technical Score")
  
  var meanlabel = chartg.append("text").classed("label", true)
  .text("Technical Score")


  function render() {
    console.log("render", chartWidth, chartHeight)

    yScale.range([chartHeight - margin.bottom, margin.top])
    xScale.range([margin.left, chartWidth - margin.right])

    chart.style({
      width: chartWidth + "px",
      height: chartHeight + "px"
    })

    //update axis
    xg.attr("transform", "translate(" + [0, chartHeight - margin.bottom + 10] + ")")
    .call(xAxis)
    yg.attr("transform", "translate(" + [margin.left - 20,-margin.top/2] + ")")
    .call(yAxis)
    stdlabel.attr("transform", "translate(" + [30, chartHeight/2 - margin.bottom/2] + ")rotate(-90)")
    meanlabel.attr("transform", "translate(" + [chartWidth/2 + margin.left/2, chartHeight - margin.bottom/2 + 5] + ")")

    
   /* meanLine
    .attr({
      x1: function(d) { return xScale(2.9)},
      y1: function(d) { return margin.top - 20},
      x2: function(d) { return xScale(2.9)},
      y2: function(d) { return chartHeight - margin.bottom + 10},
      stroke: "#d1d1d1",
      "stroke-dasharray": "4 4"
    })*/
    
    // Interviewees Scatter Plot --------------------------------
    var meanSquares = chartg.selectAll("g.mean")
      .data(meanData, function(d) { return d.index})
    var mse = meanSquares.enter().append("g").classed("mean", true)
    mse.append("rect")
    mse.append("path")

    meanSquares.attr({
      transform: function(d) {
        var off1 = d.offset % 3;
        off1 *= squareWidth;
        var off2 = Math.floor((d.offset-1)/3) * squareHeight;
        var x = xScale(d.mean) - off1 + squareWidth/2;
        var y = yScale(d.stddev) - squareHeight/2 - off2;
        return "translate(" + [x,y] + ")scale(" + scale + ")"
      },
    })
    meanSquares.select("rect")
    .attr({
      x: 0,
      y: 0,
      width: squareWidth/scale,
      height: squareHeight/scale,
      fill: "#fff",
      "fill-opacity": 0.5,
      
    })
    .on("click", function(d) {
      // console.log("clicked", d);
    }).on("mouseover", function(d) {
      // console.log(d.index, d.mean, d.stddev);
      fade();
      unfade(d);
      clearForce();
      addForceNodes(d);
    })
    .on("mouseout", function(d) {
      unfade();
      clearForce();
    })
    meanSquares.select("path")
      .attr({
      d: personIcon,
      "pointer-events": "none",
      fill: function(d) { return colorScale(d.mean)}
    })
    forceg.moveToFront();
  }      
  render(width, height);

  function resize() {
    var container = d3.select("#chart-container").node()
    var bbox = container.getBoundingClientRect();
    console.log("width", bbox.width)
    chartWidth = bbox.width;
    render();
  }
  d3.select(window).on("resize", resize);
  resize();
  // END OF THE d3.json call. everything depending on the data should be defined above this line
})


// HIGHLIGHTING FUNCTION
function clearHighlight() {
  unfade();
  clearForce();
}

var highlightAttr = {
  //opacity: 0.6,
  //fill: function(c) { return colorScale(c.mean)}
  fill: function(c) { return "#111"}
}

function highlightHighDeviation() {
  fade();
  clearForce();
  
  chartg.select("rect.range")
  .attr({
    x: margin.left - squareWidth*2,
    y: margin.top - squareHeight,
    width: chartWidth - margin.right - margin.left/2,
    height: yScale(0.6) - margin.top
  })
  
  chartg.selectAll("g.mean")
    .filter(function(d) { return d.stddev >= 0.6})
    .select("path")
    .attr(highlightAttr)
    .each(function(d){ 
      addForceNodes(d);
    })
}

function highlightLowDeviation() {
  fade();
  clearForce();
  
  chartg.select("rect.range")
  .attr({
    x: margin.left,
    y: yScale(0) - 50,
    width: chartWidth - margin.right - margin.left/2 - squareWidth,
    height: 60
  })
  
  chartg.selectAll("g.mean")
    .filter(function(d) { return d.stddev <= 0})
    .select("path")
    .attr(highlightAttr)
    .each(function(d){ 
      addForceNodes(d);
    })
}

function highlightAnyDeviation() {
  fade();
  clearForce();
  
  chartg.select("rect.range")
  .attr({
    x: margin.left - squareWidth/2,
    y: margin.top - squareHeight,
    width: chartWidth - margin.right - margin.left/2,
    height: yScale(0.15) - margin.top
  })
  
  chartg.selectAll("g.mean")
    .filter(function(d) { return d.stddev > 0})
    .select("path")
    .attr(highlightAttr)
    .each(function(d){ 
      addForceNodes(d);
    })
}


function highlightAll() {
  fade();
  clearForce();
  chartg.selectAll("g.mean")
    .select("path")
    .attr(highlightAttr)
    .each(function(d){ 
      addForceNodes(d);
    })
}

function highlightAtLeastOneScore(category, category2){
  fade();
  chartg.selectAll("g.mean")
  .filter(function(d) {
    var hasCat = false;
    var hasCat2 = false;
    d.forEach(function(i) {
      if(i.score == category) hasCat = true;
      if(i.score == category2) hasCat2 = true;
    })
    if(category2) return hasCat && hasCat2;
    return hasCat;
  })
  .select("path")
  .attr(highlightAttr)
    .each(function(d){ 
      addForceNodes(d);
    })
}

function highlightScoreRange(low, high){
  fade();
  
  chartg.select("rect.range")
  .attr({
    x: xScale(low),
    y: 10,
    width: xScale(high) - xScale(low),
    height: chartHeight - margin.bottom
  })
  
  chartg.selectAll("g.mean")
  .filter(function(d) {
    if(d.mean >= low && d.mean <= high) return true;
  })
  .select("path")
  .attr(highlightAttr)
    .each(function(d){ 
      addForceNodes(d);
    })
}


function unfade(d) {
  var selection = chartg.selectAll("g.mean")
  if(!d) {
    selection.select("path")
    .attr({
      opacity: 1,
      fill: function(c) { return colorScale(c.mean)}
    })
  } else {
  selection.filter(function(f) {
    if(f === d) {
        d3.select(this).select("path").attr({
          //opacity: 0.6,
          fill: function(c) { return colorScale(c.mean)}
        })
      }
    })
  }
}
function fade() {
  chartg.selectAll("g.mean").select("path").attr({
    fill: "#b7b7b7"
  })
}

// FORCE LAYOUT -----------------------------------
var xrange = xScale.range() 
var width = Math.abs(xrange[1] - xrange[0]);
var yrange = yScale.range();
var height = Math.abs(yrange[0] - yrange[1]);

var forceg = chartg.append("g")
.attr("transform", "translate(" + [0,0] + ")")

var force = d3.layout.force()
.size([width, height])
.gravity(0.0)
.friction(0.89)
.charge(-5)
.linkStrength(0)
.nodes([])
.links([])
force.start()

force.on("tick", function(e) {
  var k = 0.36 * e.alpha;
  var nodes = force.nodes();
  nodes.forEach(function(t,i) {
    t.x += (-t.x + t.targetX) * k;
    t.y += (-t.y + t.targetY) * k;
    if(t.interviewee){
      t.x = t.targetX + squareWidth/2;
      t.y = t.targetY;
    } 
  })
  forceg.selectAll("circle.node")
  .attr({
    cx: function(d) { return d.x  },
    cy: function(d) { return d.y  }
  })

  forceg.selectAll("line.link")
  .attr({
      x1: function(d) { return d.source.x },
      y1: function(d) { return d.source.y },
      x2: function(d) { return d.target.x },
      y2: function(d) { return d.target.y },
    })

})


function clearForce() {
  forceg.selectAll("circle.node")
    .remove();
  forceg.selectAll("line.link")
    .remove();

  force.links([])
  force.nodes([])
  
  chartg.select("rect.range").attr({
    width: 0, height: 0
  })
}

function addForceNodes(interviewee) {
  var nodes = force.nodes();
  var links = force.links();
  //console.log("links", links)

  var evenodd = interviewee.offset % 2
  var y = yScale(interviewee.stddev) - interviewee.offset * (1+squareHeight) - squareHeight/2
  var x = xScale(interviewee.mean) - squareWidth/2 + evenodd * squareWidth; 
  
  var off1 = interviewee.offset % 3;
  off1 *= squareWidth;
  var off2 = Math.floor((interviewee.offset-1)/3) * squareHeight;
  var x = xScale(interviewee.mean) - off1 + squareWidth/2;
  var y = yScale(interviewee.stddev) - squareHeight/2 - off2 + squareHeight/2;
  //console.log("X,Y", x,y)
  //generate links between mean "node" and
  var source = {
    index: interviewee.index,
    x: x,
    y: y,
    px: x,
    py: y,
    targetX: x,
    targetY: y,
    mean: interviewee.mean,
    stddev: interviewee.stddev,
    interviewee: true,
    opacity: 0,
  }
  nodes.push(source)

  interviewee.forEach(function(d,i) {
    var sx = x + 10 * Math.random() + Math.random();
    var sy = y + 10 * Math.random() + Math.random();
    var node = {
      index: interviewee.index + "-" + i,
      px: sx,
      py: sy,
      x: sx,
      y: sy,
      targetX: xScale(+d.score),
      targetY: y,
      mean: interviewee.mean
    }
    nodes.push(node)
    links.push({
      index: source.index + "-" + node.index,
      source: source,
      //source: 0,
      target: node
    })
  })

  var lines = forceg.selectAll("line.link")
    .data(links)
  lines.enter().append("line").classed("link", true)

  var circles = forceg.selectAll("circle.node")
    .data(nodes, function(d) { return d.index })
  circles.enter().append("circle").classed("node", true)

  circles.attr({
    "pointer-events": "none",
    r: 4,
    opacity: function(d) {
      if(d.opacity || d.opacity === 0) return d.opacity;
      return 1;
    },
    fill: function(d) { return colorScale(d.mean)}
  })

  force.links(links)
  force.nodes(nodes);
  force.start()

  circles.exit().remove();
}
