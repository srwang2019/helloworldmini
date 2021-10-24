// global var 
var dataset;
var min_V, max_V, color;
var svg;

// works the same as d3.autotype (^ look at line 3)
// d3.csv parses strings as int when data get converted into objects
// the logic below changes string values back to it's original int type 
// so date functions like parseYear/Month can work
d3.csv("CityX_temp_monthly_final.csv", function (d) {
  d3.keys(d).forEach(function (e) {
    d[e] = +d[e]
  })
  return d;
}).then(function (d) {

  dataset = d

  // setup fill color
  // dynamically change value according to input dataset
  // did not want to hardcode the values the colours will be based on so decided to programatically retrive the max and min temps in the input dataset
  max_V = Math.max.apply(Math, d.map(function (o) { return o.max_temperature; }));
  min_V = Math.min.apply(Math, d.map(function (o) { return o.min_temperature; }));
  console.log(Math.ceil(max_V));
  console.log(Math.floor(min_V));

  // use magma sequential colour scheme to identify 2 diverging end points
  // note that the min value is floored and the max value is 'ceil-ed' so the legend scale will always be in between a nice intergers
  color = d3.scaleSequential(d3.interpolateMagma).domain([Math.floor(min_V), Math.ceil(max_V)]);

  // load Max chart automatically first
  makeChart('max');

}).catch(error => {
  console.log(error);
});


