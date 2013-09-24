//draws a line graph; catch-all function at the moment
function draw(data, container, format, smoothen) {
	var from=0,
		to=data.json_data.length,
		x_axis_format = "%b";

	//ok so here's the change now
	//see what the selected time period is and splice the data array accordingly
	if(selectedTimePeriod == 1) { from=data.json_data.length-30; x_axis_format= "%b %e"; }
	else if(selectedTimePeriod == 3) { from=data.json_data.length-90; }
	else if(selectedTimePeriod == 6) { from=data.json_data.length-180; }

	//splice our array per the chosen time period
	data.json_data.splice(0,from);

	//smoothen adi data
	if(smoothen && selectedTimePeriod != 1) { //don't smooth for 1 month
		var data_ = new Object({json_data: new Array(), version: "all"});

		var avg=0, sum=0, smooth_every_n=7;
		for(var i=0;i<data.json_data.length;i++) {
			//sum += data.json_data[i].count;
			//console.log(selectedRegion);
			if(selectedRegion != "") {
	    		sum += eval("data.json_data[i].regions[0]."+selectedRegion);
	    	}
	    	else if(countries_str != "All") {
	    		//below line is if we're only allowing single country selections
	    		//sum += eval("data.json_data[i].countries[0]."+countries_str);
	    		//in case of multiple countries, we explode countries_str on "," and sum the counts for all
				var exploded_countries = countries_str.split(",");
				var sum_countries_count = 0;
				for(var j=0;j<exploded_countries.length;j++) {
					//console.log("data.json_data[i].countries[0]."+exploded_countries[j]);
					//console.log(eval("data.json_data[i].countries[0]."+exploded_countries[j]));
					sum_countries_count += eval("data.json_data[i].countries[0]."+exploded_countries[j]);
					//console.log(j + " :: sum_countries_count is " + sum_countries_count);
				}
			
				sum += sum_countries_count;
	    	}
	    	else {
				sum += data.json_data[i].count;
			}

			//avg each 7 data points
			if(i != 0 && i % 7 == 0) {
				avg = sum / 7;
				sum = 0;

				//push the element into new array
				//averaged value always goes in count regardless of whether we're showing data for all or region
				data_.json_data.push(new Object({date: data.json_data[i-3].date, count: avg, regions: data.json_data[i-3].regions, countries: data.json_data[i-3].countries}));
			}
		}
		
		data = data_;
	}

	//update date formats
	$.each(data.json_data, function(i, value) {
		data.json_data[i].date = +new Date(value.date);
	});
	
	//if we have a region, update counts so that we can continue to use d.count below
	if(selectedRegion != "") {
		$.each(data.json_data, function(i, value) {
			data.json_data[i].count = eval("value.regions[0]."+selectedRegion);
		});
	}
	//if we have a country, update counts so that we can continue to use d.count below
	else if(countries_str != "All") {
		$.each(data.json_data, function(i, value) {
			//in case of multiple countries, we explode countries_str on "," and sum the counts for all
			var exploded_countries = countries_str.split(",");
			var sum_countries_count = 0;
			for(var j=0;j<exploded_countries.length;j++) {
				sum_countries_count += eval("value.countries[0]."+exploded_countries[j]);
			}
			
			data.json_data[i].count = sum_countries_count;
			//console.log("sum is " + sum_countries_count);
			
			//below line is if we're only allowing a single country to be selected
			//data.json_data[i].count = eval("value.countries[0]."+countries_str);
		});
	}
	
	var w = 250,
		h = 130,
		xPadding = 22,
		yPadding = 30,
		enter_animation_duration = 600;
	
	//we always use the div within the container for placing the svg
	container += " div";
	
	//for clarity, we reassign
	var which_metric = container;
	
    //d = d.sort(function(a,b) {return a[0]-b[0]});
    
    //prepare our scales and axes
    var xMax = d3.max(data.json_data, function(d) { return d.date; }),
	    xMin = d3.min(data.json_data, function(d) { return d.date; }),
	    yMin = d3.min(data.json_data, function(d) { return d.count; }),
        yMax = d3.max(data.json_data, function(d) { return d.count; });

   	var xScale = d3.time.scale()
            .domain([xMin, xMax])
            .range([xPadding+16, w-xPadding]);
            
    var yScale = d3.scale.linear()
            .domain([0, yMax])
            .range([h-yPadding+2, yPadding-6]);
            
    var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickFormat(d3.time.format(x_axis_format))
            .ticks(3);
            
	var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickFormat(d3.format(format)) //so e.g. convert 4,000,000 to 4M
            .ticks(3);
            
    //draw svg
	var svg = d3.select(container)
            .append("svg")
            .attr("width", w)
            .attr("height", h);
    
	//draw x axis
	var xAxis = svg.append("g")
    	.attr("class", "axis x")
	    .attr("transform", "translate(0," + (h-xPadding-3) + ")")
    	.call(xAxis);
    	    	
	//draw y axis
	svg.append("g")
    	.attr("class", "axis y")
	    .attr("transform", "translate(" + (yPadding+10) + ",0)")
    	.call(yAxis);
    	
    //draw extended ticks (horizontal)
    var ticks = svg.selectAll('.ticky')
    		.data(yScale.ticks(6))
    		.enter()
    			.append('svg:g')
    			.attr('transform', function(d) {
      				return "translate(0, " + (yScale(d)) + ")";
    			})
    			.attr('class', 'ticky')
    		.append('svg:line')
    			.attr('y1', 0)
    			.attr('y2', 0)
    			.attr('x1', yPadding+6)
    			.attr('x2', w-yPadding+8);
    
    //draw left y-axis
    svg.append('svg:line')
    	.attr('x1', yPadding+6)
    	.attr('x2', yPadding+6)
    	.attr('y1', yPadding-14)
    	.attr('y2', h-xPadding);
    
    //extended ticks (vertical)
    /*ticks = svg.selectAll('.tickx')
    	.d(xScale.ticks(10))
    	.enter()
    		.append('svg:g')
    			.attr('transform', function(d, i) {console.log(xScale(d));
				    return "translate(" + xScale(d) + ", 0)";
			    })
			    .attr('class', 'tickx');*/
	
	//draw y ticks
    ticks.append('svg:line')
    	.attr('y1', h-xPadding)
    	.attr('y2', xPadding)
    	.attr('x1', 0)
    	.attr('x2', 0);

    //y labels
    /*ticks
    	.append('svg:text')
    		.text(function(d) {
				return d;
			})
		.attr('text-anchor', 'bottom')
		.attr('dy', 125)
		.attr('dx', -4);
	*/

	//draw the line
	var line = d3.svg.line()
		.x(function(d){ return xScale(d.date); })
		.y(function(d){
			if(isNaN(d.count)) return 0;
			return yScale(d.count);
		})
		.interpolate("basis");
		
	var flat_line = d3.svg.line()
		.x(function(d){ return xScale(d.date)})
		.y(function(d){
			if(isNaN(d3.min(data.json_data).count)) return 0;
			return yScale(d3.min(data.json_data).count)
		})
		.interpolate("basis");

	var paths = svg.append("svg:path")
	    	.attr('d', flat_line(data.json_data))      
    		.attr("class", "the_glorious_line default_path_format")
    		.transition()
	    		.duration(1000)
	    		.attr("d", line(data.json_data));  	

	//draw points
	var circle = svg.selectAll("circle")
   		.data(data.json_data)
   		.enter()
   			.append("circle")
   			.attr('class','point')
   			.attr('opacity', 0)
   			.attr("cx", function(d) {
        		return xScale(d.date);
   			})
   			.attr("cy", function(d) {
				if(isNaN(d.count)) return 0;
				return yScale(d.count);
			})
   			.transition()
   			.delay(function(d,i) { return i / data.json_data.length * enter_animation_duration})
   			.attr("r", 4)
   			.each(function(d, i) {
					//a transparent copy of each rect to make it easier to hover over rects
					svg.append('rect')
		    			.attr('shape-rendering', 'crispEdges')
		    			.style('opacity', 0)
			    		.attr('x', function() { return xScale(d.date); })
    					.attr('y', 10)
	    				.attr("class", "trans_rect")
		    			.attr("display", function() {
		    				if(d == 0) {
	    						return "none";
	    					}
		    			})
    					.attr('shape-rendering', 'crispEdges')
	    				.attr('width', function() {
	    					return (w)/data.json_data.length;
			    		})
				    	.attr('height', 120) //height of transparent bar
				    	.on('mouseover.tooltip', function() {
							d3.selectAll(".tooltip").remove(); //timestamp is used as id
							d3.select(which_metric + " svg")
								.append("svg:rect")					
									.attr("width", 40)
									.attr("height", 15)
									.attr("x", xScale(d.date)-22)
									.attr("y", function() {
										if(isNaN(d.count)) return 0;
										return yScale(d.count)-25;
									})
									.attr("class", "tooltip_box");
						
							d3.select(which_metric + " svg")
								.append("text")
									.text(function() { return getHumanSize(d.count); })					
									.attr("x", xScale(d.date))
									.attr("y", function() { return yScale(d.count)-13; })
									.style("cursor", "default")
									.attr("dy", "0.35m")
									.attr("text-anchor", "middle")
									.attr("class", "tooltip");
								})
								.on('mouseout.tooltip', function() {
									d3.select(".tooltip_box").remove();
									d3.select(".tooltip")
										.transition()
										.duration(200)
										.style("opacity", 0)
										.attr("transform", "translate(0,-10)")
										.remove();
								});
				});
   			
	/*svg.selectAll("circle")
		.on('mouseover.tooltip', function(d) {
			d3.selectAll(".tooltip").remove(); //timestamp is used as id
			d3.select(which_metric + " svg")
				.append("svg:rect")
					.attr("width", 40)
					.attr("height", 15)
					.attr("x", xScale(d.date)-22)
					.attr("y", function() { return yScale(d.count)-25; })
					.attr("class", "tooltip_box");
						
			d3.select(which_metric + " svg")
				.append("text")
					.text(function() { return getHumanSize(d.count); })
					.attr("x", xScale(d.date))
					.attr("y", function() { return yScale(d.count)-13; })
					.attr("id", d.date)
					.attr("dy", "0.35m")
					.attr("text-anchor", "middle")
					.attr("class", "tooltip");
		})
		.on('mouseout.tooltip', function(d) {
			d3.select(".tooltip_box").remove();
			d3.select(".tooltip")
				.transition()
				.duration(200)
				.style("opacity", 0)
				.attr("transform", "translate(0,-10)")
				.remove();
		})
		.on('mouseover', function(d) {				
			d3.select(this)
				.transition()
		    	.attr('r', 9);
		}).on('mouseout', function() {
      		d3.select(this)
				.transition()
			   	.attr('r', 4);
      	})
		.append("text")
			.text(function(d) {
		    	return d.count;
		})
		.attr('class', 'line_label')
		.attr("x", function(d) {
   			return xScale(d.date)-5;
		})
		.attr("y", function(d) { return yScale(d.count); });
		*/
}


