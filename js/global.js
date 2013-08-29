"use strict";

var LANG;
var business_selected = true,
	engineering_selected = true,
	operations_selected = true,
	selectedCountries = new Object(),
	gracefully_backdate_to = "";
	
//changing these parameters triggers new queries
var selectedTimePeriod = 3, //default is 3 months
	selectedRegion = "",
	countries_str = "All", //default is all countries
	inc_delay_between_charts = 0; //how many ms should we wait before drawing subsequent charts
	
var regions = new Object();
	regions["ASIA"] 	= "AS,AU,BV,IO,BN,KH,CN,CX,CC,CK,FJ,PF,TF,GU,HM,HK,ID,JP,KI,LA,MO,MY,MH,FM,NR,NC,NZ,NU,NF,MP,KP,PW,GN,PH,PN,WS,SG,SB,GS,KR,TW,TH,TL,TO,TK,TV,UM,VU,VN,WF,AF,AM,AZ,BD,BT,MM,IN,KZ,KG,MV,MN,NP,PK,LK,TJ,TM,UZ";
	regions["EMEA"] 	= "AL,AD,AT,BY,BE,BA,BG,HR,CY,CZ,DK,DE,EE,FO,FI,FR,GE,DE,GI,GR,GG,HU,IS,IE,IM,IT,JE,LV,LI,LT,LU,MK,MT,FR,MD,MC,ME,NL,NO,PL,PT,RO,RU,SM,RS,ME,SK,SI,ES,SJ,SE,CH,TR,UA,GB,VA,AX,DZ,AO,BH,BJ,BW,BF,BI,CM,CV,CF,TD,KM,CG,CI,DJ,EG,GQ,ER,ET,GA,GM,GH,GN,GW,IR,IQ,IL,JO,KE,KW,LB,LS,LR,LY,MG,MW,ML,MR,MU,YT,MA,MZ,NA,NE,NG,OM,PS,QA,RW,RE,SH,ST,SA,SN,SC,SL,SO,ZA,SD,SZ,SY,TZ,TG,TN,UG,AE,EH,YE,ZM,ZW";
	regions["SOAM"] 	= "AR,BO,BR,CL,CO,EC,FK,GF,GY,PY,PE,SR,UY,VE";
	regions["NOAM"] 	= "AI,AG,AW,BS,BB,BZ,BM,VG,CA,KY,CR,CU,DM,DO,SV,GL,GD,GP,GT,HT,HN,JM,MQ,MS,MX,AN,NI,PA,PR,KN,LC,PM,VC,TT,TC,US,VI";
	
$(document).ready(function () {	
	//prepend the more info link to all charts
	$(".chart_container").each(function(i, value) {
		var moreinfo_html = "<a href='#'>"
				+ "<img src='images/moreinfo.png' class='moreinfo' id='moreinfo_" 
				+ $(value).attr("id") + "' alt='more info' title='Click for more info about this metric' /></a>";
				
		$(this).prepend(moreinfo_html);
	});
	
	//provide lang literals globally
	d3.json("lang/en_US.json", function(data) {
		LANG = data;
		
		//other initializations
		$("input, textarea, select").uniform();
		//touchDropdown();
		assignEventListeners();
		drawCharts();
	});
});

