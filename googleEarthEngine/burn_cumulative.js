var bounds = ee.FeatureCollection("users/colinbeale/ElesOnFire/boundaries");
var africa = ee.FeatureCollection("users/colinbeale/ElesOnFire/Africa");

var bounds = bounds.filterBounds(africa);
//Map.addLayer(bounds, {}, 'bounds');
//Map.addLayer(africa, {}, 'africa');

var dataset = ee.ImageCollection('MODIS/051/MCD45A1')
                  .filterDate('2001-01-01', '2019-12-31');

//Filter to Africa: Map clip function onto each image
var dataset = dataset.map(function(im){
  return(im.clip(africa))});                  
print(dataset);

var dataset2 = dataset.map(function(im){
  return(im.mask(im.lt(366)))});                  
print(dataset2);

var burnedArea = dataset2.select('burndate');

Map.setCenter(20, 8, 3);
//Map.addLayer(burnedArea, {min:0, max:366}, 'Burned Area');

//Aggregate count of burns over years
var years = ee.List.sequence(2001, 2017);
var byYear = ee.ImageCollection.fromImages(
      years.map(function(y) {
          return burnedArea.filter(ee.Filter.calendarRange(y, y, 'year'))
                    .max()
                    .gt(0)
                    .set('year', y);
}).flatten());
print( "burndate", byYear);

//var ba_byYear = byYear.toBands();
//print(ba_byYear);

var numbers = ee.List.sequence(0, byYear.size().subtract(1));
var oldnames = numbers.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_burndate'))});
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_burn'))});

print(oldnames);
print(newnames);

var ba_byYear = byYear.toBands().select(
  oldnames,
  newnames);
  
print(ba_byYear, 'byYear');

//Map.addLayer(ba_byYear, {min:0, max:1}, 'byYear');
//Map.addLayer(ba_byYear.select('2001_burn'), {min:0, max:1}, 'byYear');


//var time0 = ba_byYear.select('2001_burn');
//var time1 = ba_byYear.select('2002_burn');

//var diff = time0.add(time1);

//Map.addLayer(diff, {min:0, max:2}, 'diff');

//var cum_burn = ba_byYear.select(0);

//var t0 = ba_byYear.select(0);
//var t1 = ba_byYear.select(1);

//var diff = t1.add(t0);

//var cum_burn = cum_burn.addBands(diff)
//print(cum_burn);
//Map.addLayer(cum_burn.select(1), {min:0, max:2}, 'cum_burn');

var i = 0;
var cum_burn = ba_byYear.select(0);

while(i<16){
  
  var t = cum_burn.select(i);
  var t1 = ba_byYear.select(i+1);
  
  var diff = t1.add(t);
  cum_burn = cum_burn.addBands(diff);
  
  i = i + 1;
  
  }


print(cum_burn);
Map.addLayer(cum_burn.select(16), {min:0, max:17}, 'cum_burn');

var results = cum_burn.reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});

print(results);

//Export the output feature collection to Google Drive as a csv file
Export.table.toDrive({ 
  collection: results,
  description:'cumulative_burn',
  folder: 'ElesOnFire',
  fileFormat: 'csv'});

