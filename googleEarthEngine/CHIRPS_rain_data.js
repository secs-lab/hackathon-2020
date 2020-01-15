////READ IN RAINFALL DATA

var bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries"),
    africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa");
	
//Filter boundaries to Africa
var bounds = bounds.filterBounds(africa);
//Plot boundaries
Map.addLayer(bounds, {}, 'bounds');

//Read in CHIRPS data, daily and pentad rainfall, filter dates
var rainDaily = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
.filter(ee.Filter.date('2000-01-01', '2019-01-01'));
var rainPentad = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
                  .filter(ee.Filter.date('2000-01-01', '2019-01-01'));
                  
//Filter to Africa: Map clip function onto each image
var rainDaily = rainDaily.map(function(im){return(im.clip(africa))});                  
// print(rainDaily, 'rainDaily'); //throws up and error when printing as too big! (works though)
var rainPentad = rainPentad.map(function(im){return(im.clip(africa))});                  
 print(rainPentad, 'rainPentad' );

//Plot precipitation
// var rainPentadVis = {
//   min: 1.0,
//   max: 17.0,
//   palette: ['001137', '0aab1e', 'e7eb05', 'ff4a2d', 'e90000'],
// };
// Map.setCenter(17.93, 7.71, 2);
// Map.addLayer(rainPentad, rainPentadVis, 'rainPentad');

////DEFINE VARIABLES

// Define time range
var startyear = 2005; //2001
var endyear = 2006; //2018

var startmonth = 1; 
var endmonth = 12; 

// List years
var years = ee.List.sequence(startyear,endyear);
// List months
var months = ee.List.sequence(startmonth,endmonth);

/////////////////////////////
////TOTAL ANNUAL RAINFALL////
////////////////////////////

/* // REMOVE TO RUN

//Aggregate total rainfall over year
var yearTotal = ee.ImageCollection.fromImages(
      years.map(function(y) {
          return rainPentad.filter(ee.Filter.calendarRange(y, y, 'year'))
                    .sum()
                    .set('year', y);
}).flatten());
print( "Annual total", yearTotal);

//Plot some years
var image = yearTotal.filterMetadata('year', 'equals', 2001);
var image = image.first();
Map.addLayer(image,{min:0, max:2000}, "2001");
var image = yearTotal.filterMetadata('year', 'equals', 2010);
var image = image.first();
Map.addLayer(image,{min:0, max:2000}, "2010");

//In order to carry out band conversion in next step need to get
//old and new names ready for renaming
var numbers = ee.List.sequence(0, yearTotal.size().subtract(1));
var oldnames = numbers.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_precipitation'))});
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_precip'))});

//Convert ImageCollection to muti-banded Image
var yearTotal = yearTotal.toBands().select(
  oldnames,
  newnames);
print(yearTotal, 'byYear');

//Summarise over study sites
var resultsTotal = yearTotal.reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});
print(resultsTotal, 'resultsTotal');

//Export to .csv on Google drive
Export.table.toDrive({
  collection: resultsTotal,	
  description: 'Total_annual_rainfall_01_18', // Change name here wrt years
  folder: "ElesOnFire"
});

*/ //REMOVE TO RUN

///////////////////////////////////////////
/////NUMBER OF MONTHS WITH LOW RAINFALL////
///////////////////////////////////////////