//slideshow mode
function auto() {
	var i=0;
	
	//when the user first clicks the button, show splash for immediate feedback
	console.log("showing metrics splash");
	
	$("#metrics_splash_back").fadeIn("fast");
	$("#metrics_splash").fadeIn("slow");	
	
	//clear initial splash after 4s
	setTimeout(function() {
		auto_reset();
	}, 4000);
	
	var auto_mode_id = setInterval(function() {
		auto_reset();
		
		console.log("resetting");
			
		//screens to cycle through
		if(i == 0) {
			//show numbers
			console.log("showing numbers");
			switchViewToNumbers();
		}
		else if(i == 1) {
			//show charts for a random region {EMEA, NOAM, SOAM, ASIA}
			console.log("showing charts for a random region");
			
			selectedRegion = "EMEA";
			$("#region span").html("EMEA")
			countries_str = buildCountriesStringFromRegion(selectedRegion);
			switchViewToCharts();
		}
		else if(i == 2) {
			//show numbers for a random region {EMEA, NOAM, SOAM, ASIA}
			console.log("showing charts for a random region");
			
			selectedRegion = "EMEA";
			$("#region span").html("EMEA")
			
			console.log("showing numbers");
			switchViewToNumbers();
		}
		else if(i == 3) {
			//show charts for a random region {EMEA, NOAM, SOAM, ASIA}
			console.log("showing charts for a random region");
			
			selectedRegion = "NOAM";
			$("#region span").html("North America")
			countries_str = buildCountriesStringFromRegion(selectedRegion);
			switchViewToCharts();
		}
		else if(i == 4) {
			//show numbers for a random region {EMEA, NOAM, SOAM, ASIA}
			console.log("showing charts for a random region");
			
			selectedRegion = "NOAM";
			$("#region span").html("North America")
			
			console.log("showing numbers");
			switchViewToNumbers();
		}
		else if(i == 5) {
			//show metrics splash
			console.log("showing metrics splash");
			
			$("#metrics_splash_back").fadeIn("fast");
			$("#metrics_splash").fadeIn("slow");
			
			//clear initial splash after 4s
			setTimeout(function() {
				auto_reset();
			}, 4000);
		}
		else if(i == 6) {
			//show charts
			console.log("showing charts");
			switchViewToCharts();
		}
		
		console.log(i);
		if(i == 6) i = 0;
		else i++;
	}, 10000);
	
	//console.log(auto_mode_id);
	
	return auto_mode_id;
}

function auto_reset() {
	//reset
	selectedRegion = "";
	countries_str = "All";
	$("#region span").html("Worldwide");
	if( $('#metrics_splash').is(':visible')) {
		$("#metrics_splash").fadeOut("slow", function() {
			$("#metrics_splash_back").fadeOut("fast");
		});
	};
}