//draws a set of line graphs
//todo: remove count/100 when final data is received
function drawMultipleLinesChart(data, container, format) {
	//TODO: get min/max out of all versions (hopefully, do it in a scalable way)
    var xMax = 0,
	    xMin = 0,
	    yMin = 0,
        yMax = 0,
        from=0,
		to=data.json_data.length,
		x_axis_format = "%b";
        
    //ok so here's the change now
	//see what the selected time period is and splice the data array accoringly
	if(selectedTimePeriod == 1) { from=data.json_data[0].json_data.length-30; x_axis_format= "%b %e"; }
	else if(selectedTimePeriod == 3) { from=data.json_data[0].json_data.length-90; }
	else if(selectedTimePeriod == 6) { from=data.json_data[0].json_data.length-180; }
	
	//console.log(from);
	
	//update dates (this is not needed if dates are received as timestamps)
	$.each(data.json_data, function(index_outer, value_outer) {
		//console.log("value outer (fx version): ");console.log(value_outer);
		$.each(value_outer.json_data, function(index_inner, value_inner) {
			//console.log("value inner (a data point for this version): ");console.log(value_inner);
			value_outer.json_data[index_inner].date = +new Date(value_inner.date);
		});
		
		//splice our array per the chosen time period
		value_outer.json_data.splice(0,from);
	});
	
	//if we have a region, update counts so that we can continue to use d.count below
	if(selectedRegion != "") {
		$.each(data.json_data, function(index_outer, value_outer) {
			//console.log("value outer (fx version): ");console.log(value_outer);
			$.each(value_outer.json_data, function(index_inner, value_inner) {
				//value_outer.json_data[index_inner].count = eval("value_inner.regions[0]."+selectedRegion);
				
				//multiply count by regional percentage
				var percentage_of_users_in_region_on_this_version = (eval("value_inner.regions[0]."+selectedRegion)/100) * (value_outer.json_data[index_inner].count/100)*100;
				value_outer.json_data[index_inner].count = percentage_of_users_in_region_on_this_version;
			});
		});
	}
	//if we have a country, update counts so that we can continue to use d.count below
	else if(countries_str != "All") {
		$.each(data.json_data, function(index_outer, value_outer) {
			$.each(value_outer.json_data, function(index_inner, value_inner) {				
				//below two lines are if we're only allowing a single country to be selected
				//multiply count by co percentage
				//var percentage_of_users_in_region_on_this_version = (eval("value_inner.countries[0]."+countries_str)/100) * (value_outer.json_data[index_inner].count/100)*100;
				//value_outer.json_data[index_inner].count = percentage_of_users_in_region_on_this_version;

				//in case of multiple countries, we explode countries_str on "," and sum the counts for all
				var exploded_countries = countries_str.split(",");
				var sum_countries_count = 0;
				for(var i=0;i<exploded_countries.length;i++) {
					//console.log((eval("value_inner.countries[0]."+exploded_countries[i])/100) * (value_outer.json_data[index_inner].count/100)*100);
					sum_countries_count += (eval("value_inner.countries[0]."+exploded_countries[i])/100) * (value_outer.json_data[index_inner].count/100)*100;
				}
			
				//console.log(sum_countries_count);
				
				//data.json_data[i].count = sum;
				value_outer.json_data[index_inner].count = sum_countries_count;
			});
		});
	}
	
	//get min/max for x/y for all versions
	$.each(data.json_data, function(index_outer, value_outer) {
		var xMaxThisVersion = d3.max(value_outer.json_data, function(d) { return d.date; });	
    	xMax = (xMaxThisVersion > xMax) ? xMaxThisVersion : xMax;
    	
    	var xMinThisVersion = d3.min(value_outer.json_data, function(d) { return d.date; });	
    	xMin = (xMinThisVersion < xMin || xMin == 0) ? xMinThisVersion : xMin;
    	
    	var yMaxThisVersion = d3.max(value_outer.json_data, function(d) { return d.count/100; });	
    	yMax = (yMaxThisVersion > yMax) ? yMaxThisVersion : yMax;
    	
    	var yMinThisVersion = d3.min(value_outer.json_data, function(d) { return d.count/100; });	
    	yMin = (yMinThisVersion < yMin || yMin == 0) ? yMinThisVersion : yMin;
	}); 
	
	var w = 250,
		h = 130,
		xPadding = 22,
		yPadding = 30,
		enter_animation_duration = 600;
	
	//we always use the div within the container for placing the svg
	container += " div";
	
	//for clarity, we reassign
	var which_metric = container;
	
    //d = d.sort(function(a,b) {return a[0]-b[0]});
    
    //prepare our scales and axes
   	var xScale = d3.time.scale()
            .domain([xMin, xMax])
            .range([xPadding+15, w-xPadding]);
            
    var yScale = d3.scale.linear()
            .domain([yMin, yMax])
            .range([h-yPadding+2, yPadding-6]);
            
    var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickFormat(d3.time.format(x_axis_format))
            .ticks(3);
            
	var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickFormat(d3.format(format)) //so e.g. convert 4,000,000 to 4M
            .ticks(3);
            
    //draw svg
	var svg = d3.select(container)
            .append("svg")
            .attr("width", w)
            .attr("height", h);
    
	//draw x axis
	var xAxis = svg.append("g")
    	.attr("class", "axis x")
	    .attr("transform", "translate(0," + (h-xPadding-3) + ")")
    	.call(xAxis);
    	    	
	//draw y axis
	svg.append("g")
    	.attr("class", "axis y")
	    .attr("transform", "translate(" + (yPadding+10) + ",0)")
    	.call(yAxis);
    	
    //draw extended ticks (horizontal)
    var ticks = svg.selectAll('.ticky')
    		.data(yScale.ticks(6))
    		.enter()
    			.append('svg:g')
    			.attr('transform', function(d) {
      				return "translate(0, " + (yScale(d)) + ")";
    			})
    			.attr('class', 'ticky')
    		.append('svg:line')
    			.attr('y1', 0)
    			.attr('y2', 0)
    			.attr('x1', yPadding+6)
    			.attr('x2', w-yPadding+8);
    
    //draw left y-axis
    svg.append('svg:line')
    	.attr('x1', yPadding+6)
    	.attr('x2', yPadding+6)
    	.attr('y1', yPadding-14)
    	.attr('y2', h-xPadding);
    
    //extended ticks (vertical)
    /*ticks = svg.selectAll('.tickx')
    	.d(xScale.ticks(10))
    	.enter()
    		.append('svg:g')
    			.attr('transform', function(d, i) {console.log(xScale(d));
				    return "translate(" + xScale(d) + ", 0)";
			    })
			    .attr('class', 'tickx');*/
	
	//draw y ticks
    ticks.append('svg:line')
    	.attr('y1', h-xPadding)
    	.attr('y2', xPadding)
    	.attr('x1', 0)
    	.attr('x2', 0);

    //y labels
    /*ticks
    	.append('svg:text')
    		.text(function(d) {
				return d;
			})
		.attr('text-anchor', 'bottom')
		.attr('dy', 125)
		.attr('dx', -4);
	*/

	//colors
	//var color = d3.scale.category20c();
	var color = d3.scale.ordinal()
		.domain(["0", "1", "2", "3"])
		.range(["#ff0000", "#ffd200", "#e400ff", "#18ff00"]);
    	  
	//draw one or more lines
	$.each(data.json_data, function(index, data_version) {
		//since with the live data, we get full version numbers (e.g. 16.0 rather than 16)
		//console.log(Math.round(data_version.version));
		data_version.version = Math.round(data_version.version);
		
		//draw the line
		var line = d3.svg.line()
			.x(function(d){ return xScale(d.date)})
			.y(function(d){ return yScale(d.count/100)})
			.interpolate("basis");

		var flat_line = d3.svg.line()
			.x(function(d){ return xScale(d.date)})
			.y(function(d){ return yScale(d3.max(data_version.json_data).count/100)})
			.interpolate("basis");

    	var paths = svg.append("svg:path")
	    	.attr('d', flat_line(data_version.json_data))      
	   		.attr('stroke', function(d) { return color(index); })
    		.attr("class", "the_glorious_line")
    		.transition()
	    		.duration(1000)
	    		.attr("d", line(data_version.json_data));

		//draw points if chart has one line
		var circle = svg.selectAll("circle.version" + data_version.version)
   			.data(data_version.json_data)
	   		.enter()
   				.append("circle")
   				//.attr('class','point')
	   			.attr('class', function() {
	   				var version;
	   				
	   				if(isNaN(data_version.version)) 
	   					version = "version" + data_version.device_name;
	   				else
	   					version = "version" + data_version.version;
	   					
	   				return version;
	   			})
   				.attr('fill', color(index))
   				.attr('opacity', function(d, i) {
					//we don't want points for charts with more than one line, 
					//in which case, we only show last point for each line
					if(data.json_data.length > 1) {
						return 0;
					}
				})
   				.attr("cx", function(d) {
        			return xScale(d.date);
	   			})
   				.attr("cy", function(d) {
        			return yScale(d.count/100);
   				})
	   			.transition()
   				//.delay(function(d,i) { return i / data.json_data.length * enter_animation_duration})
   				.attr("r", 4);
   			
		svg.selectAll("circle")
			.on('mouseover.tooltip', function(d) {
				d3.selectAll(".tooltip").remove(); //timestamp is used as id
				d3.select(which_metric + " svg")
					.append("svg:rect")
						.attr("width", 40)
						.attr("height", 15)
						.attr("x", xScale(d.date)-22)
						.attr("y", yScale(d.count/100)-25)
						.attr("class", "tooltip_box");
						
				d3.select(which_metric + " svg")
					.append("text")
						.text(function() { return (format == "%") ? (Math.floor(d.count*10)/10)+"%" : getHumanSize(d.count); }) //don't touch percentages
						//.text(getHumanSize(d.count/100))
						.attr("x", xScale(d.date))
						.attr("y", yScale(d.count/100)-13)
						.attr("id", d.date)
						.attr("dy", "0.35m")
						.attr("text-anchor", "middle")
						.attr("class", "tooltip");
			})
			.on('mouseout.tooltip', function(d) {
				d3.select(".tooltip_box").remove();
				d3.select(".tooltip")
					.transition()
					.duration(200)
					.style("opacity", 0)
					.attr("transform", "translate(0,-10)")
					.remove();
			})
			.on('mouseover', function(d) {				
				d3.select(this)
					.transition()
			    	.attr('r', 9);
			}).on('mouseout', function() {
      			d3.select(this)
					.transition()
				   	.attr('r', 4);
      		})
			.append("text")
				.text(function(d) {
			    	return d.count/100;
			})
			.attr('class', 'line_label')
			.attr("x", function(d) {
	   			return xScale(d.date)-5;
			})
			.attr("y", function(d) {
				return yScale(d.count/100);
			});
	});
}