/* // REMOVE TO RUN

//Define low rainfall
var lowRainfall = 10;

//Aggregate total rainfall over month, then year
//Map.addLayer(byMonth.first(),{}, "Jan Mean");
var byMonthYear = ee.ImageCollection.fromImages(
      years.map(function(y) {
        return months.map(function (m) {
          return rainPentad.filter(ee.Filter.calendarRange(m, m, 'month'))
                    .filter(ee.Filter.calendarRange(y, y, 'year'))
                    .sum()
                    .set('month', m)
                    .set('year', y);
        });
}).flatten());
print( "Monthly averages by year", byMonthYear);

// Count the number of months below low rainfall threshhold per year
var droughtMonths = ee.ImageCollection.fromImages(
  years.map(function(y) {
    return byMonthYear.filterMetadata('year', 'equals', y)
                    .map(function(im) {return(im.lt(lowRainfall))}).sum()
                    .set('year', y);
}).flatten());
print( "droughtMonths", droughtMonths); 
Map.addLayer(droughtMonths.first(), {min:0, max:12}, 'droughtMonths');

//In order to carry out band conversion in next step need to get
//old and new names ready for renaming
var numbers = ee.List.sequence(0, droughtMonths.size().subtract(1));
var oldnames = numbers.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_precipitation'))});
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_drought'))});

//Convert ImageCollection to muti-banded Image
var droughtMonths = droughtMonths.toBands().select(
  oldnames,
  newnames);
print(droughtMonths, 'droughtMonths');

//Summarise over study sites
var resultsDrought = droughtMonths.reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});
print(resultsDrought, 'resultsDrought');

//Export to .csv on Google drive
Export.table.toDrive({
  collection: resultsDrought,
  description: 'Months_of_drought_01_18', // Change name here wrt years
  folder: "ElesOnFire"
});

*/ // REMOVE TO RUN

////////////////////////////////////////////////////////////////////
////DURATION, START DATE, AND END DATE OF LONGEST DROUGHT (DAYS)////
////////////////////////////////////////////////////////////////////

 // REMOVE TO RUN
 
//Set precipitation threshold in mm
var rainThresh = 1;

//Set date in ee date format
var startdate = ee.Date.fromYMD(startyear-1,startmonth,1); // get previous year to start date
var enddate = ee.Date.fromYMD(endyear,endmonth,31);

//Filter data and add in drought counter (counter),
//max date and highest drought day counter (accumMax)
var datain = rainDaily.filterDate(startdate, enddate)
  .map(function(im){
    return im.addBands(ee.Image(0).uint16().rename('duration')).clip(africa)
    .addBands(ee.Image(0).uint16().rename('counter')).clip(africa)
    .addBands(ee.Image(1).uint16().rename('maxDate')).clip(africa)
    .addBands(ee.Image(0).uint16().rename('accumMax')).clip(africa)
  }); 

// Check, for example
// var imPlot = datain.filterMetadata('system:index', 'equals', '20010123');
// Map.addLayer(ee.Image(imPlot.first()).select('maxDate'));

//Function to pull out count of dry days
function drySpells(im, list){
  // Get previous image
  var prev = ee.Image(ee.List(list).get(-1));
  // Find areas less than precipitation threshold
  var dry = im.select('precipitation').lt(rainThresh);
  // Add previous day counter to today's counter
  var accumCount = prev.select('counter').add(dry).rename('counter');
  // Get date of im, start date, and difference between them in days
  var doy = im.date();
  var doyStart = ee.Image(ee.List(list).get(0)).date();
  var doyDiff = doy.difference(doyStart, 'day'); //day count from start
  // Update max count,but only start updating when passed year mark(still captures dry spells 'crossing' new year)
  var accumMax = ee.Image(ee.Algorithms.If(ee.Number(doyDiff).gt(365),
                          prev.select('accumMax').max(accumCount), //update if past 365
                          ee.Image(prev.select('accumMax')))).rename('accumMax'); //don't update if not
  // create a result image for iteration
  // precip > thresh will stop counting and reset 'counter
  // accumCount == accumMax will overwrite the maxDate date, if over 365
  // Duration is the longest dry spell that ends in year t
  var out = im.select('precipitation')
            .addBands(im.select('duration').where(dry.eq(1).and(doyDiff.gt(365)),accumCount)).uint16()
            .addBands(im.select('counter').where(dry.eq(1),accumCount)).uint16()
            .addBands(im.select('maxDate').where(accumCount.eq(accumMax), doyDiff)).uint16() //*
            .addBands(accumMax).uint16();
  return ee.List(list).add(out)
  ;}
// * The reason for running over 2 years is to include the dry spells that occur around the new year


//Calculate the annual max dryspell, map the function
//...will split by calendar year, which might not be optimal...
var maxDrySpell =  ee.ImageCollection.fromImages(
  years.map(function (y) {
      var w = datain.filter(ee.Filter.calendarRange(ee.Number(y).subtract(1), y, 'year'))// start at t-1 year 
      var first = ee.List([ee.Image(w.first())]);   
      var w1 = ee.ImageCollection.fromImages(w.iterate(drySpells,first)).max() 
    return w1.set('year', y)
}).flatten())
print(maxDrySpell,'maxDrySpell');