function assignEventListeners() {
	var auto_mode_id=0;
	$("#auto_button").toggle(function (e) {
		$(this).attr("src", "images/auto_button_on.png");
		auto_mode_id = auto();
		return false;
	},function (e) {
		$(this).attr("src", "images/auto_button_off.png");
		clearInterval(auto_mode_id);
		
		//console.log("clearing " + auto_mode_id);
		
		return false;
	});
	
	$("#switch").click(function (e) {
		if($(this).attr("class") == "charts") {
			switchViewToNumbers();
		}
		else if($(this).attr("class") == "numbers") {
			switchViewToCharts();
		}
		
		return false;
	});
	
	$("#numbers").click(function(e) {
		switchViewToNumbers();
		return false;
	});
	
	$("#charts").click(function(e) {
		switchViewToCharts();
		return false;
	});
	
	var hoverIntentConfig = {    
		over: chartContainerEnter,
		interval: 50,
		timeout: 900,
		out: chartContainerLeave
	};
	$(".chart_container").hoverIntent(hoverIntentConfig);

	$(".moreinfo").click(function(e) {
		//alert("clicking this will bring up more info about the metric, ...");
		$(".dim").show();
		
		//get details of calling metric
		var srcE = e.srcElement ? e.srcElement : e.target; 
		var lookup_id = $(srcE.parentElement.parentElement).attr("id");
		var title = $("#" + $(srcE.parentElement.parentElement).attr("id") + " span").html();

		$("#modal_box h2").html(title);
		$("#modal_box p#content_what").html(LANG[lookup_id].what);
		$("#modal_box p#content_how").html(LANG[lookup_id].how);
		$("#modal_box").show();
		
		return false;
	});
	
	$(".close_modal_box").click(function(e) {
		$(".dim").hide();
		$(".modal").hide();
	});
	
	$(".dim").click(function(e) {
		$(".dim").hide();
		$(".modal").hide();
	});
	
	document.onkeydown = function(evt) {
    	evt = evt || window.event;
	    if (evt.keyCode == 27) {
    	    $(".dim").hide();
			$(".modal").hide();
    	}
	};
	
	function chartContainerEnter(e) {
		var moreinfo_button = $("#moreinfo_" + $(this).attr("id"));
		
		//prevent multiple, rapid mouseenters
		if(moreinfo_button.css("opacity") == 0) {
			moreinfo_button.fadeTo(400,1);
		}
	}

	function chartContainerLeave(e) {
		$("#moreinfo_" + $(this).attr("id")).fadeTo(400,0);
	}
	
	
	$("#time_period img").mouseenter(function (e) {
		$("#time_period_menu").show();
	});
	
	$("#time_period img").mouseleave(function (e) {
		$("#time_period_menu").hide();
	});
	
	$("#time_period_menu").mouseenter(function (e) {
		$("#time_period_menu").show();
	});
	
	$("#time_period_menu").mouseleave(function (e) {
		$("#time_period_menu").hide();
	});
	
	$("#time_period_menu ul li a").on("click", function (e) {
		var selectedTimePeriod_prev = selectedTimePeriod;
		
		$("#time_period_menu ul li a").css("color", "#3b3b3b").css("font-weight", "normal");
		
		var srcE = e.srcElement ? e.srcElement : e.target; 
		$(srcE).css("font-weight", "bold").css("color", "#000000");
		
		$("#time_period span").html($(srcE).html());
		//alert("once the wiring to the metrics db is done, changing this would dynamically update the above data.");
		
		selectedTimePeriod = $(this).attr("code");
		//console.log(selectedTimePeriod);
		
		if(selectedTimePeriod != selectedTimePeriod_prev) {
			//reload data for this time period and redraw charts/numbers
			drawCharts();
			$("#switch").attr("src", "images/switch_charts_dark.png");
			$("#switch").attr("class", "charts");
		
			$("#uptake_legend").delay(500).fadeIn();
			$(".hl_seperator").hide();
		}
		
		return false;
	});
	
	$("#region img").mouseenter(function (e) {
		$("#region_menu").show();
	});
	
	$("#region img").mouseleave(function (e) {
		$("#region_menu").hide();
	});
	
	$("#region_menu").mouseenter(function (e) {
		$("#region_menu").show();
	});
	
	$("#region_menu").mouseleave(function (e) {
		$("#region_menu").hide();
	});
	
	$("#region_menu ul li a").on("click", function (e) {
		$("#region_menu ul li a").css("color", "#3b3b3b").css("font-weight", "normal");
			
		var srcE = e.srcElement ? e.srcElement : e.target; 
		$(srcE).css("font-weight", "bold").css("color", "#000000");
		
		//if we clicked on a region
		if($(srcE).attr("id") != "pick_countries") {
			var countries_str_prev = countries_str;
			
			//alert("once the wiring to the metrics db is done, changing this would dynamically update the above data.");
			//get new data now that the region has been changed
			countries_str = buildCountriesStringFromRegion($(srcE).attr("code"));
			selectedRegion = $(srcE).attr("code");

			console.log(countries_str);
			console.log(selectedRegion);
			
			if(countries_str != countries_str_prev) {
				//sendQueries();
				drawCharts();
				$("#switch").attr("src", "images/switch_charts_dark.png");
				$("#switch").attr("class", "charts");
		
				$("#uptake_legend").delay(500).fadeIn();
				$(".hl_seperator").hide();
			}
		}
		//if we clicked on "choose country"
		else {
			//reset previous country selections, we do a click to reset toggle()
			$.each(selectedCountries, function(index, value) {
				$("#accordion div ul li a[code='" + index + "']").click()
			});
			
			//$("#accordion div ul li").css("background-image", "none");
			selectedCountries= new Object();
			countries_str="";

			$(".dim").show();
			$("#country_picker_box").show();
			
			$("#accordion").accordion({
				autoHeight: false,
				collapsible: true,
				active: false,
				fillSpace:true
			});
		}
		
		$("#region span").html($(srcE).attr("value"));
		
		return false;
	});
	
	$("body").bind('keyup', function(e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 37) { //left arrow loads charts
			switchViewToCharts();	
			return false;
		}
		else if(code == 39) { //right arrow loads numbers
			switchViewToNumbers();	
			return false;
		}
	});
	
	$("#country_picker_box #done_button").on("click", function(e) {
		//console.log(selectedCountries);
		var countries_str_prev = countries_str;
		countries_str = buildCountriesString();
		
		//console.log(countries_str_prev);
		console.log(countries_str);
		
		//resend only if different than previous
		if(countries_str_prev != countries_str) {
			//clear the region
			selectedRegion = "";
				
			//sendQueries();
			drawCharts();
			$("#switch").attr("src", "images/switch_charts_dark.png");
			$("#switch").attr("class", "charts");
		
			$("#uptake_legend").delay(500).fadeIn();
			$(".hl_seperator").hide();
		}
		
		$(".dim").hide();
		$(".modal").hide();
	});
	
	//hover and click logic for footer category buttons {business, engineering, operations}
	$(".cat-button:not(.ui-state-disabled)")
		.hover(
			function(){ 
				$(this).addClass("ui-state-hover"); 
			},
			function(){ 
				$(this).removeClass("ui-state-hover"); 
			}
		)
		.mousedown(function(){
				$(this).parents('.cat-buttonset-single:first').find(".cat-button.ui-state-active").removeClass("ui-state-active");
				if( $(this).is('.ui-state-active.cat-button-toggleable, .cat-buttonset-multi .ui-state-active') ){ $(this).removeClass("ui-state-active"); }
				else { $(this).addClass("ui-state-active"); }
		})
		.mouseup(function(){
			if(! $(this).is('.cat-button-toggleable, .cat-buttonset-single .cat-button,  .cat-buttonset-multi .cat-button') ){
				$(this).removeClass("ui-state-active");
			}
		});
	
	//click handlers for footer category buttons
	$("#business").toggle(function(e) {
		business_selected = false;
		$("li.business:not('" + logimagi("business") + "')").fadeTo("slow", 0.3);
	}, function() {
		business_selected = true;
		$("li.business").fadeTo("slow", 1);
	});
	
	$("#engineering").toggle(function(e) {
		engineering_selected = false;
		$("li.engineering:not('" + logimagi("engineering") + "')").fadeTo("slow", 0.3);
	}, function() {
		engineering_selected = true;
		$("li.engineering").fadeTo("slow", 1);
	});
	
	$("#operations").toggle(function(e) {
		operations_selected = false;
		$("li.operations:not('" + logimagi("operations") + "')").fadeTo("slow", 0.3);
	}, function() {
		operations_selected = true;
		$("li.operations").fadeTo("slow", 1);
	});
	
	//only show the 'scroll arrow' if we're not at the bottom of the page
	var show_arrow = true;
	if(isScrollBottom()) { show_arrow = false; }
		
	$(window).scroll(function(){
		if(isScrollBottom()) { show_arrow = false; }
	});
	
	//show scroll-down arrow animation
	if(show_arrow == true) {
	setTimeout(function() {
		if(show_arrow == true) {
			$(".arrow_down").fadeTo("fast",0.01).animate({
				opacity: 0.4,
				marginBottom: '15px'
			}, 250, function() {
				$(".arrow_down").animate({
					opacity: '0',
					marginBottom: '0'
				}, 500, function() {
					$(this).fadeOut("fast");
				});
			});
			}
		}, 2000);
	}
	
	$("#accordion div ul li").toggle(function() {
		$(this).css("background-image", "url(images/check_dark.png)");
		selectedCountries[$(this).children("a").attr("code")] = "1";
		//console.log(selectedCountries);
	}, function() {
		$(this).css("background-image", "none");
		selectedCountries[$(this).children("a").attr("code")] = "0";
		//console.log(selectedCountries);
	});
}