//draws the chart for mobile reviews
function drawMobileReviews(data, container, format) {
	var w = 250,
		h = 130,
		xPadding = 22,
		yPadding = 30,
		enter_animation_duration = 600,
		color = d3.scale.ordinal()
			.domain(["1", "2", "3", "4", "5"])
			.range(["#ff6f31", "#ff9f02", "#ffcf02", "#a4cc02", "#88b131"]);
	
	//we always use the div within the container for placing the svg
	container += " div";
	
	//for clarity, we reassign
	var which_metric = container;
	    
    //prepare our scales and axes
    var xMax = 5,
	    xMin = 1,
	    yMin = d3.min(data.json_data, function(d) { return d.count; }),
        yMax = d3.max(data.json_data, function(d) { return d.count; });
        
   	var xScale = d3.scale.linear()
            .domain([xMin, xMax])
            .range([xPadding+36, w-xPadding-20]);

    var yScale = d3.scale.linear()
            .domain([0, yMax])
            .range([h-yPadding+2, yPadding-6]);
            
    var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            //.tickFormat(d3.format(".2r"))
            .ticks(5);
            
	var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .tickFormat(d3.format(format)) //so e.g. convert 4,000,000 to 4M
            .ticks(2);
            
    //draw svg
	var svg = d3.select(container)
            .append("svg")
            .attr("width", w)
            .attr("height", h);
    
	//draw x axis
	var xAxis = svg.append("g")
    	.attr("class", "axis x")
	    .attr("transform", "translate(-2," + (h-xPadding-3) + ")")
    	.call(xAxis);
    	    	
	//draw y axis
	svg.append("g")
    	.attr("class", "axis y")
	    .attr("transform", "translate(" + (yPadding+10) + ",0)")
    	.call(yAxis);
    	
    //draw extended ticks (horizontal)
    var ticks = svg.selectAll('.ticky')
    		.data(yScale.ticks(5))
    		.enter()
    			.append('svg:g')
    			.attr('transform', function(d) {
      				return "translate(0, " + (yScale(d)) + ")";
    			})
    			.attr('class', 'ticky')
    		.append('svg:line')
    			.attr('y1', 0)
    			.attr('y2', 0)
    			.attr('x1', yPadding+6)
    			.attr('x2', w-yPadding+8);
    
    //draw left y-axis
    svg.append('svg:line')
    	.attr('x1', yPadding+6)
    	.attr('x2', yPadding+6)
    	.attr('y1', yPadding-14)
    	.attr('y2', h-xPadding);
	
	//draw bars
	var bar = svg.selectAll("rect")
   		.data(data.json_data)
   		.enter()
   			.append("rect")
   			.attr('class','bar')
   			.attr('opacity', 1)
   			.attr('fill', function(d) { return color(d.rating); })
   			.attr("x", function(d) {
        		return xScale(d.rating)-6;
   			})
   			.attr("y", function(d) {
   				return h-yPadding+2;
   			})
   			.attr("height", function(d) {
        		return 0;
   			})
   			.attr("width", 10)
   			.transition()
   			.duration(1000)
   				.attr("y", function(d) {
   					return yScale(d.count);
	   			})
   				.attr("height", function(d) {
    	    		return (h-yPadding+2) - yScale(d.count);
	   			});
	   			
	svg.selectAll("rect")
			.on('mouseover.tooltip', function(d) {
				d3.selectAll(".tooltip").remove(); //timestamp is used as id
				d3.select(which_metric + " svg")
					.append("svg:rect")
						.attr("width", 40)
						.attr("height", 15)
						.attr("x", xScale(d.count)-22)
						.attr("y", yScale(d.count)-25)
						.attr("class", "tooltip_box");
						
				d3.select(which_metric + " svg")
					.append("text")
						.text(function() { return (format == "%") ? d.count+"%" : getHumanSize(d.count); }) //don't touch percentages
						//.text(getHumanSize(d.count/100))
						.attr("x", xScale(d.rating))
						.attr("y", yScale(d.count)-13)
						.attr("id", d.name)
						.attr("dy", "0.35m")
						.attr("text-anchor", "middle")
						.attr("class", "tooltip");
			})
			.on('mouseout.tooltip', function(d) {
				d3.select(".tooltip_box").remove();
				d3.select(".tooltip")
					.transition()
					.duration(200)
					.style("opacity", 0)
					.attr("transform", "translate(0,-10)")
					.remove();
			})
			.append("text")
				.text(function(d) {
			    	return d.count;
			})
			.attr('class', 'line_label')
			.attr("x", function(d) {
	   			return xScale(d.rating)-5;
			})
			.attr("y", function(d) {
				return h-yScale(d.count);
			});
}