// Check, for example
 //var imPlot = maxDrySpell.filterMetadata('system:index', 'equals', '337');
//Map.addLayer(imPlot.first().select('maxDate'), {}, 'testtest');

//Choose variable and export
// From this point, select duration, minDate or maxDate and then export

////Length in days of dry spell
// Select band
var maxDays = maxDrySpell.select('duration');

//Reassign band names so that they are unique, not just 'counter'
var maxDays = maxDays.map(function(im){ 
  return im.rename([im.get("system:index")])});

//Print and plot  
print(maxDays,'maxDays');
Map.addLayer(maxDays.first(),
{min: 0, max: 365*2, palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'Dry Spell Duration');

//In order to carry out band conversion in next step need to get
//old and new names ready for renaming
var oldnames = ee.List.sequence(0, maxDays.size().subtract(1));
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_maxDays'))});

//Convert ImageCollection to muti-banded Image
var maxDays = maxDays.toBands().select(
  oldnames,
  newnames);

//Summarise over study sites
var resultsMaxDays = maxDays.reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});
//print(resultsMaxDays, 'resultsMaxDays'); //Can only print for a couple of years, otherwise fails

//Export to .csv on Google drive
Export.table.toDrive({
  collection: resultsMaxDays,
  description: 'duration_dry_spell_05_06',
  folder: "ElesOnFire"
});

////Start date of dry spell
// Select band, calculate as end date minus length of drought
var minDate = ee.ImageCollection.fromImages(
  years.map(function(y) {
    var maxDateFilt = maxDrySpell.filterMetadata('year', 'equals', y).select('maxDate').first()
    var maxDaysFilt = maxDrySpell.filterMetadata('year', 'equals', y).select('counter').first()
    return maxDateFilt.subtract(maxDaysFilt).add(1).set('year', y);
}).flatten());

//Reassign band names so that they are unique, not just 'counter'
var minDate = minDate.map(function(im){ 
  return im.rename([im.get("system:index")])});

//Print and plot  
print(minDate,'minDate');
Map.addLayer(minDate.first(),
{min: 0, max: 365*2 ,palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'Dry Spell Start Date');

//In order to carry out band conversion in next step need to get
//old and new names ready for renaming
var oldnames = ee.List.sequence(0, minDate.size().subtract(1));
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_minDate'))});

//Convert ImageCollection to muti-banded Image
var minDate = minDate.toBands().select(
  oldnames,
  newnames);

//Summarise over study sites
var resultsMinDate = minDate.reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});
//print(resultsMinDate, 'resultsMinDate'); //Can only print for a couple of years, otherwise fails

//Export to .csv on Google drive
Export.table.toDrive({
  collection: resultsMinDate,
  description: 'minDate_dry_spell_05_06',
  folder: "ElesOnFire"
});

////End date of dry spell
// Select band 
var maxDate = maxDrySpell.select('maxDate');

//Reassign band names so that they are unique, not just 'counter'
var maxDate = maxDate.map(function(im){ 
  return im.rename([im.get("system:index")])});

//Print and plot  
print(maxDate,'maxDate');
Map.addLayer(maxDate.first(),
{min: 0, max: 365*2 ,palette:'#9ecae1,#ffffff,#ffeda0,#feb24c,#f03b20'},'Dry Spell End Date');

//In order to carry out band conversion in next step need to get
//old and new names ready for renaming
var oldnames = ee.List.sequence(0, maxDate.size().subtract(1));
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_maxDate'))});

//Convert ImageCollection to muti-banded Image
var maxDate = maxDate.toBands().select(
  oldnames,
  newnames);

//Summarise over study sites
var resultsMaxDate = maxDate.reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});
//print(resultsMaxDate, 'resultsMaxDate'); //Can only print for a couple of years, otherwise fails

//Export to .csv on Google drive
Export.table.toDrive({
  collection: resultsMaxDate,
  description: 'maxDate_dry_spell_05_06',
  folder: "ElesOnFire"
});

 // REMOVE TO RUN