function sendQueries() {
	//get fresh jsons from db based on new filters
	//countries_str, selectedTimePeriod
	console.log("sending dynamic query after param change");
}

//converts a map of countries to a string
function buildCountriesString() {
	//create csv of selected countries to pass to query
	var csv = "";
	for(var key in selectedCountries) {
		if(selectedCountries[key] == "1") { //since we don't remove entries, but just set their values to 0 once deselected
			csv += key + ",";
		}
	}
	
	if(csv == "")
		return "All";
	else
		return csv.slice(0, -1);
}

//builds a string of countries based on the region that's passed in
function buildCountriesStringFromRegion(region) {
	if(region == "")
		return "All";
	else
		return regions[region];
}

function isScrollBottom() {
	var documentHeight = $(document).height();
	var scrollPosition = $(window).height() + $(window).scrollTop();
	return (documentHeight == scrollPosition);
}

function logimagi(category_clicked) {
	var str="";
	if(category_clicked != "engineering" && engineering_selected)
		str += ",li.engineering";
	else if(category_clicked != "operations" && operations_selected)
		str += ",li.operations";
	else if(category_clicked != "business" && business_selected)
		str += ",li.business";
		
	return str;
}	

function switchViewToNumbers() {
	//$(".chart_container div").css("background-image", "none");

	if(!$("#uptake_legend").is(":visible"))
		return;
		
	$("#uptake_legend").fadeOut();
	$(".hl_seperator").fadeIn();
	
	$("#switch").attr("src", "images/switch_numbers_dark.png");
	$("#switch").attr("class", "numbers");
	
	$.each($(".chart_container"), function(index, value) {
		var id = $(value).attr("id"),
			avg,
			avg_str,
			html_content;
			
		//load the "plus_countries" file if we chose a country
		var the_file;
		if(countries_str != "All" 
				&& (id == "chart_desktop_downloads" || id == "chart_desktop_adi" || id == "chart_mobile_downloads" || id == "chart_mobile_adi" || id == "chart_desktop_uptake")) {
			the_file = "data/" + which_day() + "/" + id + "_plus_countries.json";
		}
		else {
			the_file = "data/" + which_day() + "/" + id + ".json";
		}
			
		d3.json(the_file, function(data) {
			//first, let's bypass the fxos charts for now
			if(id == "chart_fxos_activations" || id == "chart_fxos_uptake") {
				$("#" + id + " div")
					.css("font-weight", "300")
					.css("font-size", "12px")
					.html("<p style='padding:0;margin:0;padding-top:50px'>data currently<br />unavailable</p>");

				return false;
			}

			if(id == "chart_desktop_uptake" || id == "chart_fxos_uptake") {
				//TODO can't do the below until the uptake data is changed per my email to daniel on nov 1, 2012
				//if we have a region, update counts so that we can continue to use d.count below
				/*if(selectedRegion != "") {
					$.each(data.json_data, function(index_outer, value_outer) {
						$.each(value_outer.json_data, function(index_inner, value_inner) {
							value_outer.json_data[index_inner].count = eval("value_inner.regions[0]."+selectedRegion);
						});
					});
				}*/
				//if we have a country, update counts so that we can continue to use d.count below
				/*else if(countries_str != "All") {
					$.each(data.json_data, function(index_outer, value_outer) {
						$.each(value_outer.json_data, function(index_inner, value_inner) {
							value_outer.json_data[index_inner].count = eval("value_inner.countries[0]."+countries_str); //TODO: *100 since data is not consistent, bring it up with daniel at some point
						});
					});
				}*/
	
				//for uptake, show max for latest version
				//avg = d3.max(data.json_data[data.json_data.length-1].json_data, function(d) { return d.count; });
				avg = d3.max(data.json_data[0].json_data, function(d) { return Number(d.count); });
				avg = getHumanSize(avg);
				
				html_content = "<div class='number_container'><div class='number shadow' style='height:80px'>" + avg + "<span class='last_letter'>%</span></div>"
					+ "<div class='footnote shadow' style='height:18px'>worldwide users on " + LANG.latest_version + "</div></div>";
			}
			else if(id == "chart_mobile_reviews") {
				var sum = d3.sum(data.json_data, function(d) { return d.count*d.rating; });
				var number_of_reviews = d3.sum(data.json_data, function(d) { return Number(d.count); });
				avg = sum / number_of_reviews;
				
				html_content = "<div class='number_container'><div class='number shadow' style='height:80px'>" + getHumanSize(avg) + "</div>"
					+ "<div class='footnote shadow' style='height:18px'>worldwide average</div></div>";
			}
			else {
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
			
						//the below line is only if we're allowing single country selections
						//data.json_data[i].count = eval("value.countries[0]."+countries_str);
					});
				}
			
				avg = d3.mean(data.json_data, function(d) { return Number(d.count); });
				avg = getHumanSize(avg);
				
				//css, y u no have last-letter :( make it smaller if it's not a number
				avg_str = avg.substring(0, avg.length-1);
				avg_str +=	(isNumber(avg.charAt(avg.length-1))) ? avg.charAt(avg.length-1) : "<span class='last_letter'>" + avg.charAt(avg.length-1) + "</span>";
				
				html_content = "<div class='number_container'><div class='number shadow' style='height:80px'>" + avg_str + "</div>"
					+ "<div class='footnote shadow' style='height:18px'>on average per day</div></div>";
			}
			
			setTimeout(function() {		
				$(".chart_container div").css("background-position", "-50% -50%");
			}, 10);
			
			$("#" + id + " div").html(html_content).show();
		});
	});
}