//draws a treemap
/*function drawTreeMap(json, container, format) {
	var w = 220,
		h = 100,
		left = 15,
		top = 14,
		//color = d3.scale.category20c();
		color = d3.scale.ordinal()
			.domain(["1", "2", "3", "4", "5"])
			.range(["#ff6f31", "#ff9f02", "#ffcf02", "#a4cc02", "#88b131"]);

	//we always use the div within the container for placing the svg
	container += " div";
	
	//for clarity, we reassign
	var which_metric = container;
    
	var treemap = d3.layout.treemap()
    	.size([w, h])
	    .sticky(true)
    	.value(function(d) { return d.size; });

	var div = d3.select(container).append("div")
    	.style("position", "relative")
    	.style("background-color", "black")
    	.style("left", left + "px")
    	.style("top", top + "px")
	    .style("width", w + "px")
    	.style("height", h + "px");

	div.data([json]).selectAll("div")
		.data(treemap.nodes)
		.enter().append("div")
			.attr("class", "treemap_cell")
			.style("background", function(d) { return (d.name) ? color(d.name.substring(0,1)) : color(d.name); })
			.call(cell)
			.text(function(d) { return d.children ? null : d.name; });
	
	function cell() {
  		this
      		.style("left", function(d) { return d.x + "px"; })
	      	.style("top", function(d) { return d.y + "px"; })
    		.style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      		.style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
	}
}
*/
