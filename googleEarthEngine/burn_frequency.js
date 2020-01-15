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
var newnames = years.map(function(y) { return(ee.String(ee.Number(y).int()).cat('_burn_freq'))});

print(oldnames);
print(newnames);

var ba_byYear = byYear.toBands().select(
  oldnames,
  newnames);
  
print(ba_byYear, 'byYear');

var j = 0;
var burn_freq = ba_byYear.select(j).eq(0);

/*var t = ba_byYear.select(j);
var t1 = ba_byYear.select(j).eq(0);

Map.addLayer(t, {min:0, max:1}, 'norm');
Map.addLayer(t1, {min:0, max:1}, 'invert');*/

while(j < 16){
  
  var t = burn_freq.select(j);
  var t1 = ba_byYear.select(j+1).eq(0);
  
  var diff = t1.add(t).multiply(t1);
  burn_freq = burn_freq.addBands(diff);
  
  j = j + 1;
  
  }

print(burn_freq);
Map.addLayer(burn_freq.select(16), {min:0, max:17}, 'burn_freq');

//

var results = burn_freq.reduceRegions({
  collection: bounds,
  reducer: ee.Reducer.mean(),
  scale:1000
});

print(results);

//Export the output feature collection to Google Drive as a csv file
Export.table.toDrive({ 
  collection: results,
  description:'burn_freq',
  folder: 'ElesOnFire',
  fileFormat: 'csv'});