function switchViewToCharts() {
	//if($("#uptake_legend").is(":visible"))
	//	return;
		
	//make titles normal
	//$(".chart_container .container_title").css("font-weight", "200");
			
	$("#switch").attr("src", "images/switch_charts_dark.png");
	$("#switch").attr("class", "charts");
		
	$("#uptake_legend").delay(500).fadeIn();
	$(".hl_seperator").hide();
	
	drawCharts();
}

function drawCharts() {
	$(".chart_container div").empty();
	$(".chart_container div").css("background-position", "50% 50%");
	//	return;
		
	//draw the charts
	var inc_delay=0;
	$.each($(".chart_container"), function(index, value) {
		setTimeout(function() {
			var id= $(value).attr("id"); //console.log("id is " + id);
			//$("#" + id + " div").empty();

			//load the "plus_countries" file if we chose a country
			var the_file;
			if(countries_str != "All" 
					&& (id == "chart_desktop_downloads" || id == "chart_desktop_adi" || id == "chart_mobile_downloads" || id == "chart_mobile_adi" || id == "chart_desktop_uptake")) {
				the_file = "data/" + which_day() + "/" + id + "_plus_countries.json";
			}
			else {
				the_file = "data/" + which_day() + "/" + id + ".json";
			}
		
			d3.json(the_file, function(data) { 
				//first, let's bypass the fxos charts for now
				if(id == "chart_fxos_activations" || id == "chart_fxos_adi" || id == "chart_fxos_uptake") {			
					$("#" + id + " div")
						.css("font-weight", "300")
						.css("font-size", "12px")
						.css("background-image", "none")
						.html("<p style='padding:0;margin:0;padding-top:50px'>data currently<br />unavailable</p>");

					return false;
				}

				//we use draw for charts, except when we need specific renderings, e.g. for uptake
				if(id == "chart_desktop_uptake" || id == "chart_fxos_uptake") {
					//populate uptake legend
					$("#uptake_legend #latest span").html(Math.round(data.json_data[3].version));
					$("#uptake_legend #latest_minus_1 span").html(Math.round(data.json_data[2].version));
					$("#uptake_legend #latest_minus_2 span").html(Math.round(data.json_data[1].version));
					$("#uptake_legend #latest_minus_3 span").html(Math.round(data.json_data[0].version));
					
					drawMultipleLinesChart(data, "#" + id, "%");
				}
				else if(id == "chart_mobile_reviews") {
					//drawBarChart(data, "#" + id, "s")
					//drawTreeMap(data, "#" + id, "s")
					drawMobileReviews(data, "#" + id, "s");
				}
				else {
					draw(data, "#" + id, "s", true);
				}
			});
		}, inc_delay);

		inc_delay=inc_delay+inc_delay_between_charts;
	});
}

function which_day() {
	if(gracefully_backdate_to != "")
		return gracefully_backdate_to;
		
	var d = new Date();
	return (d.getDay() > 0) ? d.getDay() : 7;
}

/**
 * Helper functions (typically from StackOverflow)
 */
 
function randomRange(minVal,maxVal,floatVal) {
  var randVal = minVal+(Math.random()*(maxVal-minVal));
  return typeof floatVal=='undefined'?Math.round(randVal):randVal.toFixed(floatVal);
}

function addCommas(nStr) {
	nStr += '';
	var x = nStr.split('.');
	var x1 = x[0];
	var x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}


function getHumanSize(size) {
	var sizePrefixes = ' kMbtpezyxwvu';
	if(size <= 0) return '0';
	var t2 = Math.min(Math.floor(Math.log(size)/Math.log(1000)), 12);
	//return (Math.round(size * 100 / Math.pow(1000, t2)) / 100) +
	return (Math.round(size * 10 / Math.pow(1000, t2)) / 10) +
		sizePrefixes.charAt(t2).replace(' ', '');
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