// Heatmap function
function makeChart(val) {
  
  console.log(val);
  d3.select("svg").remove();

  // change header
  var node = document.getElementById('title');
  if (val == 'max') {
    node.innerText = 'Monthly Average Max Temperature for City X';
  } else {
    node.innerText = 'Monthly Average Min Temperature for City X';
  }

  // setting margins
  // will be used throughout when defining scales and cells in the heatmap later
  // did not want to hardcode the values so sizes are mostly dependent on the range of years provided in the input dataset
  var margin = { top: 50, right: 70, bottom: 20, left: 75 },
    width = 850 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    fullWidth = width + margin.left + margin.right + 10,
    fullHeight = height + margin.top + margin.bottom + 40;
  var yearExtent = d3.extent(dataset, d => d.year);
  // console.log(yearExtent);
  var yearRangeLength = yearExtent[1] - yearExtent[0];
  var gridWidthSize = width / yearRangeLength;
  var gridHeightSize = height / 12;
  //console.log(gridWidthSize, gridHeightSize);

  // Since x range is the range of elements to which the domain can be mapped, the range should go from 0 to the end of the svg box (width or height)
  // Added some space between x and y axis so points to not overlap
  // used scaleTime instead of standard scaleLinear() taught in class so we can format the tick using parseYear and parseMonth
  var xScale = d3.
    scaleTime().
    domain(d3.extent(dataset, d => parseYear(d["year"]))).
    range([0, width]);

  var yExtent = d3.extent(dataset, d => parseMonth(d["month"]).getTime());
  var yRange = (yExtent[1] - yExtent[0]) * 0.05;
  var yScale = d3.
    scaleTime().
    domain([yExtent[0] - yRange, yExtent[1] + yRange]).
    range([0, height]);
  //console.log(yExtent[0], yScale);

  // update(data);

  // display the x asix and y axis based on the range and scales set above
  var xAxis = d3.axisBottom(xScale).ticks(15).tickFormat(formatYear);
  var yAxis = d3.axisLeft(yScale).tickFormat(formatMonth);

  // in the index.html file, note that there is a div section with id 'chart'
  // now, append the chart to that id so the heatmap will be displayed under that div
  // setting of svg properties and attributes
  // size and margins are what were defined above
  svg = d3.
    select(".chart").
    append("svg").
    attr("height", fullHeight).
    attr("width", fullWidth).
    append("g").
    attr("transform", `translate(${margin.left}, ${margin.top})`);

  // displaying the x axis and y axis
  svg.
    append("g").
    attr("class", "x-axis").
    style("font-size", "13px").
    attr("transform", `translate(20, ${height})`).
    call(xAxis);

  // text label for the x axis
  svg
    .append("text")
    .attr("class", "label")
    .attr("x", width / 2 + 10)
    .attr("y", height * 1.1)
    .attr("font-size", "1.3em")
    .style("text-anchor", "middle")
    .style('color', 'black')
    .text("Year");

  svg.
    append("g").
    attr("class", "y-axis").
    style("font-size", "13px").
    attr("transform", `translate(0, 0)`).
    call(yAxis);

  // text label for the y axis
  // inform the user that the y axis are displaying months
  svg.
    append("text").
    attr("transform", "rotate(-90)").
    attr("y", - margin.left - 25).
    attr("x", - height / 2).
    attr("dy", "2em").
    style("text-anchor", "middle").
    style("font-size", "1.2em").
    text("Months");

  // create tooltip and set it's class, attributes styles
  if (val == "max") {
    var tip = d3.
      tip().
      attr("class", "tooltip").
      attr("id", "tooltip").
      offset([-10, 0]).
      html(d => {
        d3. // adding dynamic functions to the tooltip to display the required values
          select("#tooltip").
          attr("data-year", d.year).
          attr("data-month", d.month).
          attr("data-temp", d.max_temperature);
        return `<p><strong>${formatMonth(parseMonth(d.month))} ${d.year} </strong>
      </p><p>Avg Temp: ${d.max_temperature} °C</p>`;
      });
    //      console.log(tip);
    // appending the created tooltip to svg
    svg.call(tip);
    svg.
      selectAll(".cell").
      data(dataset).
      enter().
      append("rect").
      attr("x", d => xScale(parseYear(d.year)) + 5).
      attr("y", d => yScale(parseMonth(d.month)) - 20).
      attr("class", "cell").
      attr("width", gridWidthSize).
      attr("height", gridHeightSize).
      attr("data-year", d => d.year)
      // must be between 0 and 11 (because months are from Jan to Dec, 1 to 12 but in index form it will be 0 to 11)
      .attr("data-month", d => d.month - 1).
      attr("data-temp", d => d.max_temperature).
      style("fill", d => {
        var temp = parseFloat(d.max_temperature);
        return color(temp);
      })

      //Show and hide tip on mouse events
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

  } else {
    var tip = d3.
      tip().
      attr("class", "tooltip").
      attr("id", "tooltip").
      offset([-10, 0]).
      html(d => {
        d3. // adding dynamic functions to the tooltip to display the required values
          select("#tooltip").
          attr("data-year", d.year).
          attr("data-month", d.month).
          attr("data-temp", d.min_temperature);
        return `<p><strong>${formatMonth(parseMonth(d.month))} ${d.year} </strong>
      </p><p>Avg Temp: ${d.min_temperature} °C</p>`;
      });
    //      console.log(tip);
    // appending the created tooltip to svg
    svg.call(tip);
    svg.
      selectAll(".cell").
      data(dataset).
      enter().
      append("rect").
      attr("x", d => xScale(parseYear(d.year)) + 5).
      attr("y", d => yScale(parseMonth(d.month)) - 20).
      attr("class", "cell").
      attr("width", gridWidthSize).
      attr("height", gridHeightSize).
      attr("data-year", d => d.year)
      // must be between 0 and 11 (because months are from Jan to Dec, 1 to 12 but in index form it will be 0 to 11)
      .attr("data-month", d => d.month - 1).
      attr("data-temp", d => d.min_temperature).
      style("fill", d => {
        var temp = parseFloat(d.min_temperature);
        return color(temp);
      })

      //Show and hide tip on mouse events
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);
  }

  // draw legend
  legend(width);

};

// draw legend
function legend(width) {
  // adjust text size to ensure that the labels are not cluttered / spaced out appropriately
  // adjust the margins and cell sizesfor similar reasons 
  svg.
    append("g").
    attr("id", "legend").
    style("font-size", "12px").
    attr("transform", `translate(${width - 325},-40)`);

  let legendLinear = d3.
    legendColor().
    shapeWidth(25).
    cells(12).
    orient("horizontal").
    labelAlign("middle").
    scale(color);

  svg.select("#legend").call(legendLinear);

}